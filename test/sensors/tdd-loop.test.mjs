import { afterAll, describe, expect, it } from 'vitest';

import { inspect } from '../../scripts/edit-sensors.mjs';
import { projectScratch, runSensor } from './sensor-harness.mjs';

const scratch = projectScratch('tdd-loop');

afterAll(() => scratch.remove());

const probe = (name, body) => scratch.file(name, body);

// Both languages: the relaxation is per rule id, and each extension uses a different one.
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

// Red-green passes through a signature whose body does not use it yet.
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
