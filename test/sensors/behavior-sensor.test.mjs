import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { behaviorFindings, behaviorReport } from '../../scripts/behavior-findings.mjs';
import { mutationScope, present, testScope } from '../../scripts/behavior-scope.mjs';
import { examine } from '../../scripts/behavior-sensor.mjs';

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

function mutantFor(status, line, mutatorName = 'ConditionalExpression') {
  return {
    status,
    mutatorName,
    replacement: 'true',
    location: { start: { line, column: 7 } },
  };
}

describe('what the behavioral tier looks at', () => {
  it('mutates source under src, and never a test', () => {
    expect(mutationScope(['src/cave.ts', 'test/cave.test.ts', 'scripts/x.mjs'])).toEqual([
      'src/cave.ts',
    ]);
  });

  it('runs tests for both the source and the tests that changed', () => {
    expect(testScope(['src/cave.ts', 'test/sensors/edit-sensors.test.mjs'])).toEqual([
      'src/cave.ts',
      'test/sensors/edit-sensors.test.mjs',
    ]);
  });

  it('drops files that no longer exist', () => {
    expect(present(['src/deleted-by-this-change.ts', 'package.json'])).toEqual([
      'package.json',
    ]);
  });
});

describe('what it says about a mutation report', () => {
  const report = {
    files: {
      'src/cave.ts': {
        mutants: [
          mutantFor('Survived', 2),
          mutantFor('Killed', 2),
          mutantFor('NoCoverage', 9),
          mutantFor('NoCoverage', 9, 'StringLiteral'),
        ],
      },
    },
  };

  it('reports a survivor at its own line and column', () => {
    const [survivor] = behaviorFindings(report);

    expect(survivor).toMatchObject({ rule: 'mutant-survived', where: 'src/cave.ts:2:7' });
  });

  it('collapses the untried mutants on one line into a single finding', () => {
    const uncovered = behaviorFindings(report).filter(
      (finding) => finding.rule === 'mutant-uncovered',
    );

    expect(uncovered).toHaveLength(1);
    expect(uncovered[0].detail).toContain('2 mutants');
  });

  it('says nothing when every mutant died', () => {
    expect(behaviorFindings({ files: { 'src/cave.ts': { mutants: [] } } })).toEqual([]);
  });

  it('coaches the first finding of a kind and points the rest at it', () => {
    const written = behaviorReport(behaviorFindings(report));

    expect(written).toContain('MUTANT-SURVIVED');
    expect(written).toContain('SENSOR behavior: FAIL (2 findings)');
  });

  it('shows a handful and counts the rest', () => {
    const many = Array.from({ length: 12 }, (_, index) => ({
      rule: 'mutant-survived',
      where: `src/cave.ts:${index}:1`,
      detail: 'x',
    }));

    expect(behaviorReport(many)).toContain('SENSOR behavior: FAIL (12 findings)');
    expect(behaviorReport(many)).toContain('… and 4 more');
  });
});

describe('the sensor against a real mutation run', () => {
  afterEach(uproot);

  it('is silent when nothing it watches changed', () => {
    expect(examine(['README.md', 'scripts/behavior-sensor.mjs'])).toBeNull();
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

    expect(examine([source])).toMatchObject({ passed: true });
  }, 120_000);

  it('stops at red tests instead of mutating them', () => {
    plant(STRONG.replace('A damp cave.', 'A dry cave.'));

    const verdict = examine([source]);

    expect(verdict.passed).toBe(false);
    expect(verdict.report).toContain('broken-behavior');
    expect(verdict.report).not.toContain('mutant-');
  }, 120_000);
});
