import { describe, expect, it } from 'vitest';

import {
  behaviorFindings,
  behaviorReport,
  summarise,
} from '../../scripts/behavior-findings.mjs';
import { brokenBehavior } from '../../scripts/stage-findings.mjs';

function mutantFor(status, line, mutatorName = 'ConditionalExpression') {
  return {
    status,
    mutatorName,
    replacement: 'true',
    location: { start: { line, column: 7 } },
  };
}

function reportOf(mutants) {
  return { files: { 'src/cave.ts': { mutants } } };
}

describe('what it says about a mutation report', () => {
  const report = reportOf([
    mutantFor('Survived', 2),
    mutantFor('Killed', 2),
    mutantFor('NoCoverage', 9),
    mutantFor('NoCoverage', 9, 'StringLiteral'),
  ]);

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
    expect(behaviorFindings(reportOf([]))).toEqual([]);
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

describe('the accounting a pass carries', () => {
  const report = reportOf([
    mutantFor('Killed', 1),
    mutantFor('Timeout', 2),
    mutantFor('CompileError', 3),
    mutantFor('RuntimeError', 4),
  ]);

  it('counts a timeout as a mutant the tests caught', () => {
    expect(summarise(report)).toContain('2 killed');
  });

  it('never hides the mutants it could not evaluate', () => {
    expect(summarise(report)).toContain('2 not evaluated');
  });

  it('reads as one sentence, with every count next to the word it counts', () => {
    expect(summarise(report)).toBe(
      '  1 file · 4 mutants · 2 killed · 0 survived · 0 untried · 2 not evaluated · 1 killed by timeout rather than by a test',
    );
  });

  it('stays quiet about timeouts when there were none', () => {
    expect(summarise(reportOf([mutantFor('Killed', 1)]))).not.toContain('timeout');
  });

  it('says how many files it looked at', () => {
    expect(summarise(report)).toContain('1 file · 4 mutants');
  });
});

describe('a mutant a comment told the runner to skip', () => {
  const report = reportOf([mutantFor('Ignored', 7), mutantFor('Ignored', 7)]);

  it('is a finding, not a quiet line in the accounting', () => {
    const [finding] = behaviorFindings(report);

    expect(finding).toMatchObject({
      rule: 'mutation-suppressed',
      where: 'src/cave.ts:7',
    });
  });

  it('fails the run rather than passing it silently', () => {
    expect(behaviorFindings(report)).toHaveLength(1);
    expect(behaviorReport(behaviorFindings(report))).toContain('FAIL');
  });
});

describe('what it keeps when several tests fail at once', () => {
  const output = [
    ' Test Files  1 failed (1)',
    '      Tests  2 failed (2)',
    ' FAIL  test/a.test.ts > first thing',
    'AssertionError: expected 1 to be 2',
    ' FAIL  test/a.test.ts > second thing',
    'AssertionError: expected 3 to be 4',
    ...Array.from({ length: 40 }, (_, index) => `noise ${index}`),
  ].join('\n');

  it('keeps the first failure, not only the last', () => {
    expect(brokenBehavior(output).detail).toContain('first thing');
  });

  it('keeps the later failures too', () => {
    expect(brokenBehavior(output).detail).toContain('second thing');
  });

  it('keeps the summary line', () => {
    expect(brokenBehavior(output).detail).toContain('Tests  2 failed');
  });
});

describe('what survives truncation when one file is very noisy', () => {
  const noisy = reportOf([
    ...Array.from({ length: 12 }, (_, index) => mutantFor('Survived', index + 1)),
    mutantFor('NoCoverage', 40),
    mutantFor('NoCoverage', 41),
    mutantFor('NoCoverage', 42),
  ]);

  const written = behaviorReport(behaviorFindings(noisy));

  it('still shows an untested line, not only survivors', () => {
    expect(written).toContain('mutant-uncovered');
  });

  it('still leads with the survivors', () => {
    expect(written.indexOf('mutant-survived')).toBeLessThan(
      written.indexOf('mutant-uncovered'),
    );
  });

  it('counts everything it did not print', () => {
    expect(written).toContain('SENSOR behavior: FAIL (15 findings)');
    expect(written).toContain('… and 7 more');
  });
});
