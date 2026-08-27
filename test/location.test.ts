import { describe, expect, it } from 'vitest';

import { Door } from '../src/domain/door.ts';
import { Location } from '../src/domain/location.ts';

describe('a location', () => {
  it('has no exit anywhere until one is opened', () => {
    const cell = new Location('Cell', 'Four walls and a drain.');

    expect(cell.toward('N')).toBeNull();
  });

  it('leads where a connection points it', () => {
    const cell = new Location('Cell', 'Four walls and a drain.');
    const corridor = new Location('Corridor', 'A corridor of damp brick.');

    Location.connect(cell, 'N', corridor);

    expect(cell.toward('N')).toBe(corridor);
  });

  it('leads back the way the player came', () => {
    const cell = new Location('Cell', 'Four walls and a drain.');
    const corridor = new Location('Corridor', 'A corridor of damp brick.');

    Location.connect(cell, 'N', corridor);

    expect(corridor.toward('S')).toBe(cell);
  });

  it('keeps the exits it already had when another is opened', () => {
    const cell = new Location('Cell', 'Four walls and a drain.');
    const corridor = new Location('Corridor', 'A corridor of damp brick.');
    const sump = new Location('Sump', 'A hole that swallows the rain.');

    Location.connect(cell, 'N', corridor);
    Location.connect(cell, 'DOWN', sump);

    expect([cell.toward('N'), cell.toward('DOWN')]).toEqual([corridor, sump]);
  });
});

describe('what a location shows', () => {
  it('describes a direction it was given a view for', () => {
    const cell = new Location('Cell', 'Four walls and a drain.', {
      N: 'A corridor of damp brick.',
    });

    expect(cell.view('N')).toBe('A corridor of damp brick.');
  });
  it('describes nothing in a direction it was given no view for', () => {
    const cell = new Location('Cell', 'Four walls and a drain.');

    expect(cell.view('N')).toBeNull();
  });
});

describe('a location with something shut in it', () => {
  it('has no door in a direction nothing was hung in', () => {
    const cell = new Location('Cell', 'Four walls and a drain.');

    expect(cell.doorToward('N')).toBeNull();
  });

  it('hangs a door in the direction it was hung in', () => {
    const { cell, grille } = aGrilledCell();

    expect(cell.doorToward('N')).toBe(grille);
  });

  it('shows the same door to whoever stands on the other side of it', () => {
    const { corridor, grille } = aGrilledCell();

    expect(corridor.doorToward('S')).toBe(grille);
  });

  it('still leads where it led before the door was hung', () => {
    const { cell, corridor } = aGrilledCell();

    expect(cell.toward('N')).toBe(corridor);
  });

  it('finds the thing standing in it by the word for it', () => {
    const { cell, grille } = aGrilledCell();

    expect(cell.thing('GATE')).toBe(grille);
  });

  it('finds nothing by that word where nothing was hung', () => {
    const cell = new Location('Cell', 'Four walls and a drain.');

    expect(cell.thing('GATE')).toBeNull();
  });

  it('lists what stands in it', () => {
    const { cell, grille } = aGrilledCell();

    expect(cell.doors()).toEqual([grille]);
  });

  it('lists nothing where nothing stands', () => {
    const cell = new Location('Cell', 'Four walls and a drain.');

    expect(cell.doors()).toEqual([]);
  });
});

function aGrilledCell(): { cell: Location; corridor: Location; grille: Door } {
  const cell = new Location('Cell', 'Four walls and a drain.');
  const corridor = new Location('Corridor', 'A corridor of damp brick.');
  const grille = new Door('GATE', 'grille', 'A grille of flat bars.');

  Location.connectThrough(cell, 'N', corridor, grille);

  return { cell, corridor, grille };
}
