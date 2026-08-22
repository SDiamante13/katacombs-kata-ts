import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { behaviorFindings } from '../../scripts/behavior-findings.mjs';
import { sensorRules } from '../../scripts/eslint-rules/index.mjs';
import { tests as testGuides } from '../../scripts/guides/tests.mjs';

const TAGGED = /```text sensor-output\n([\s\S]*?)```/g;
const HEADER = /^SENSOR behavior: (PASS|FAIL|SKIP|UNAVAILABLE)\b/;
const COUNT = /(\d+) (killed|survived|untried|not evaluated)/g;

const STATUS = {
  killed: 'Killed',
  survived: 'Survived',
  untried: 'NoCoverage',
  'not evaluated': 'CompileError',
};

function documentedBlocks() {
  const text = readFileSync(path.resolve('SENSORS.md'), 'utf8');

  return [...text.matchAll(TAGGED)].map(([, body]) => body.trim());
}

function mutantsFrom(block) {
  return [...block.matchAll(COUNT)].flatMap(([, count, word]) =>
    Array.from({ length: Number(count) }, () => ({
      status: STATUS[word],
      mutatorName: 'ConditionalExpression',
      replacement: 'true',
      location: { start: { line: 1, column: 1 } },
    })),
  );
}

const blocks = documentedBlocks();

describe('the sensor output printed in SENSORS.md', () => {
  it('has blocks to check, so a rename cannot make this vacuous', () => {
    expect(blocks.length).toBeGreaterThan(0);
  });

  it.each(blocks)('starts with a line the sensor can emit: %s', (block) => {
    expect(block).toMatch(HEADER);
  });

  it.each(blocks)('shows an outcome the code would actually reach', (block) => {
    const outcome = HEADER.exec(block)[1];
    const findings = behaviorFindings({
      files: { 'src/documented.ts': { mutants: mutantsFrom(block) } },
    });

    expect(findings.length === 0).toBe(outcome === 'PASS');
  });
});

const WRITTEN = {
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
};

function claimed(pattern) {
  const found = pattern.exec(readFileSync(path.resolve('SENSORS.md'), 'utf8'));

  return found ? WRITTEN[found[1]] : null;
}

// A count written out in prose is the claim that goes stale in silence.
describe('the counts SENSORS.md states about itself', () => {
  it('gets the number of rules written by hand right', () => {
    expect(claimed(/(\w+) rules you write yourself/)).toBe(
      Object.keys(sensorRules.rules).length,
    );
  });

  it('gets the number of test-design guides right', () => {
    expect(claimed(/guides for the (\w+) test-design rules/)).toBe(
      Object.keys(testGuides).length,
    );
  });

  it('gets the named-arrange threshold right', () => {
    expect(claimed(/more than (\w+) statements before the test asserts/)).toBe(8);
  });
});
