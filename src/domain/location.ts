import type { Direction } from './direction.ts';
import { opposite } from './direction.ts';

export type Views = Readonly<Partial<Record<Direction, string>>>;

export class Location {
  readonly title: string;
  readonly description: string;
  readonly #exits = new Map<Direction, Location>();
  readonly #views: Views;

  constructor(title: string, description: string, views: Views = {}) {
    this.title = title;
    this.description = description;
    this.#views = views;
  }

  static connect(from: Location, direction: Direction, to: Location): void {
    from.#exits.set(direction, to);
    to.#exits.set(opposite(direction), from);
  }

  toward(direction: Direction): Location | null {
    return this.#exits.get(direction) ?? null;
  }

  view(direction: Direction): string | null {
    return this.#views[direction] ?? null;
  }
}
