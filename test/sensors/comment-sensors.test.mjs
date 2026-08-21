import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

import { guideForRule, guides, kernels } from '../../scripts/sensor-guides.mjs';

const eslint = new ESLint();

async function rulesFiredOn(code) {
  const [result] = await eslint.lintText(code, { filePath: 'scripts/fixture.mjs' });

  return result.messages.map((message) => message.ruleId);
}

describe('the comment sensors are wired into the real config', () => {
  it('reports commented-out code', async () => {
    const fired = await rulesFiredOn(
      '// const legacy = buildRoom(name);\nexport const a = 1;\n',
    );

    expect(fired).toContain('sensors/no-commented-out-code');
  });

  it('reports deferred work', async () => {
    const fired = await rulesFiredOn(
      '// TODO: handle the locked door\nexport const a = 1;\n',
    );

    expect(fired).toContain('no-warning-comments');
  });

  it('leaves a why-comment alone', async () => {
    const fired = await rulesFiredOn(
      '// the vault door sticks because the room table is 1-indexed\nexport const a = 1;\n',
    );

    expect(fired).toEqual([]);
  });

  it('leaves a what-comment to the design sensor rather than guessing', async () => {
    const fired = await rulesFiredOn('// set the counter to zero\nexport const a = 1;\n');

    expect(fired).toEqual([]);
  });
});

describe('every finding is coached', () => {
  it('maps the comment rules to their own guides', () => {
    expect(guideForRule('sensors/no-commented-out-code').name).toBe('commented-out-code');
    expect(guideForRule('no-warning-comments').name).toBe('deferred-work');
  });

  it('falls back to the sensor contract for any unmapped rule', () => {
    expect(guideForRule('no-debugger').name).toBe('sensor-contract');
  });

  it('gives every guide text and a kernel for its back-reference', () => {
    for (const name of Object.keys(guides)) {
      expect(guides[name].length, `${name} has no text`).toBeGreaterThan(0);
      expect(kernels[name], `${name} has no kernel`).toBeTruthy();
    }
  });
});
