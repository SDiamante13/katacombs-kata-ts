import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { behaviorFindings } from '../../scripts/behavior-findings.mjs';
import { charter } from '../../scripts/design-charter.mjs';
import { GUARDS } from '../../scripts/design-gate.mjs';
import { sensorRules } from '../../scripts/eslint-rules/index.mjs';
import { tests as testGuides } from '../../scripts/guides/tests.mjs';

const TAGGED = /```text sensor-output\n([\s\S]*?)```/g;
const HEADER = /^SENSOR behavior: (PASS|FAIL|SKIP|UNAVAILABLE)\b/;
// The lookahead drops `1 killed by timeout …`: it re-counts kills, it is not a category.
const COUNT = /(\d+) (killed|survived|untried|not evaluated)(?! [a-z])/g;
const TOTAL = /(\d+) mutants/;

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

function categorised(block) {
  return [...block.matchAll(COUNT)].reduce((sum, [, count]) => sum + Number(count), 0);
}

function claimedTotal(block) {
  const found = TOTAL.exec(block);

  return found ? Number(found[1]) : null;
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

  // The total is the one number in the doc an attendee reads and nothing was checking.
  it.each(blocks)('adds up: every mutant is in exactly one category', (block) => {
    expect(categorised(block)).toBe(claimedTotal(block));
  });
});

describe('the accounting checker itself', () => {
  const line = (body) => `SENSOR behavior: PASS (0 findings)\n  3 files · ${body}`;

  it('catches a total that does not match its parts', () => {
    expect(categorised(line('30 mutants · 12 killed · 0 survived · 0 untried'))).not.toBe(
      30,
    );
  });

  it('catches a total invented outright', () => {
    expect(
      categorised(line('9999 mutants · 1 killed · 0 survived · 0 untried')),
    ).not.toBe(9999);
  });

  it('does not count the timeout clause, which re-counts kills already counted', () => {
    const block = line(
      '3 mutants · 3 killed · 0 survived · 0 untried · 1 killed by timeout rather than by a test',
    );

    expect(categorised(block)).toBe(claimedTotal(block));
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

  return found ? WRITTEN[found[1].toLowerCase()] : null;
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

  it('gets the number of questions the design charter may ask right', () => {
    expect(claimed(/(\w+) questions, and a closed list/)).toBe(charter.length);
  });

  it('gets the number of guard clauses on the design gate right', () => {
    expect(claimed(/the answer is\s+(\w+) clauses/)).toBe(GUARDS);
  });
});
