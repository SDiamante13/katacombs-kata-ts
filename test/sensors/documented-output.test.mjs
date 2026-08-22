import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { behaviorFindings } from '../../scripts/behavior-findings.mjs';

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
