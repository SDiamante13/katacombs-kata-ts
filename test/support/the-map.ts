import type { Direction } from '../../src/domain/direction.ts';
import { DIRECTIONS } from '../../src/domain/direction.ts';
import { katacombs } from '../../src/domain/katacombs.ts';
import type { Location } from '../../src/domain/location.ts';

export function described(place: Location): readonly string[] {
  return [place.title, place.description];
}

export function walk(path: readonly Direction[]): Location {
  return path.reduce(stepOrFail, katacombs());
}

export function everyPlace(): readonly Location[] {
  return [
    katacombs(),
    walk(['N']),
    walk(['N', 'E']),
    walk(['E']),
    walk(['DOWN']),
    walk(['N', 'UP']),
    walk(['DOWN', 'E']),
  ];
}

export function waysWhere(
  matches: (place: Location, way: Direction) => boolean,
): readonly string[] {
  return everyPlace().flatMap((place) =>
    DIRECTIONS.filter((way) => matches(place, way)).map((way) => `${place.title} ${way}`),
  );
}

function stepOrFail(here: Location, direction: Direction): Location {
  const there = here.toward(direction);

  if (there === null) throw new Error(`no exit ${direction} from ${here.title}`);

  return there;
}
