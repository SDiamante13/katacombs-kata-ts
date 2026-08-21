import { rmSync } from 'node:fs';

import { afterAll, describe, expect, it } from 'vitest';

import { editedPaths } from '../../scripts/hook-io.mjs';
import { changedThisSession, record } from '../../scripts/session-ledger.mjs';
import {
  agentTierFires,
  gitTierRepeatsCheapSensors,
} from '../../scripts/sensor-tier.mjs';
import { movedFiles } from '../../scripts/worktree-watch.mjs';
import { fireHook, projectScratch } from './sensor-harness.mjs';

const scratch = projectScratch('sensor-hooks');
const CLAUDE_HOOK = '.claude/hooks/post-edit-sensor.mjs';
const CODEX_HOOK = '.codex/hooks/post-edit-sensor.mjs';
const TANGLED = 'export const tangled = (a, b, c, d, e) => (a && b && c && d ? a : e);\n';

afterAll(() => scratch.remove());

function forgetSession(session) {
  rmSync(`reports/ledger/${session}.txt`, { force: true });
  rmSync(`reports/ledger/${session}.worktree.json`, { force: true });
}

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

describe('the Claude Code adapter', () => {
  it('blocks the turn with coaching when a sensor fails', () => {
    const file = scratch.file('claude-bad.mjs', TANGLED);
    const { err, status } = fireHook(CLAUDE_HOOK, {
      session_id: 'claude-block',
      tool_input: { file_path: file },
    });

    expect(status).toBe(2);
    expect(err).toContain('SENSOR eslint: FAIL');
    expect(err).toContain('max-params');
  });

  it('says nothing when the edit is clean', () => {
    const file = scratch.file('claude-good.mjs', "export const room = 'Vault';\n");
    const { out, err, status } = fireHook(CLAUDE_HOOK, {
      session_id: 'claude-quiet',
      tool_input: { file_path: file },
    });

    expect(status).toBe(0);
    expect(`${out}${err}`).toBe('');
  });

  it('records what it saw for the Stop hooks to read', () => {
    forgetSession('claude-ledger');
    const file = scratch.file('claude-noted.mjs', "export const noted = 'yes';\n");

    fireHook(CLAUDE_HOOK, {
      session_id: 'claude-ledger',
      tool_input: { file_path: file },
    });

    expect(changedThisSession('claude-ledger')).toEqual([file]);
  });

  it('stands down when the attendee has chosen the git tier', () => {
    const file = scratch.file('claude-off.mjs', TANGLED);
    const { err, status } = fireHook(
      CLAUDE_HOOK,
      { session_id: 'claude-off', tool_input: { file_path: file } },
      { SENSORS: 'git' },
    );

    expect(status).toBe(0);
    expect(err).toBe('');
  });
});

describe('the Codex adapter', () => {
  it('feeds the findings back as a block decision', () => {
    forgetSession('codex-block');
    fireHook(CODEX_HOOK, { session_id: 'codex-block' });

    scratch.file('codex-bad.mjs', TANGLED);
    const { out } = fireHook(CODEX_HOOK, { session_id: 'codex-block' });

    expect(JSON.parse(out).decision).toBe('block');
    expect(JSON.parse(out).reason).toContain('SENSOR eslint: FAIL');
  });

  it('says nothing when the shell command changed no file', () => {
    forgetSession('codex-quiet');
    fireHook(CODEX_HOOK, { session_id: 'codex-quiet' });

    const { out, status } = fireHook(CODEX_HOOK, { session_id: 'codex-quiet' });

    expect(status).toBe(0);
    expect(out).toBe('');
  });
});
