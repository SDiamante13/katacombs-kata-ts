import { describe, expect, it } from 'vitest';

import type { Direction } from '../src/domain/direction.ts';
import { katacombs } from '../src/domain/katacombs.ts';
import { NOUNS } from '../src/domain/noun.ts';
import type { Location } from '../src/domain/location.ts';

import { described, everyPlace, walk, waysWhere } from './support/the-map.ts';

describe('the katacombs', () => {
  it('let the player in at the Entrance Hall', () => {
    expect(described(katacombs())).toEqual([
      'Entrance Hall',
      'Daylight dies on wet flagstones.',
    ]);
  });

  it.each([
    { path: ['N'], title: 'Guard Room', line: 'Rusted pikes lean in a rack.' },
    { path: ['N', 'E'], title: 'Armoury', line: 'Empty racks, stripped to the pegs.' },
    { path: ['E'], title: 'Cistern', line: 'Black water laps at a stone ledge.' },
    { path: ['DOWN'], title: 'Crypt', line: 'Shelves of the dead, names worn off.' },
    { path: ['N', 'UP'], title: 'Watchtower', line: 'Arrow slits look out on fog.' },
    {
      path: ['DOWN', 'E'],
      title: 'Ossuary',
      line: 'Bones stacked to the vault, sorted by kind.',
    },
  ] as const)('hold the $title, reached by $path', ({ path, title, line }) => {
    expect(described(walk(path))).toEqual([title, line]);
  });

  it('bring the player back to the Entrance Hall after four moves', () => {
    expect(walk(['N', 'E', 'S', 'W']).title).toBe('Entrance Hall');
  });

  it('describe a place the same way on the way back as on the way in', () => {
    expect(described(walk(['N', 'S']))).toEqual(described(katacombs()));
  });

  it.each([
    { path: ['N', 'S'], title: 'Entrance Hall' },
    { path: ['N', 'E', 'W'], title: 'Guard Room' },
    { path: ['N', 'E', 'S', 'N'], title: 'Armoury' },
    { path: ['E', 'W'], title: 'Entrance Hall' },
    { path: ['DOWN', 'UP'], title: 'Entrance Hall' },
    { path: ['N', 'UP', 'DOWN'], title: 'Guard Room' },
    { path: ['DOWN', 'E', 'W'], title: 'Crypt' },
  ] as const)('lead back to the $title along $path', ({ path, title }) => {
    expect(walk(path).title).toBe(title);
  });

  it('give every location a title of its own', () => {
    expect(new Set(everyTitle()).size).toBe(everyTitle().length);
  });

  it('refuse a direction the Entrance Hall has no exit for', () => {
    expect(katacombs().toward('W')).toBeNull();
  });
});

describe('what the katacombs shut', () => {
  it('hang an iron gate east of the Crypt, and it answers to GATE', () => {
    expect(walk(['DOWN']).doorNamed('GATE')?.describe(false)).toBe(
      'An iron gate of black bars, hung in the arch. It is closed.',
    );
  });

  it('hang the same gate on the Ossuary side of the arch', () => {
    expect(walk(['DOWN', 'E']).doorToward('W')?.closed()).toBe(
      'The iron gate is closed.',
    );
  });

  it('leave every other way through them unobstructed', () => {
    expect(waysWhere(isShut)).toEqual(['Crypt E', 'Ossuary W']);
  });
});

describe('what the katacombs leave lying about', () => {
  it('leave a rusted key in the Guard Room, and it answers to KEY', () => {
    expect(
      walk(['N'])
        .items()
        .map((item) => item.describe()),
    ).toEqual(['A key of black iron, its teeth worn round.']);
  });

  it('leave a brass lantern in the Armoury, and it answers to LANTERN', () => {
    expect(
      walk(['N', 'E'])
        .items()
        .map((item) => item.describe()),
    ).toEqual(['A brass lantern, its glass smoked but whole.']);
  });

  it('name every loose thing with a word the parser knows', () => {
    expect(everyPlace().flatMap(unnamedItemsIn)).toEqual([]);
  });

  it('leave the rest of the world bare', () => {
    expect(placesHoldingSomething()).toEqual(['Guard Room', 'Armoury']);
  });
});

function unnamedItemsIn(place: Location): readonly string[] {
  return place
    .items()
    .filter((item) => NOUNS.every((noun) => !item.answersTo(noun)))
    .map((item) => `${place.title}: ${item.held()}`);
}

function placesHoldingSomething(): readonly string[] {
  return everyPlace()
    .filter((place) => place.items().length > 0)
    .map((place) => place.title);
}

function everyTitle(): readonly string[] {
  return everyPlace().map((place) => place.title);
}

function isShut(place: Location, way: Direction): boolean {
  return place.doorToward(way) !== null;
}
