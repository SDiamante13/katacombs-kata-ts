import { rmSync, writeFileSync } from 'node:fs';

import { afterAll, describe, expect, it } from 'vitest';

import { inspect, scopedFiles } from '../../scripts/edit-sensors.mjs';
import { projectScratch } from './sensor-harness.mjs';

const scratch = projectScratch('edit-sensors');

afterAll(() => scratch.remove());

describe('the per-edit sensor run', () => {
  it('ignores a path outside the project', () => {
    expect(scopedFiles(['/etc/hosts'])).toEqual([]);
  });

  it('ignores generated output it has no business linting', () => {
    expect(scopedFiles(['reports/ledger/x.txt', 'node_modules/eslint/index.js'])).toEqual(
      [],
    );
  });

  // A symlink named node_modules once reached the sensors.
  it('ignores a file that shares a name with an excluded directory', () => {
    writeFileSync('capture', 'not a directory\n');

    try {
      expect(scopedFiles(['capture'])).toEqual([]);
    } finally {
      rmSync('capture', { force: true });
    }
  });

  it('reports nothing at all when the edit touched no project file', () => {
    expect(inspect([])).toBeNull();
  });

  it('stays silent on a file that satisfies every sensor', () => {
    const verdict = inspect([
      scratch.file('clean.mjs', "export const room = 'Vault';\n"),
    ]);

    expect(verdict.report).toBe('');
    expect(verdict.passed).toBe(true);
  });

  it('coaches a structural finding and names the file', () => {
    const file = scratch.file(
      'tangled.mjs',
      'export function tangled(a, b, c, d, e) {\n' +
        '  return a && b && c && d && e ? a : b;\n' +
        '}\n',
    );
    const verdict = inspect([file]);

    expect(verdict.passed).toBe(false);
    expect(verdict.report).toContain('SENSOR eslint: FAIL');
    expect(verdict.report).toContain('max-params');
    expect(verdict.report).toContain('TOO-MANY-PARAMETERS');
  });

  it('names every sensor that fired, not only the one that failed', () => {
    const file = scratch.file(
      'untyped.mjs',
      'export const bad = (a, b, c, d, e) => a;\n',
    );
    const verdict = inspect([file]);

    expect(verdict.report).toContain('EDIT SENSORS:');
    expect(verdict.report).toContain('gitleaks PASS');
    expect(verdict.report).toContain('jscpd PASS');
  });

  // A doc breaks when package.json changes, which is not an edit to the doc.
  it('leaves documentation to the completion boundary', () => {
    const doc = scratch.file('stale.md', '```sh\nnpm run nothing:here\n```\n');
    const verdict = inspect([doc]);

    expect(verdict.passed).toBe(true);
  });

  it('fixes formatting silently instead of reporting it', () => {
    const file = scratch.file('ugly.mjs', "export const ugly   =    'fixed'\n");
    const verdict = inspect([file]);

    expect(verdict.passed).toBe(true);
    expect(verdict.report).toBe('');
  });
});
