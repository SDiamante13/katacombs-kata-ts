import { describe, expect, it } from 'vitest';

import { provenance } from '../../scripts/behavior-report.mjs';
import { runMutation } from '../../scripts/mutation-run.mjs';
import { unavailable } from '../../scripts/behavior-verdict.mjs';
import { mutationUnavailable } from '../../scripts/stage-findings.mjs';

const crashed = () => ({ output: 'ConfigError: something went wrong', status: 1 });

describe('a mutation run that produces no report', () => {
  it('is reported as a crash, never as an empty result', () => {
    expect(runMutation(['src/whatever.ts'], crashed)).toMatchObject({
      crashed: expect.stringContaining('ConfigError'),
    });
  });

  it('does not leave its working directory behind', () => {
    const outcome = runMutation(['src/whatever.ts'], crashed);

    expect(outcome.report).toBeUndefined();
  });

  it('says UNAVAILABLE rather than PASS, and fails', () => {
    const verdict = unavailable([mutationUnavailable(crashed().output)]);

    expect(verdict.passed).toBe(false);
    expect(verdict.report).toContain('SENSOR behavior: UNAVAILABLE');
    expect(verdict.report).not.toContain('PASS');
  });

  it('coaches that this is not a finding about the code', () => {
    const verdict = unavailable([mutationUnavailable('boom')]);

    expect(verdict.report).toContain('MUTATION-UNAVAILABLE');
  });
});

describe('what the report says about itself', () => {
  it('leads with the warning when a later run mutated nothing', () => {
    const stale = { at: '2026-01-01T00:00:00.000Z', files: ['src/a.ts'], current: false };

    expect(provenance(stale)[0]).toContain('STALE');
  });

  it('names the change it covers when it is current', () => {
    const fresh = { at: '2026-01-01T00:00:00.000Z', files: ['src/a.ts'], current: true };

    expect(provenance(fresh)[0]).toContain('src/a.ts');
    expect(provenance(fresh)[0]).not.toContain('STALE');
  });

  it('admits when it has no record of its own run', () => {
    expect(provenance(null)[0]).toContain('no record');
  });
});
