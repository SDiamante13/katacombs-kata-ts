import { mkdirSync, rmSync, statSync, utimesSync, writeFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { agentTierRan } from '../../scripts/sensors-doctor.mjs';

const HOUR = 3_600_000;
// oldestStagedAt reads real mtimes, so the clock has to be anchored to a real
// file rather than to an invented timestamp.
const stagedAt = statSync('package.json').mtimeMs;
const now = stagedAt + HOUR;

function runtimes(...firedAt) {
  return firedAt.map((at, index) => ({ key: `runtime-${index}`, firedAt: at }));
}

// SENSORS=agent tells the commit gate the cheap sensors already ran in the
// loop. If the hook was never approved, or was quietly unwired, nothing ran and
// nothing said so -- and the commit gate would skip them on that word alone.
describe('proving the agent tier actually ran', () => {
  it('has nothing to prove when nothing is staged', () => {
    expect(agentTierRan(runtimes(null), [], now).ok).toBe(true);
  });

  it('refuses when no runtime has ever fired', () => {
    const verdict = agentTierRan(runtimes(null, null), ['package.json'], now);

    expect(verdict.ok).toBe(false);
    expect(verdict.reason).toContain('ever fired');
  });

  it('refuses when the staged work is newer than the last hook run', () => {
    const verdict = agentTierRan(runtimes(stagedAt - HOUR), ['package.json'], now);

    expect(verdict.ok).toBe(false);
    expect(verdict.reason).toContain('newer than the last hook run');
  });

  it('accepts when a hook ran after the staged work was written', () => {
    expect(agentTierRan(runtimes(stagedAt + 1), ['package.json'], now).ok).toBe(true);
  });

  it('accepts when any one runtime fired, not only the first', () => {
    expect(agentTierRan(runtimes(null, stagedAt + 1), ['package.json'], now).ok).toBe(
      true,
    );
  });

  // A hook that fired once early in a session, before four more files were
  // written through a path it missed, must not clear the whole commit. The
  // comparison is against the NEWEST staged file, and a fixture with one file
  // -- or two sharing a timestamp -- cannot tell min from max.
  it('refuses when only some of the staged work predates the hook run', () => {
    const scratch = 'test/.scratch/doctor';
    mkdirSync(scratch, { recursive: true });

    try {
      const seconds = Date.now() / 1000;
      for (const [name, ago] of [
        ['old.ts', 60],
        ['new.ts', 0],
      ]) {
        writeFileSync(`${scratch}/${name}`, 'x');
        utimesSync(`${scratch}/${name}`, seconds - ago, seconds - ago);
      }

      const firedBetween = statSync(`${scratch}/old.ts`).mtimeMs + 30_000;
      const verdict = agentTierRan(runtimes(firedBetween), [
        `${scratch}/old.ts`,
        `${scratch}/new.ts`,
      ]);

      expect(verdict.ok).toBe(false);
    } finally {
      rmSync('test/.scratch', { recursive: true, force: true });
    }
  });

  it('ignores staged paths that no longer exist', () => {
    expect(agentTierRan(runtimes(stagedAt + 1), ['deleted-file.ts'], now).ok).toBe(true);
  });
});
