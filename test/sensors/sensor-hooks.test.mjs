import { afterAll, describe, expect, it } from 'vitest';

import { changedThisSession } from '../../scripts/session-ledger.mjs';

import { fireHook, forgetSession, projectScratch } from './sensor-harness.mjs';

const scratch = projectScratch('sensor-hooks');
const CLAUDE_HOOK = '.claude/hooks/post-edit-sensor.mjs';
const CODEX_HOOK = '.codex/hooks/post-edit-sensor.mjs';
const TANGLED = 'export const tangled = (a, b, c, d, e) => (a && b && c && d ? a : e);\n';

afterAll(() => scratch.remove());

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
    forgetSession('claude-quiet');
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

    expect(changedThisSession('claude-ledger')).toContain(file);
  });

  it('catches a file written by a shell command, which names no path', () => {
    forgetSession('claude-shell');
    fireHook(CLAUDE_HOOK, { session_id: 'claude-shell', tool_input: { command: 'ls' } });

    scratch.file('claude-shell-write.mjs', TANGLED);
    const { err, status } = fireHook(CLAUDE_HOOK, {
      session_id: 'claude-shell',
      tool_input: { command: 'python3 write_it.py' },
    });

    expect(status).toBe(2);
    expect(err).toContain('SENSOR eslint: FAIL');
  });

  it("leaves the suite's own fixtures alone when a live session is the one editing", () => {
    forgetSession('claude-live');
    const live = { VITEST: '' };
    fireHook(
      CLAUDE_HOOK,
      { session_id: 'claude-live', tool_input: { command: 'ls' } },
      live,
    );

    scratch.file('claude-live-fixture.mjs', TANGLED);
    const { err, status } = fireHook(
      CLAUDE_HOOK,
      { session_id: 'claude-live', tool_input: { command: 'python3 write_it.py' } },
      live,
    );

    expect(status).toBe(0);
    expect(err).toBe('');
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
