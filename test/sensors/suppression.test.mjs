import { afterAll, describe, expect, it } from 'vitest';

import { inspect } from '../../scripts/edit-sensors.mjs';
import { projectScratch, runSensor } from './sensor-harness.mjs';

const scratch = projectScratch('suppression');

afterAll(() => scratch.remove());

const OVER_THE_LIMIT =
  'export function tooMany(a, b, c, d, e) {\n  return [a, b, c, d, e];\n}\n';
const TYPED_OVER_THE_LIMIT =
  'export function tooMany(a: number, b: number, c: number, d: number, e: number): number[] {\n  return [a, b, c, d, e];\n}\n';

// Every shape of inline disable ESLint accepts, including the blanket one.
const EVASIONS = [
  ['a blanket disable at the top of the file', `/* eslint-disable */\n${OVER_THE_LIMIT}`],
  [
    'a blanket disable naming the rule',
    `/* eslint-disable max-params */\n${OVER_THE_LIMIT}`,
  ],
  ['a next-line disable', `// eslint-disable-next-line max-params\n${OVER_THE_LIMIT}`],
  [
    'a disabled region',
    `/* eslint-disable max-params */\n${OVER_THE_LIMIT}/* eslint-enable max-params */\n`,
  ],
  [
    'a disable carrying a written reason',
    `// eslint-disable-next-line max-params -- legacy adapter\n${OVER_THE_LIMIT}`,
  ],
  ['inline rule config', `/* eslint max-params: "off" */\n${OVER_THE_LIMIT}`],
];

// linterOptions has to carry into the TypeScript blocks, not only the base one.
const BOTH_EXTENSIONS = [
  ['typed.ts', TYPED_OVER_THE_LIMIT],
  ['untyped.mjs', OVER_THE_LIMIT],
];

function probe(name, body) {
  return scratch.file(name, body);
}

describe('an inline disable cannot silence a sensor', () => {
  it.each(EVASIONS)('reports the finding underneath %s', (label, body) => {
    const verdict = inspect([
      probe(`${EVASIONS.findIndex(([l]) => l === label)}.mjs`, body),
    ]);

    expect(verdict.passed).toBe(false);
    expect(verdict.report).toContain('max-params');
  });

  it.each(EVASIONS)('says the directive had no effect for %s', (label, body) => {
    const verdict = inspect([
      probe(`note-${EVASIONS.findIndex(([l]) => l === label)}.mjs`, body),
    ]);

    expect(verdict.report).toContain('no effect');
  });

  it.each(BOTH_EXTENSIONS)('reaches a blanket disable in %s', (name, body) => {
    const verdict = inspect([probe(name, `/* eslint-disable */\n${body}`)]);

    expect(verdict.passed).toBe(false);
    expect(verdict.report).toContain('max-params');
  });

  it('still reports the suppressed finding at the commit gate', () => {
    const file = probe('gate.mjs', `/* eslint-disable */\n${OVER_THE_LIMIT}`);

    expect(runSensor('node_modules/eslint/bin/eslint.js', file).status).not.toBe(0);
  });

  it('leaves a directive written as a string alone', () => {
    const file = probe(
      'quoted.mjs',
      "export const directive = '// eslint-disable-next-line';\n",
    );

    expect(inspect([file]).passed).toBe(true);
  });
});
