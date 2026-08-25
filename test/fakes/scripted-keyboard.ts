import type { Keyboard } from '../../src/adapters/terminal/terminal-game.ts';

export class ScriptedKeyboard implements Keyboard {
  closed = false;
  readonly #lines: string[];

  constructor(lines: readonly string[]) {
    this.#lines = [...lines];
  }

  close(): void {
    this.closed = true;
  }

  [Symbol.asyncIterator](): AsyncIterator<string> {
    return { next: (): Promise<IteratorResult<string>> => Promise.resolve(this.#read()) };
  }

  #read(): IteratorResult<string> {
    const line = this.#lines.shift();

    return line === undefined
      ? { done: true, value: undefined }
      : { done: false, value: line };
  }
}
