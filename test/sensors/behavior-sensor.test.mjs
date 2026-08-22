import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { scopeOf } from '../../scripts/behavior-scope.mjs';
import { examine, requestedScope } from '../../scripts/behavior-sensor.mjs';

const source = 'src/behavior-probe.ts';
const spec = 'test/behavior-probe.test.ts';

const CAVE = `export function describeCave(lit: boolean, visited: number): string {
  if (!lit) return 'It is pitch dark.';
  if (visited > 3) return 'The cave, familiar now.';

  return 'A damp cave.';
}
`;

const WEAK = `import { describe, expect, it } from 'vitest';

import { describeCave } from '../src/behavior-probe.js';

describe('describeCave', () => {
  it('answers something', () => {
    expect(describeCave(false, 0)).toBe('It is pitch dark.');
  });
});
`;

const STRONG = WEAK.replace(
  '  });\n});',
  `  });

  it('is damp on the first lit visits', () => {
    expect(describeCave(true, 3)).toBe('A damp cave.');
  });

  it('is familiar after the third lit visit', () => {
    expect(describeCave(true, 4)).toBe('The cave, familiar now.');
  });
});`,
);

function plant(spec_) {
  mkdirSync(path.dirname(path.resolve(source)), { recursive: true });
  writeFileSync(path.resolve(source), CAVE);
  writeFileSync(path.resolve(spec), spec_);
}

function uproot() {
  rmSync(path.resolve(source), { force: true });
  rmSync(path.resolve(spec), { force: true });
}

describe('what the behavioral tier looks at', () => {
  afterEach(uproot);

  it('mutates source under src, and never a test', () => {
    plant(WEAK);

    expect(scopeOf([source, spec, 'scripts/behavior-sensor.mjs']).mutated).toEqual([
      source,
    ]);
  });

  it('runs tests for both the source and the tests that changed', () => {
    plant(WEAK);

    expect(scopeOf([source, spec]).tests).toEqual([source, spec]);
  });

  it('sees the same file however the caller spells the path', () => {
    plant(WEAK);

    const spelled = [`./${source}`, path.resolve(source), source];

    expect(scopeOf(spelled).mutated).toEqual([source]);
  });

  it('refuses a path that points outside the project', () => {
    expect(scopeOf(['../elsewhere/thing.ts', '/etc/passwd.ts']).tests).toEqual([]);
  });

  it('keeps a file the change deleted, so its tests still run', () => {
    expect(scopeOf(['src/deleted-by-this-change.ts']).gone).toEqual([
      'src/deleted-by-this-change.ts',
    ]);
  });
});

describe('the sensor against a real mutation run', () => {
  afterEach(uproot);

  it('says it checked nothing rather than reporting a pass', () => {
    const verdict = examine(['README.md', 'scripts/behavior-sensor.mjs']);

    expect(verdict.outcome).toBe('skip');
    expect(verdict.report).toContain('SKIP (nothing in scope)');
    expect(verdict.report).not.toContain('PASS');
  });

  it('finds the assertion gap a weak test leaves behind', () => {
    plant(WEAK);

    const verdict = examine([source]);

    expect(verdict.passed).toBe(false);
    expect(verdict.report).toContain('mutant-survived');
    expect(verdict.report).toContain('npm run behavior:report');
  }, 120_000);

  it('passes once the tests assert the behaviour the mutants break', () => {
    plant(STRONG);

    const verdict = examine([source]);

    expect(verdict).toMatchObject({ passed: true, outcome: 'pass' });
    expect(verdict.report).toMatch(/1 file · \d+ mutants · \d+ killed · 0 survived/);
  }, 120_000);

  it('stops at red tests instead of mutating them', () => {
    plant(STRONG.replace('A damp cave.', 'A dry cave.'));

    const verdict = examine([source]);

    expect(verdict.passed).toBe(false);
    expect(verdict.report).toContain('broken-behavior');
    expect(verdict.report).not.toContain('mutant-');
  }, 120_000);
});

describe('the scope it works out for itself', () => {
  afterEach(uproot);

  it('sees a file the change created, which no diff against HEAD lists', () => {
    plant(WEAK);

    expect(requestedScope([], undefined)).toContain(source);
  });

  it('prefers what the caller named over anything it could work out', () => {
    expect(requestedScope(['src/named.ts'], undefined)).toEqual(['src/named.ts']);
  });
});
