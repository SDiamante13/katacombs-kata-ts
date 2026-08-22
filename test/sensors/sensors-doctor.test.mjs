import { mkdirSync, rmSync, statSync, utimesSync, writeFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { agentTierRan } from '../../scripts/sensors-doctor.mjs';

const HOUR = 3_600_000;
// Anchored to a real mtime, because the code reads real mtimes.
const stagedAt = statSync('package.json').mtimeMs;
const now = stagedAt + HOUR;

function runtimes(...firedAt) {
  return firedAt.map((at, index) => ({ key: `runtime-${index}`, firedAt: at }));
}

// SENSORS=agent skips the cheap sensors at commit, so it has to be evidenced.
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

  // Two files, so the fixture can tell newest from oldest.
  it('refuses when only some of the staged work predates the hook run', () => {
    const scratch = 'test/.scratch/doctor';
    mkdirSync(scratch, { recursive: true });

    try {
      writeAged(`${scratch}/old.ts`, 60);
      writeAged(`${scratch}/new.ts`, 0);

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

function writeAged(file, secondsAgo) {
  const when = Date.now() / 1000 - secondsAgo;

  writeFileSync(file, 'x');
  utimesSync(file, when, when);
}
