import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { ledgerPath, record } from '../../scripts/session-ledger.mjs';
import { fingerprint, shouldPushBack } from '../../scripts/stop-continuation.mjs';
import { stopResponse } from '../../scripts/stop-response.mjs';
import { fireHook } from './sensor-harness.mjs';

const session = 'behavior-stop-probe';
const source = 'src/stop-probe.ts';
const spec = 'test/stop-probe.test.ts';

const CAVE = `export function torchIsLit(turns: number): boolean {
  return turns < 5;
}
`;

const WEAK = `import { expect, it } from 'vitest';

import { torchIsLit } from '../src/stop-probe.js';

it('answers something', () => {
  expect(torchIsLit(1)).toBe(true);
});
`;

function markerPath() {
  return path.resolve('reports/ledger', `${session}.behavior.json`);
}

function forget() {
  rmSync(ledgerPath(session), { force: true });
  rmSync(markerPath(), { force: true });
  rmSync(path.resolve(source), { force: true });
  rmSync(path.resolve(spec), { force: true });
}

function plantWeakWork() {
  mkdirSync(path.dirname(path.resolve(source)), { recursive: true });
  writeFileSync(path.resolve(source), CAVE);
  writeFileSync(path.resolve(spec), WEAK);
  record(session, [source]);
}

const failing = {
  passed: false,
  report: 'SENSOR behavior: FAIL (1 finding)',
  findings: [],
};

describe('what the Stop hook answers', () => {
  it('lets a clean turn end', () => {
    expect(stopResponse({ passed: true, report: '' }, true)).toEqual({ continue: true });
  });

  it('lets a turn end when the tier had nothing to look at', () => {
    const nothing = { passed: true, outcome: 'skip', report: 'SKIP' };

    expect(stopResponse(nothing, true)).toEqual({ continue: true });
    expect(stopResponse(null, true)).toEqual({ continue: true });
  });

  it('blocks the first time it has something to say', () => {
    expect(stopResponse(failing, true)).toMatchObject({ decision: 'block' });
  });

  it('says it once more and then gets out of the way', () => {
    const answer = stopResponse(failing, false);

    expect(answer.continue).toBe(true);
    expect(answer.systemMessage).toContain('still has findings');
  });
});

describe('the guard against a Stop loop', () => {
  afterEach(forget);

  const finding = [{ rule: 'mutant-survived', where: 'src/a.ts:2:7' }];

  it('reads the same findings in any order as one push-back', () => {
    const swapped = [...finding, { rule: 'mutant-uncovered', where: 'src/a.ts:9' }];

    expect(fingerprint(swapped)).toBe(fingerprint([...swapped].reverse()));
  });

  it('pushes back once per set of findings, not once per turn', () => {
    expect(shouldPushBack(session, finding)).toBe(true);
    expect(shouldPushBack(session, finding)).toBe(false);
  });

  it('pushes back again when the findings change', () => {
    shouldPushBack(session, finding);

    expect(
      shouldPushBack(session, [{ rule: 'mutant-uncovered', where: 'src/b.ts:4' }]),
    ).toBe(true);
  });

  it('gives up after three, whatever the agent does next', () => {
    const answers = Array.from({ length: 5 }, (_, index) =>
      shouldPushBack(session, [{ rule: 'mutant-survived', where: `src/a.ts:${index}` }]),
    );

    expect(answers).toEqual([true, true, true, false, false]);
  });
});

describe('the Stop hook against a real turn', () => {
  afterEach(forget);

  it('blocks the agent when the turn left a mutant alive', () => {
    plantWeakWork();

    const { out } = fireHook('scripts/stop-sensor.mjs', {
      session_id: session,
      stop_hook_active: false,
    });
    const answer = JSON.parse(out);

    expect(answer.decision).toBe('block');
    expect(answer.reason).toContain('mutant-survived');
  }, 120_000);

  it('says nothing at all when the git tier owns the sensors', () => {
    plantWeakWork();

    const { out, status } = fireHook(
      'scripts/stop-sensor.mjs',
      { session_id: session, stop_hook_active: false },
      { SENSORS: 'git' },
    );

    expect(status).toBe(0);
    expect(out).toBe('');
  });
});
