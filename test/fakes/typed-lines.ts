import type { PlayerInput } from '../../src/ports/player-input.ts';

export class TypedLines implements PlayerInput {
  readonly #lines: string[];

  constructor(lines: readonly string[]) {
    this.#lines = [...lines];
  }

  ask(): Promise<string | null> {
    const line = this.#lines.shift();

    return Promise.resolve(line ?? null);
  }
}
