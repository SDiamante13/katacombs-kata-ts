import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { ESLint } from 'eslint';
import { afterAll, describe, expect, it } from 'vitest';

import { guideForRule } from '../../scripts/sensor-guides.mjs';

const domain = path.resolve('src/domain');
const fixture = path.join(domain, '__sensor-fixture__.ts');
const eslint = new ESLint();

afterAll(() => rmSync(path.resolve('src'), { recursive: true, force: true }));

async function rulesFiredOn(code) {
  mkdirSync(domain, { recursive: true });
  writeFileSync(fixture, code);
  const [result] = await eslint.lintFiles([fixture]);

  return result.messages.map((message) => message.ruleId);
}

describe('the domain is fenced off from the outside world', () => {
  it('refuses an adapter import', async () => {
    const fired = await rulesFiredOn(
      "import { render } from '../adapters/terminal.js';\nexport const a = render;\n",
    );

    expect(fired).toContain('no-restricted-imports');
  });

  it('refuses a node builtin', async () => {
    const fired = await rulesFiredOn(
      "import { readFileSync } from 'node:fs';\nexport const a = readFileSync;\n",
    );

    expect(fired).toContain('no-restricted-imports');
  });

  it('refuses printing', async () => {
    const fired = await rulesFiredOn(
      'export function a(): void {\n  console.log("hi");\n}\n',
    );

    expect(fired).toContain('no-restricted-globals');
  });

  it('refuses a wall clock and its dice', async () => {
    const fired = await rulesFiredOn(
      'export function a(): number {\n  return Math.random() + Date.now();\n}\n',
    );

    expect(fired.filter((rule) => rule === 'no-restricted-syntax')).toHaveLength(2);
  });

  it('allows a pure domain function', async () => {
    const fired = await rulesFiredOn(
      'export function describeRoom(name: string): string {\n  return `You are in ${name}.`;\n}\n',
    );

    expect(fired).toEqual([]);
  });
});

describe('the design findings are coached', () => {
  it('maps each design rule to its own guide', () => {
    expect(guideForRule('no-restricted-imports').name).toBe('boundary-violation');
    expect(guideForRule('no-restricted-globals').name).toBe('impure-domain');
    expect(guideForRule('no-restricted-syntax').name).toBe('nondeterministic-domain');
    expect(guideForRule('sensors/no-mocking-library').name).toBe('mocking-library');
  });
});
