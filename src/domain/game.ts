import type { Command } from './command.ts';
import { commands, parse } from './command.ts';
import type { Direction } from './direction.ts';
import type { Door } from './door.ts';
import type { Location } from './location.ts';
import type { Noun } from './noun.ts';
import { Opened } from './opened.ts';
import { NOTHING_THERE, NOT_UNDERSTOOD, NO_EXIT, NO_SUCH_THING } from './replies.ts';
import { named } from './thing.ts';
import type { Moved } from './whereabouts.ts';
import { Whereabouts } from './whereabouts.ts';

export interface Turn {
  readonly next: Game;
  readonly said: readonly string[];
}

export class Game {
  readonly finished: boolean;
  readonly #here: Location;
  readonly #opened: Opened;
  readonly #whereabouts: Whereabouts;

  private constructor(
    here: Location,
    finished: boolean,
    opened: Opened,
    whereabouts: Whereabouts,
  ) {
    this.#here = here;
    this.finished = finished;
    this.#opened = opened;
    this.#whereabouts = whereabouts;
  }

  static begin(entrance: Location): Game {
    return new Game(entrance, false, Opened.none(), Whereabouts.asFound());
  }

  arrival(): readonly string[] {
    return [
      this.#here.title,
      this.#here.description,
      ...this.#whatStandsHere(),
      ...this.#whatLiesHere(),
    ];
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
      default:
        return this.#aboutThings(command);
    }
  }

  #aboutThings(command: Command): Turn {
    switch (command.kind) {
      case 'open':
        return this.#open(command.noun);
      case 'take':
        return this.#moving(this.#whereabouts.take(this.#here, command.noun));
      case 'drop':
        return this.#moving(this.#whereabouts.drop(this.#here, command.noun));
      case 'bag':
        return this.#says(this.#whereabouts.bagReads());
      default:
        return this.#aboutTheGame(command);
    }
  }

  #aboutTheGame(command: Command): Turn {
    switch (command.kind) {
      case 'help':
        return this.#says(commands());
      case 'quit':
        return { next: this.#ending(), said: [] };
      default:
        return this.#says([NOT_UNDERSTOOD]);
    }
  }

  #walk(direction: Direction): Turn {
    const there = this.#here.toward(direction);

    if (there === null) return this.#says([NO_EXIT]);

    const door = this.#here.doorToward(direction);

    if (door !== null && !this.#isOpen(door)) return this.#says([door.closed()]);

    const moved = new Game(there, false, this.#opened, this.#whereabouts);

    return { next: moved, said: moved.arrival() };
  }

  #inspect(noun: Noun): Turn {
    const door = this.#here.doorNamed(noun);

    if (door !== null) return this.#says([door.describe(this.#isOpen(door))]);

    const item = named(this.#whereabouts.withinReach(this.#here), noun);

    return this.#says([item === null ? NO_SUCH_THING : item.describe()]);
  }

  #open(noun: Noun): Turn {
    const door = this.#here.doorNamed(noun);

    if (door === null) return this.#says([NO_SUCH_THING]);
    if (this.#isOpen(door)) return this.#says([door.alreadyOpen()]);

    return { next: this.#opening(door), said: [door.opens()] };
  }

  #moving(move: Moved): Turn {
    return { next: this.#carrying(move.whereabouts), said: move.said };
  }

  #ending(): Game {
    return new Game(this.#here, true, this.#opened, this.#whereabouts);
  }

  #opening(door: Door): Game {
    return new Game(this.#here, false, this.#opened.with(door), this.#whereabouts);
  }

  #carrying(whereabouts: Whereabouts): Game {
    return new Game(this.#here, false, this.#opened, whereabouts);
  }

  #whatStandsHere(): readonly string[] {
    return this.#here.doors().map((door) => door.describe(this.#isOpen(door)));
  }

  #whatLiesHere(): readonly string[] {
    return this.#whereabouts.lyingIn(this.#here).map((item) => item.lying());
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
