import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { ledgerPath, record } from '../../scripts/session-ledger.mjs';
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
  it('lets a clean turn end, carrying what it checked', () => {
    const clean = {
      passed: true,
      report: 'SENSOR behavior: PASS (0 findings)\n  3 files',
    };
    const answer = stopResponse(clean, true);

    expect(answer.continue).toBe(true);
    expect(answer.systemMessage).toContain('3 files');
  });

  it('keeps the header and the rule when the findings are long', () => {
    const long = {
      passed: false,
      report: `SENSOR behavior: FAIL (1 finding)\nsrc/a.ts:2:7 ERROR mutant-survived\n${'x'.repeat(9000)}`,
    };

    expect(stopResponse(long, true).reason).toContain('mutant-survived');
    expect(stopResponse(long, true).reason).toContain('truncated');
  });

  it('lets a turn end when the tier had nothing to look at', () => {
    const nothing = { passed: true, outcome: 'skip', report: 'SKIP (nothing in scope)' };

    expect(stopResponse(nothing, true).continue).toBe(true);
    expect(stopResponse(nothing, true).systemMessage).toContain('nothing in scope');
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

  it('holds the expensive tier back while the cheap one still has findings', () => {
    writeFileSync(path.resolve(source), `${CAVE}\nconst unused = 1;\n`);
    writeFileSync(path.resolve(spec), WEAK);
    record(session, [source]);

    const { out } = fireHook('scripts/stop-sensor.mjs', {
      session_id: session,
      stop_hook_active: false,
    });
    const answer = JSON.parse(out);

    expect(answer.reason).toContain('cheap-tier-first');
    expect(answer.reason).not.toContain('mutant-survived');
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

describe('the hook when the sensors are switched off', () => {
  it('says out loud that it has been disabled', () => {
    const { err, status } = fireHook(
      'scripts/stop-sensor.mjs',
      { session_id: session },
      { SENSORS: 'git' },
    );

    expect(status).toBe(0);
    expect(err).toContain('SENSORS=git');
  });
});
