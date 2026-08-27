import { describe, expect, it } from 'vitest';

import { Door } from '../src/domain/door.ts';
import { Opened } from '../src/domain/opened.ts';

describe('what the player has opened', () => {
  it('holds nothing before anything is opened', () => {
    const gate = new Door('GATE', 'iron gate', 'An iron gate of black bars.');

    expect(Opened.none().has(gate)).toBe(false);
  });

  it('holds the door it was given', () => {
    const gate = new Door('GATE', 'iron gate', 'An iron gate of black bars.');

    expect(Opened.none().with(gate).has(gate)).toBe(true);
  });

  it('does not hold a door it was never given', () => {
    const gate = new Door('GATE', 'iron gate', 'An iron gate of black bars.');
    const grille = new Door('GATE', 'grille', 'A grille of flat bars.');

    expect(Opened.none().with(gate).has(grille)).toBe(false);
  });

  it('leaves what it was made from as it was', () => {
    const gate = new Door('GATE', 'iron gate', 'An iron gate of black bars.');
    const nothingYet = Opened.none();

    nothingYet.with(gate);

    expect(nothingYet.has(gate)).toBe(false);
  });
});
