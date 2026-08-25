import type { Direction } from './direction.ts';
import { opposite } from './direction.ts';

export class Location {
  readonly title: string;
  readonly description: string;
  readonly #exits = new Map<Direction, Location>();

  constructor(title: string, description: string) {
    this.title = title;
    this.description = description;
  }

  static connect(from: Location, direction: Direction, to: Location): void {
    from.#exits.set(direction, to);
    to.#exits.set(opposite(direction), from);
  }

  toward(direction: Direction): Location | null {
    return this.#exits.get(direction) ?? null;
  }
}
