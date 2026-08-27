import { commands, parse } from './command.ts';
import type { Direction } from './direction.ts';
import type { Location } from './location.ts';

const NOT_UNDERSTOOD = 'I do not understand that.';
const NO_EXIT = 'You cannot go that way.';
const NOTHING_THERE = 'There is nothing interesting that way.';

export interface Turn {
  readonly next: Game;
  readonly said: readonly string[];
}

export class Game {
  readonly finished: boolean;
  readonly #here: Location;

  private constructor(here: Location, finished: boolean) {
    this.#here = here;
    this.finished = finished;
  }

  static begin(entrance: Location): Game {
    return new Game(entrance, false);
  }

  arrival(): readonly string[] {
    return [this.#here.title, this.#here.description];
  }

  play(input: string): Turn {
    const command = parse(input);

    switch (command.kind) {
      case 'go':
        return this.#walk(command.direction);
      case 'look':
        return this.#look(command.direction);
      case 'help':
        return this.#says(commands());
      case 'quit':
        return { next: new Game(this.#here, true), said: [] };
      default:
        return this.#says([NOT_UNDERSTOOD]);
    }
  }

  #walk(direction: Direction): Turn {
    const there = this.#here.toward(direction);

    if (there === null) return this.#says([NO_EXIT]);

    const moved = new Game(there, false);

    return { next: moved, said: moved.arrival() };
  }

  #look(direction: Direction | null): Turn {
    if (direction === null) return this.#says(this.arrival());

    return this.#says([this.#here.view(direction) ?? NOTHING_THERE]);
  }

  #says(said: readonly string[]): Turn {
    return { next: this, said };
  }
}
