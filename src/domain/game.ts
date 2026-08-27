import type { Command } from './command.ts';
import { commands, parse } from './command.ts';
import type { Direction } from './direction.ts';
import type { Door } from './door.ts';
import type { Location } from './location.ts';
import type { Noun } from './noun.ts';
import { Opened } from './opened.ts';

const NOT_UNDERSTOOD = 'I do not understand that.';
const NO_EXIT = 'You cannot go that way.';
const NOTHING_THERE = 'There is nothing interesting that way.';
const NO_SUCH_THING = 'There is no such thing here.';

export interface Turn {
  readonly next: Game;
  readonly said: readonly string[];
}

export class Game {
  readonly finished: boolean;
  readonly #here: Location;
  readonly #opened: Opened;

  private constructor(here: Location, finished: boolean, opened: Opened) {
    this.#here = here;
    this.finished = finished;
    this.#opened = opened;
  }

  static begin(entrance: Location): Game {
    return new Game(entrance, false, Opened.none());
  }

  arrival(): readonly string[] {
    return [this.#here.title, this.#here.description, ...this.#whatStandsHere()];
  }

  play(input: string): Turn {
    const command = parse(input);

    switch (command.kind) {
      case 'go':
        return this.#walk(command.direction);
      case 'look':
        return this.#look(command.direction);
      case 'inspect':
        return this.#inspect(command.noun);
      case 'open':
        return this.#open(command.noun);
      default:
        return this.#aboutTheGame(command);
    }
  }

  #aboutTheGame(command: Command): Turn {
    switch (command.kind) {
      case 'help':
        return this.#says(commands());
      case 'quit':
        return { next: new Game(this.#here, true, this.#opened), said: [] };
      default:
        return this.#says([NOT_UNDERSTOOD]);
    }
  }

  #walk(direction: Direction): Turn {
    const there = this.#here.toward(direction);

    if (there === null) return this.#says([NO_EXIT]);

    const door = this.#here.doorToward(direction);

    if (door !== null && !this.#isOpen(door)) return this.#says([door.closed()]);

    const moved = new Game(there, false, this.#opened);

    return { next: moved, said: moved.arrival() };
  }

  #inspect(noun: Noun): Turn {
    const door = this.#here.thing(noun);

    if (door === null) return this.#says([NO_SUCH_THING]);

    return this.#says([door.describe(this.#isOpen(door))]);
  }

  #open(noun: Noun): Turn {
    const door = this.#here.thing(noun);

    if (door === null) return this.#says([NO_SUCH_THING]);
    if (this.#isOpen(door)) return this.#says([door.alreadyOpen()]);

    return { next: this.#opening(door), said: [door.opens()] };
  }

  #opening(door: Door): Game {
    return new Game(this.#here, false, this.#opened.with(door));
  }

  #whatStandsHere(): readonly string[] {
    return this.#here.doors().map((door) => door.describe(this.#isOpen(door)));
  }

  #isOpen(door: Door): boolean {
    return this.#opened.has(door);
  }

  #look(direction: Direction | null): Turn {
    if (direction === null) return this.#says(this.arrival());

    return this.#says([this.#here.view(direction) ?? NOTHING_THERE]);
  }

  #says(said: readonly string[]): Turn {
    return { next: this, said };
  }
}
