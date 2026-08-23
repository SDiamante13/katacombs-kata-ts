import { existsSync, rmSync } from 'node:fs';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { recordReview } from '../../scripts/design-ledger.mjs';
import { requestPath } from '../../scripts/design-request.mjs';
import { ledgerFile } from '../../scripts/ledger-path.mjs';
import { stopAnswer } from '../../scripts/stop-answer.mjs';
import { turnProbe } from './turn-fixture.mjs';

const session = 'design-stop-probe';
const changed = ['scripts/design-gate.mjs'];

const behaviorPassed = {
  passed: true,
  outcome: 'pass',
  findings: [],
  report: 'SENSOR behavior: PASS (0 findings)\n  1 file · 4 mutants · 4 killed\n',
};

const behaviorFailed = {
  passed: false,
  outcome: 'fail',
  findings: [{ rule: 'mutant-survived', where: 'src/a.ts:2' }],
  report: 'SENSOR behavior: FAIL (1 finding)\n',
};

function endOfTurn(payload = {}) {
  return stopAnswer({ session_id: session, ...payload }, changed, behaviorPassed);
}

function forget() {
  rmSync(requestPath, { force: true });
  rmSync(ledgerFile(session, '.design.json'), { force: true });
  rmSync(ledgerFile(session, '.behavior.json'), { force: true });
}

describe('the design gate at the end of a turn', () => {
  afterEach(forget);

  it('blocks once the cheap and behavioral tiers are green and no review is on file', () => {
    const answer = endOfTurn();

    expect(answer.decision).toBe('block');
    expect(answer.reason).toContain('SENSOR design: DUE');
    expect(answer.reason).toContain('scripts/design-gate.mjs');
  });

  it('carries the behavioral accounting into the block, so nothing is lost', () => {
    expect(endOfTurn().reason).toContain('4 mutants · 4 killed');
  });

  it('says nothing when it is answering its own block', () => {
    expect(endOfTurn({ stop_hook_active: true })).toMatchObject({ continue: true });
  });

  it('lets the turn end once a review is recorded, and says what it found', () => {
    recordReview(session, { at: '2026-08-22T09:00:00.000Z', findings: 2 });
    const answer = endOfTurn();

    expect(answer.decision).toBeUndefined();
    expect(answer.systemMessage).toContain('2 findings');
  });

  it('stops asking after the second time it is ignored', () => {
    endOfTurn();
    endOfTurn();
    const third = endOfTurn();

    expect(third.decision).toBeUndefined();
    expect(third.systemMessage).toContain('never recorded');
  });

  it('holds back while the behavioral sensor still has findings', () => {
    const answer = stopAnswer({ session_id: session }, changed, behaviorFailed);

    expect(answer.reason).not.toContain('SENSOR design: DUE');
  });
});

const source = 'src/design-probe.ts';
const spec = 'test/design-probe.test.ts';
const probe = turnProbe({ session, source, spec });

const TORCH = `export function torchIsLit(turns: number): boolean {
  return turns < 5;
}
`;

const PINNED = `import { expect, it } from 'vitest';

import { torchIsLit } from '../src/design-probe.js';

it('is lit on the last turn before it burns out', () => {
  expect(torchIsLit(4)).toBe(true);
});

it('is out on the turn it burns out', () => {
  expect(torchIsLit(5)).toBe(false);
});
`;

function clearProbe() {
  forget();
  probe.uproot();
}

describe('the Stop hook against a turn the cheaper tiers cannot fault', () => {
  afterEach(clearProbe);

  it('asks for the design review the tests cannot give it', () => {
    probe.plant(TORCH, PINNED);

    const answer = probe.stop();

    expect(answer.decision).toBe('block');
    expect(answer.reason).toContain('SENSOR design: DUE');
    expect(answer.reason).toContain(source);
  }, 120_000);
});

const BACKTICKED = /`([\w./-]+\.(?:md|mjs|json))`/g;

// The block message is the only sensor output that tells the agent where to go.
describe('every path the block message names', () => {
  const reason = endOfTurn().reason;

  afterEach(forget);

  it.each([...reason.matchAll(BACKTICKED)].map(([, file]) => file))(
    'exists: %s',
    (file) => {
      expect(existsSync(path.resolve(file))).toBe(true);
    },
  );

  it('names at least one, so a reworded message cannot make this vacuous', () => {
    expect([...reason.matchAll(BACKTICKED)].length).toBeGreaterThan(0);
  });
});
