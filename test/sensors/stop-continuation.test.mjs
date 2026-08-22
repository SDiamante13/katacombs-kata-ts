import path from 'node:path';
import { rmSync } from 'node:fs';

import { afterEach, describe, expect, it } from 'vitest';

import { fingerprint, shouldPushBack } from '../../scripts/stop-continuation.mjs';
import { verdictFor } from '../../scripts/stop-verdict.mjs';

const session = 'behavior-guard-probe';

function forget() {
  rmSync(path.resolve('reports/ledger', `${session}.behavior.json`), { force: true });
}

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

describe('a pipeline that throws where nothing expects it to', () => {
  const boom = () => {
    throw new Error('the sandbox went missing');
  };

  it('becomes an UNAVAILABLE verdict, not an escaped exception', () => {
    const verdict = verdictFor(['src/a.ts'], {
      cheapTier: () => null,
      expensiveTier: boom,
    });

    expect(verdict.outcome).toBe('unavailable');
    expect(verdict.passed).toBe(false);
  });

  it('carries the cause so the turn is not a mystery', () => {
    const verdict = verdictFor(['src/a.ts'], {
      cheapTier: () => null,
      expensiveTier: boom,
    });

    expect(verdict.report).toContain('the sandbox went missing');
  });

  it('survives the cheap tier throwing too', () => {
    const verdict = verdictFor(['src/a.ts'], { cheapTier: boom });

    expect(verdict.outcome).toBe('unavailable');
  });

  it('never reports a pass when it could not run', () => {
    expect(verdictFor(['src/a.ts'], { cheapTier: boom }).report).not.toContain('PASS');
  });
});
