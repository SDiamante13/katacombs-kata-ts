import { describe, expect, it } from 'vitest';

import { Item } from '../src/domain/item.ts';

describe('an item', () => {
  it('describes itself when the player looks at it', () => {
    const key = new Item('KEY', 'rusted key', 'A key of black iron.');

    expect(key.describe()).toBe('A key of black iron.');
  });

  it('names itself where it lies', () => {
    const key = new Item('KEY', 'rusted key', 'A key of black iron.');

    expect(key.lying()).toBe('A rusted key lies here.');
  });

  it('names itself in the bag', () => {
    const key = new Item('KEY', 'rusted key', 'A key of black iron.');

    expect(key.held()).toBe('A rusted key.');
  });

  it('names itself when it is picked up', () => {
    const key = new Item('KEY', 'rusted key', 'A key of black iron.');

    expect(key.taken()).toBe('You take the rusted key.');
  });

  it('names itself when it is put down', () => {
    const key = new Item('KEY', 'rusted key', 'A key of black iron.');

    expect(key.dropped()).toBe('You drop the rusted key.');
  });

  it('answers to the word the player types for it', () => {
    const key = new Item('KEY', 'rusted key', 'A key of black iron.');

    expect(key.answersTo('KEY')).toBe(true);
  });

  it('does not answer to a word for something else', () => {
    const key = new Item('KEY', 'rusted key', 'A key of black iron.');

    expect(key.answersTo('LANTERN')).toBe(false);
  });
});
