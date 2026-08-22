import { rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { ESLint } from 'eslint';
import { afterAll, describe, expect, it } from 'vitest';

import { guideForRule } from '../../scripts/sensor-guides.mjs';

const fixture = path.resolve('test/__test-design-fixture__.mjs');
const eslint = new ESLint();

afterAll(() => rmSync(fixture, { force: true }));

async function rulesFiredOn(code) {
  writeFileSync(fixture, code);
  const [result] = await eslint.lintFiles([fixture]);

  return result.messages.map((message) => message.ruleId);
}

const RULES = [
  'sensors/no-assertion-free-test',
  'sensors/no-mystery-guest',
  'sensors/no-branching-test',
  'sensors/no-looping-test',
  'sensors/named-arrange',
  'sensors/no-interaction-assertion',
];

describe('the test-design rules are wired into the real config', () => {
  it('reports a test that asserts nothing', async () => {
    const fired = await rulesFiredOn("it('does a thing', () => {\n  build();\n});\n");

    expect(fired).toContain('sensors/no-assertion-free-test');
  });

  it('reports a hook filling a binding the test reads', async () => {
    const fired = await rulesFiredOn(
      "let lamp;\nbeforeEach(() => {\n  lamp = aLamp();\n});\nit('lights', () => {\n  expect(lamp.lit).toBe(true);\n});\n",
    );

    expect(fired).toContain('sensors/no-mystery-guest');
  });

  it('reports a branch inside a test', async () => {
    const fired = await rulesFiredOn(
      "it('lights', () => {\n  if (dark) {\n    expect(f()).toBe(1);\n  }\n});\n",
    );

    expect(fired).toContain('sensors/no-branching-test');
  });

  it('reports a loop inside a test', async () => {
    const fired = await rulesFiredOn(
      "it('doubles', () => {\n  for (const n of [1, 2]) {\n    expect(f(n)).toBe(n);\n  }\n});\n",
    );

    expect(fired).toContain('sensors/no-looping-test');
  });

  it('reports an arrange nobody named', async () => {
    const setup = Array.from({ length: 9 }, (_, i) => `  const v${i} = ${i};`).join('\n');
    const fired = await rulesFiredOn(
      `it('lights', () => {\n${setup}\n  expect(v0).toBe(0);\n});\n`,
    );

    expect(fired).toContain('sensors/named-arrange');
  });

  it('reports an assertion about a call rather than an outcome', async () => {
    const fired = await rulesFiredOn(
      "it('saves', () => {\n  expect(save).toHaveBeenCalledWith(lamp);\n});\n",
    );

    expect(fired).toContain('sensors/no-interaction-assertion');
  });

  it('leaves a test written in the house style alone', async () => {
    const fired = await rulesFiredOn(
      "it('shows the row', async () => {\n  givenAStock();\n  await thenUserSees('AAPL');\n});\n",
    );

    expect(fired.filter((rule) => RULES.includes(rule))).toEqual([]);
  });

  it.each(RULES)('coaches %s rather than rendering it bare', (rule) => {
    const guide = guideForRule(rule);

    expect(guide.name).not.toBe('sensor-contract');
    expect(guide.text.length).toBeGreaterThan(0);
  });
});
