import { spawnSync } from 'node:child_process';

import { describe, expect, it } from 'vitest';

// Why this spawns the real entrypoint instead of importing it: context/no-build-step.md
const ENTRYPOINT = 'src/adapters/terminal/main.ts';

function play(typed: string): { screen: string; status: number | null } {
  const run = spawnSync(
    process.execPath,
    ['--disable-warning=ExperimentalWarning', ENTRYPOINT],
    { input: typed, encoding: 'utf8' },
  );

  return { screen: run.stdout, status: run.status };
}

describe('the game the play script actually runs', () => {
  it('starts, greets the player from the entrance hall, and leaves quietly', () => {
    const { screen, status } = play('QUIT\n');

    expect(status).toBe(0);
    expect(screen.split('\n')[0]).toBe('Entrance Hall');
  });

  it('opens the way through, and walks the player past it', () => {
    const { screen, status } = play('GO DOWN\nOPEN GATE\nGO E\nQUIT\n');

    expect(status).toBe(0);
    expect(screen).toContain('Ossuary');
  });

  it('refuses the same way while the gate is still shut', () => {
    const { screen, status } = play('GO DOWN\nGO E\nQUIT\n');

    expect(status).toBe(0);
    expect(screen).not.toContain('Ossuary');
  });

  it('walks a direction the world really connects', () => {
    const { screen, status } = play('GO N\nQUIT\n');

    expect(status).toBe(0);
    expect(screen).toContain('Guard Room');
  });
});
