import type { Noun } from './noun.ts';

export class Door {
  readonly #noun: Noun;
  readonly #name: string;
  readonly #detail: string;

  constructor(noun: Noun, name: string, detail: string) {
    this.#noun = noun;
    this.#name = name;
    this.#detail = detail;
  }

  answersTo(word: string): boolean {
    return this.#noun === word;
  }

  describe(open: boolean): string {
    return `${this.#detail} It is ${open ? 'open' : 'closed'}.`;
  }

  closed(): string {
    return this.#reads('closed');
  }

  opens(): string {
    return this.#reads('now open');
  }

  alreadyOpen(): string {
    return this.#reads('already open');
  }

  #reads(state: string): string {
    return `The ${this.#name} is ${state}.`;
  }
}
