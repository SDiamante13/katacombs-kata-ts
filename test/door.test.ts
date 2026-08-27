import { describe, expect, it } from 'vitest';

import { Door } from '../src/domain/door.ts';

describe('a door', () => {
  it('describes itself and says it is shut', () => {
    const gate = new Door('GATE', 'iron gate', 'An iron gate of black bars.');

    expect(gate.describe(false)).toBe('An iron gate of black bars. It is closed.');
  });

  it('describes itself and says it is open', () => {
    const gate = new Door('GATE', 'iron gate', 'An iron gate of black bars.');

    expect(gate.describe(true)).toBe('An iron gate of black bars. It is open.');
  });

  it('names itself when it is in the way', () => {
    const gate = new Door('GATE', 'iron gate', 'An iron gate of black bars.');

    expect(gate.closed()).toBe('The iron gate is closed.');
  });

  it('names itself when it gives way', () => {
    const gate = new Door('GATE', 'iron gate', 'An iron gate of black bars.');

    expect(gate.opens()).toBe('The iron gate is now open.');
  });

  it('names itself when it was open already', () => {
    const gate = new Door('GATE', 'iron gate', 'An iron gate of black bars.');

    expect(gate.alreadyOpen()).toBe('The iron gate is already open.');
  });

  it('answers to the word the player types for it', () => {
    const gate = new Door('GATE', 'iron gate', 'An iron gate of black bars.');

    expect(gate.answersTo('GATE')).toBe(true);
  });

  it('does not answer to a word for something else', () => {
    const gate = new Door('GATE', 'iron gate', 'An iron gate of black bars.');

    expect(gate.answersTo('BANANA')).toBe(false);
  });
});
