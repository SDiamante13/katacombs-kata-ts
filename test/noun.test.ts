import { describe, expect, it } from 'vitest';

import { NOUNS, nounFrom } from '../src/domain/noun.ts';

describe('a noun', () => {
  it.each(NOUNS)('is read from the word %s', (word) => {
    expect(nounFrom(word)).toBe(word);
  });

  it('is not a word for a thing the world has never held', () => {
    expect(nounFrom('BANANA')).toBeNull();
  });
});
