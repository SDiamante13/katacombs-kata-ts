import type { Item } from './item.ts';
import type { Location } from './location.ts';
import type { Noun } from './noun.ts';
import { NO_SUCH_THING } from './replies.ts';
import { named } from './thing.ts';

const HANDFUL = 10;
const BAG_FULL = 'Your bag is full.';
const BAG_EMPTY = 'You are carrying nothing.';
const BAG_HOLDS = 'You are carrying:';

type Floors = ReadonlyMap<Location, readonly Item[]>;

export interface Moved {
  readonly whereabouts: Whereabouts;
  readonly said: readonly string[];
}

export class Whereabouts {
  readonly #bag: readonly Item[];
  readonly #floors: Floors;

  private constructor(bag: readonly Item[], floors: Floors) {
    this.#bag = bag;
    this.#floors = floors;
  }

  static asFound(): Whereabouts {
    return new Whereabouts([], new Map());
  }

  lyingIn(place: Location): readonly Item[] {
    // A game begins holding the entrance, not the map, so floors are layered rather than seeded.
    return this.#floors.get(place) ?? place.items();
  }

  withinReach(place: Location): readonly Item[] {
    return [...this.#bag, ...this.lyingIn(place)];
  }

  bagReads(): readonly string[] {
    if (this.#bag.length === 0) return [BAG_EMPTY];

    return [BAG_HOLDS, ...this.#bag.map((item) => item.held())];
  }

  take(place: Location, noun: Noun): Moved {
    const item = named(this.lyingIn(place), noun);

    if (item === null) return this.#refuses(NO_SUCH_THING);
    if (this.#bag.length === HANDFUL) return this.#refuses(BAG_FULL);

    const lifted = new Whereabouts(
      [...this.#bag, item],
      this.#floor(place, without(this.lyingIn(place), item)),
    );

    return { whereabouts: lifted, said: [item.taken()] };
  }

  drop(place: Location, noun: Noun): Moved {
    const item = named(this.#bag, noun);

    if (item === null) return this.#refuses(NO_SUCH_THING);

    const laid = new Whereabouts(
      without(this.#bag, item),
      this.#floor(place, [...this.lyingIn(place), item]),
    );

    return { whereabouts: laid, said: [item.dropped()] };
  }

  #refuses(reply: string): Moved {
    return { whereabouts: this, said: [reply] };
  }

  #floor(place: Location, items: readonly Item[]): Floors {
    return new Map(this.#floors).set(place, items);
  }
}

function without(items: readonly Item[], gone: Item): readonly Item[] {
  return items.filter((item) => item !== gone);
}
