import type { Direction } from './direction.ts';
import { opposite } from './direction.ts';
import type { Door } from './door.ts';
import type { Item } from './item.ts';
import type { Noun } from './noun.ts';
import { named } from './thing.ts';

export type Views = Readonly<Partial<Record<Direction, string>>>;

export class Location {
  readonly title: string;
  readonly description: string;
  readonly #exits = new Map<Direction, Location>();
  readonly #doors = new Map<Direction, Door>();
  readonly #views: Views;
  #items: readonly Item[] = [];

  constructor(title: string, description: string, views: Views = {}) {
    this.title = title;
    this.description = description;
    this.#views = views;
  }

  static lay(place: Location, ...items: readonly Item[]): void {
    place.#items = [...place.#items, ...items];
  }

  static connect(from: Location, direction: Direction, to: Location): void {
    from.#exits.set(direction, to);
    to.#exits.set(opposite(direction), from);
  }

  static connectThrough(
    from: Location,
    direction: Direction,
    to: Location,
    door: Door,
  ): void {
    Location.connect(from, direction, to);
    from.#doors.set(direction, door);
    to.#doors.set(opposite(direction), door);
  }

  toward(direction: Direction): Location | null {
    return this.#exits.get(direction) ?? null;
  }

  view(direction: Direction): string | null {
    return this.#views[direction] ?? null;
  }

  doorToward(direction: Direction): Door | null {
    return this.#doors.get(direction) ?? null;
  }

  doors(): readonly Door[] {
    return [...this.#doors.values()];
  }

  items(): readonly Item[] {
    return this.#items;
  }

  doorNamed(noun: Noun): Door | null {
    return named(this.doors(), noun);
  }
}
