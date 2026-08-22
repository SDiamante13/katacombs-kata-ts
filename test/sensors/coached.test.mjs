import { describe, expect, it } from 'vitest';

import config from '../../eslint.config.mjs';
import { guideForRule } from '../../scripts/sensor-guides.mjs';

const enabled = [
  ...new Set(
    config.flatMap((block) =>
      Object.entries(block.rules ?? {})
        .filter(([, setting]) => setting !== 'off')
        .map(([rule]) => rule),
    ),
  ),
];

describe('every rule the config turns on renders a guide', () => {
  it('found rules to check, so a config rename cannot make this vacuous', () => {
    expect(enabled.length).toBeGreaterThan(15);
  });

  it.each(enabled)('%s has coaching text and a kernel', (rule) => {
    const guide = guideForRule(rule);

    expect(guide.text.length).toBeGreaterThan(0);
    expect(guide.kernel.length).toBeGreaterThan(0);
  });

  it('falls back rather than rendering bare for a rule nobody mapped', () => {
    expect(guideForRule('some-plugin/rule-added-tomorrow').name).toBe('sensor-contract');
  });
});
