import { mkdirSync, rmSync, writeFileSync } from 'node:fs';

import { afterAll, describe, expect, it } from 'vitest';

import { inspect } from '../../scripts/edit-sensors.mjs';
import { runSensor } from './sensor-harness.mjs';

const scratch = 'test/tdd-probe';

afterAll(() => rmSync(scratch, { recursive: true, force: true }));

function probe(name, body) {
  mkdirSync(scratch, { recursive: true });
  const file = `${scratch}/${name}`;
  writeFileSync(file, body);

  return file;
}

// The same stub in both languages. A fixture that only covers one extension
// cannot see that the relaxation is scoped to a rule id the other one never
// uses -- .ts gets no-unused-vars from typescript-eslint, .mjs from base
// ESLint, and this repository is almost entirely .mjs.
const STUBS = [
  ['stub.ts', "export function toRoman(value: number): string {\n  return '';\n}\n"],
  ['stub.mjs', "export function toRoman(value) {\n  return '';\n}\n"],
];

const LOCALS = [
  [
    'local.ts',
    "export function toRoman(value: number): string {\n  const spare = value;\n  return '';\n}\n",
  ],
  [
    'local.mjs',
    "export function toRoman(value) {\n  const spare = value;\n  return '';\n}\n",
  ],
];

function atCommitGate(file) {
  return runSensor('node_modules/eslint/bin/eslint.js', file).status;
}

// Red-green requires passing through a state where the signature exists and the
// body does not use it yet. A per-edit sensor that reports it tells the agent to
// rename to _value and then rename back -- churn the sensor induced.
describe('the per-edit tier and the red-green loop', () => {
  it.each(STUBS)('lets the hardcode-first stub through as %s', (name, body) => {
    expect(inspect([probe(name, body)]).passed).toBe(true);
  });

  it.each(STUBS)('still reports that stub at the commit gate as %s', (name, body) => {
    expect(atCommitGate(probe(name, body))).not.toBe(0);
  });

  it.each(LOCALS)('never lets an unused local through as %s', (name, body) => {
    const verdict = inspect([probe(name, body)]);

    expect(verdict.passed).toBe(false);
    expect(verdict.report).toContain('no-unused-vars');
  });

  it('leaves a config file at the root strict', () => {
    expect(inspect(['eslint.config.mjs']).passed).toBe(true);
  });
});
