import { describe, expect, it } from 'vitest';

import type { Direction } from '../src/domain/direction.ts';
import { DIRECTIONS } from '../src/domain/direction.ts';
import { katacombs } from '../src/domain/katacombs.ts';
import type { Location } from '../src/domain/location.ts';

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

describe('what the katacombs show', () => {
  it.each([
    { path: [], way: 'N', shown: 'A low arch, and torch smoke curling out of it.' },
    { path: [], way: 'E', shown: 'A passage slopes away towards the sound of water.' },
    {
      path: [],
      way: 'S',
      shown: 'The stair you came down, choked with rubble to the roof.',
    },
    { path: [], way: 'DOWN', shown: 'Steps drop under the flagstones into cold air.' },
    { path: ['N'], way: 'S', shown: 'Grey daylight, back the way you came.' },
    { path: ['N'], way: 'E', shown: 'A doorway with its door off the hinges.' },
    { path: ['N'], way: 'UP', shown: 'A ladder climbs to an open trapdoor.' },
    { path: ['N', 'E'], way: 'W', shown: 'The guard room, and the pikes leaning in it.' },
    {
      path: ['N', 'E'],
      way: 'S',
      shown: 'A drain runs off that way, and the air turns wet.',
    },
    { path: ['E'], way: 'N', shown: 'The drain climbs back towards the empty racks.' },
    { path: ['E'], way: 'W', shown: 'Flagstones, and the last of the daylight on them.' },
    { path: ['DOWN'], way: 'UP', shown: 'Steps climb back towards the daylight.' },
    {
      path: ['N', 'UP'],
      way: 'DOWN',
      shown: 'The ladder drops back through the trapdoor.',
    },
  ] as const)('show "$shown" to the $way of $path', ({ path, way, shown }) => {
    expect(walk(path).view(way)).toBe(shown);
  });

  it('describe a way out of the Entrance Hall that the player cannot walk', () => {
    expect([katacombs().view('S'), katacombs().toward('S')]).toEqual([
      'The stair you came down, choked with rubble to the roof.',
      null,
    ]);
  });

  it('describe every exit they offer, so looking comes before walking', () => {
    expect(undescribedExits()).toEqual([]);
  });
});

function described(place: Location): readonly string[] {
  return [place.title, place.description];
}

function walk(path: readonly Direction[]): Location {
  return path.reduce(stepOrFail, katacombs());
}

function stepOrFail(here: Location, direction: Direction): Location {
  const there = here.toward(direction);

  if (there === null) throw new Error(`no exit ${direction} from ${here.title}`);

  return there;
}

function everyPlace(): readonly Location[] {
  return [
    katacombs(),
    walk(['N']),
    walk(['N', 'E']),
    walk(['E']),
    walk(['DOWN']),
    walk(['N', 'UP']),
  ];
}

function everyTitle(): readonly string[] {
  return everyPlace().map((place) => place.title);
}

function undescribedExits(): readonly string[] {
  return everyPlace().flatMap((place) =>
    DIRECTIONS.filter(
      (way) => place.toward(way) !== null && place.view(way) === null,
    ).map((way) => `${place.title} ${way}`),
  );
}
