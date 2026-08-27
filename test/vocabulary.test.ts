import { describe, expect, it } from 'vitest';

import { oneOf } from '../src/domain/vocabulary.ts';

describe('a closed vocabulary', () => {
  it('reads back a word it holds', () => {
    const spoken = oneOf(['GATE', 'DOOR']);

    expect(spoken('GATE')).toBe('GATE');
  });

  it('reads nothing from a word it does not hold', () => {
    const spoken = oneOf(['GATE', 'DOOR']);

    expect(spoken('BANANA')).toBeNull();
  });

  it('reads nothing from a word that was never typed', () => {
    const spoken = oneOf(['GATE', 'DOOR']);

    expect(spoken(undefined)).toBeNull();
  });
});
