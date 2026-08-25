import { describe, expect, it } from 'vitest';

import { DIRECTIONS, directionFrom, opposite } from '../src/domain/direction.ts';

describe('a direction', () => {
  it.each(DIRECTIONS)('is read from the word %s', (word) => {
    expect(directionFrom(word)).toBe(word);
  });

  it('is not a word the compass has never heard of', () => {
    expect(directionFrom('SIDEWAYS')).toBeNull();
  });

  it('is not a word that was never typed', () => {
    expect(directionFrom(undefined)).toBeNull();
  });
});

describe('turning around', () => {
  it.each([
    ['N', 'S'],
    ['E', 'W'],
    ['S', 'N'],
    ['W', 'E'],
    ['UP', 'DOWN'],
    ['DOWN', 'UP'],
  ] as const)('faces %s back towards %s', (going, back) => {
    expect(opposite(going)).toBe(back);
  });
});
