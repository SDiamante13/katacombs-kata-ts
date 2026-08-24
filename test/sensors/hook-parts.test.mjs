import { describe, expect, it } from 'vitest';

import { editedPaths } from '../../scripts/hook-io.mjs';
import { changedThisSession, record } from '../../scripts/session-ledger.mjs';
import {
  agentTierFires,
  gitTierRepeatsCheapSensors,
} from '../../scripts/sensor-tier.mjs';
import { movedFiles } from '../../scripts/worktree-watch.mjs';
import { forgetSession } from './sensor-harness.mjs';

describe('the tier switch', () => {
  it('runs both tiers when nothing is chosen', () => {
    expect(agentTierFires({})).toBe(true);
    expect(gitTierRepeatsCheapSensors({})).toBe(true);
  });

  it('lets the agent loop own the cheap sensors', () => {
    expect(agentTierFires({ SENSORS: 'agent' })).toBe(true);
    expect(gitTierRepeatsCheapSensors({ SENSORS: 'agent' })).toBe(false);
  });

  it('lets git own them instead', () => {
    expect(agentTierFires({ SENSORS: 'git' })).toBe(false);
    expect(gitTierRepeatsCheapSensors({ SENSORS: 'git' })).toBe(true);
  });

  it('falls back to both tiers on a value it does not recognise', () => {
    expect(agentTierFires({ SENSORS: 'nonsense' })).toBe(true);
    expect(gitTierRepeatsCheapSensors({ SENSORS: 'nonsense' })).toBe(true);
  });
});

describe('the session ledger', () => {
  it('accumulates the paths a session touched, without repeats', () => {
    forgetSession('ledger-test');

    record('ledger-test', ['src/a.ts', 'src/b.ts']);
    record('ledger-test', ['src/a.ts']);

    expect(changedThisSession('ledger-test')).toEqual(['src/a.ts', 'src/b.ts']);
  });

  it('reports nothing for a session that has changed nothing', () => {
    expect(changedThisSession('never-seen')).toEqual([]);
  });
});

describe('reading the hook payload', () => {
  it('takes the edited path Claude Code hands it', () => {
    expect(editedPaths({ tool_input: { file_path: 'src/a.ts' } })).toEqual(['src/a.ts']);
  });

  it('survives a payload with no file in it', () => {
    expect(editedPaths({})).toEqual([]);
  });
});

describe('watching the worktree, which is all Codex gives us', () => {
  it('sees a file whose stamp moved', () => {
    expect(movedFiles({ 'src/a.ts': 1 }, { 'src/a.ts': 2 })).toEqual(['src/a.ts']);
  });

  it('sees a file that was not there before', () => {
    expect(movedFiles({}, { 'src/a.ts': 2 })).toEqual(['src/a.ts']);
  });

  it('stays quiet when nothing moved', () => {
    expect(movedFiles({ 'src/a.ts': 1 }, { 'src/a.ts': 1 })).toEqual([]);
  });
});
