import type { Door } from './door.ts';

export class Opened {
  readonly #doors: ReadonlySet<Door>;

  private constructor(doors: ReadonlySet<Door>) {
    this.#doors = doors;
  }

  static none(): Opened {
    return new Opened(new Set());
  }

  has(door: Door): boolean {
    return this.#doors.has(door);
  }

  with(door: Door): Opened {
    return new Opened(new Set([...this.#doors, door]));
  }
}
