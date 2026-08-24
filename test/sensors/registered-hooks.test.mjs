import { describe, expect, it } from 'vitest';

import {
  deadHooks,
  registeredHooks,
  scriptNamedBy,
} from '../../scripts/registered-hooks.mjs';

describe('reading the script out of a registered hook command', () => {
  it('takes the path Claude Code roots at the project directory', () => {
    expect(
      scriptNamedBy('bash "$CLAUDE_PROJECT_DIR/.claude/hooks/session-brief.sh"'),
    ).toBe('.claude/hooks/session-brief.sh');
  });

  it('takes the path Codex roots at the top level', () => {
    expect(
      scriptNamedBy('node "$(git rev-parse --show-toplevel)/scripts/stop-sensor.mjs"'),
    ).toBe('scripts/stop-sensor.mjs');
  });

  it('says nothing about a command that names no script of ours', () => {
    expect(scriptNamedBy('echo done')).toBe(null);
  });
});

describe('the hooks this project registers', () => {
  it('names a script that exists, for every one of them', () => {
    expect(deadHooks()).toEqual([]);
  });

  it('finds the hooks in every manifest, the machine-local one included', () => {
    expect(registeredHooks().length).toBeGreaterThan(0);
  });

  it('calls a hook dead when the script it names is not there', () => {
    const planted = [
      { manifest: '.claude/settings.local.json', script: 'gone.sh', present: false },
      { manifest: '.claude/settings.json', script: 'here.mjs', present: true },
    ];

    expect(deadHooks(planted)).toEqual([planted[0]]);
  });
});
