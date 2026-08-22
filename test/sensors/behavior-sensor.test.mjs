import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { examine } from '../../scripts/behavior-sensor.mjs';
import { reportStamp } from '../../scripts/mutation-run.mjs';
import { CAVE, plant, source, STRONG, uproot, WEAK } from './behavior-fixture.mjs';

describe('the sensor against a real mutation run', () => {
  afterEach(uproot);

  it('says which named paths it could not find, instead of inventing a deletion', () => {
    const verdict = examine(['src/never-existed.ts']);

    expect(verdict.outcome).toBe('skip');
    expect(verdict.report).toContain('git has no record of deleting them');
    expect(verdict.report).not.toContain('deleted a source file');
  });

  it('fails rather than passes on a path it cannot read as source', () => {
    const verdict = examine(['src/cave.ts:1:1-1:2']);

    expect(verdict.passed).toBe(false);
    expect(verdict.report).toContain('unreadable-scope');
  });

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

describe('a source file no test has heard of', () => {
  afterEach(uproot);

  it('is a finding of its own, not a sensor that could not run', () => {
    mkdirSync(path.dirname(path.resolve(source)), { recursive: true });
    writeFileSync(path.resolve(source), CAVE);

    const verdict = examine([source]);

    expect(verdict.outcome).toBe('fail');
    expect(verdict.report).toContain('untested-source');
    expect(verdict.report).not.toContain('UNAVAILABLE');
  }, 120_000);

  it("does not leave the last run's report looking current", () => {
    mkdirSync(path.dirname(path.resolve(source)), { recursive: true });
    writeFileSync(path.resolve(source), CAVE);
    examine([source]);

    expect(reportStamp()?.current ?? false).toBe(false);
  }, 120_000);
});
