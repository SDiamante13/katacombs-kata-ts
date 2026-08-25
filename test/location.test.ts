import { describe, expect, it } from 'vitest';

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
