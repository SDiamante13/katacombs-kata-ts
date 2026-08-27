import { describe, expect, it } from 'vitest';

import type { Direction } from '../src/domain/direction.ts';
import { katacombs } from '../src/domain/katacombs.ts';
import type { Location } from '../src/domain/location.ts';

import { walk, waysWhere } from './support/the-map.ts';

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
      path: ['DOWN'],
      way: 'E',
      shown: 'Bars of black iron, and the dark carrying on behind them.',
    },
    {
      path: ['DOWN', 'E'],
      way: 'W',
      shown: 'The crypt, and its shelves of worn-off names.',
    },
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
    expect(waysWhere(isWalkableButUnseen)).toEqual([]);
  });
});

function isWalkableButUnseen(place: Location, way: Direction): boolean {
  return place.toward(way) !== null && place.view(way) === null;
}
