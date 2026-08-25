import { describe, expect, it } from 'vitest';

import {
  STOP_BUDGET,
  stopTimeouts,
  tooTightToReport,
} from '../../scripts/hook-budgets.mjs';

describe('the Stop hook outlasts the sensors it runs', () => {
  it('gives every runtime longer than the tests and the mutants together', () => {
    expect(tooTightToReport()).toEqual([]);
  });

  it('asks both runtimes for the same patience', () => {
    const [claude, codex] = stopTimeouts();

    expect(claude.seconds).toBe(codex.seconds);
  });

  it('calls a timeout that merely matches the budget too tight', () => {
    const matching = [{ manifest: 'x', seconds: STOP_BUDGET / 1000 }];

    expect(tooTightToReport(matching)).toEqual(matching);
  });

  it('leaves a timeout with room to write the report alone', () => {
    expect(
      tooTightToReport([{ manifest: 'x', seconds: STOP_BUDGET / 1000 + 1 }]),
    ).toEqual([]);
  });
});
