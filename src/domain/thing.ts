import type { Noun } from './noun.ts';

export abstract class Thing {
  protected readonly name: string;
  protected readonly detail: string;
  readonly #noun: Noun;

  constructor(noun: Noun, name: string, detail: string) {
    this.#noun = noun;
    this.name = name;
    this.detail = detail;
  }

  answersTo(word: string): boolean {
    return this.#noun === word;
  }
}

export function named<Named extends Thing>(
  things: readonly Named[],
  noun: Noun,
): Named | null {
  return things.find((thing) => thing.answersTo(noun)) ?? null;
}
