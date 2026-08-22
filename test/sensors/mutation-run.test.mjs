import { describe, expect, it } from 'vitest';

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
