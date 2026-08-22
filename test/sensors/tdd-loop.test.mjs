import { mkdirSync, rmSync, writeFileSync } from 'node:fs';

import { afterAll, describe, expect, it } from 'vitest';

import { inspect } from '../../scripts/edit-sensors.mjs';
import { runSensor } from './sensor-harness.mjs';

const scratch = 'test/tdd-probe';

afterAll(() => rmSync(scratch, { recursive: true, force: true }));

function probe(body) {
  mkdirSync(scratch, { recursive: true });
  const file = `${scratch}/roman.ts`;
  writeFileSync(file, body);

  return file;
}

const STUB = "export function toRoman(value: number): string {\n  return '';\n}\n";
const UNUSED_LOCAL =
  "export function toRoman(value: number): string {\n  const spare = value;\n  return '';\n}\n";

function atCommitGate(file) {
  return runSensor('node_modules/eslint/bin/eslint.js', file).status;
}

// Red-green requires passing through a state where the signature exists and the
// body does not use it yet. A per-edit sensor that reports it tells the agent to
// rename to _value and then rename back -- churn the sensor induced.
describe('the per-edit tier and the red-green loop', () => {
  it('lets the hardcode-first stub through', () => {
    expect(inspect([probe(STUB)]).passed).toBe(true);
  });

  it('still reports that stub at the commit gate', () => {
    expect(atCommitGate(probe(STUB))).not.toBe(0);
  });

  it('never lets an unused local through, which is not a legal intermediate', () => {
    const verdict = inspect([probe(UNUSED_LOCAL)]);

    expect(verdict.passed).toBe(false);
    expect(verdict.report).toContain('no-unused-vars');
  });
});
