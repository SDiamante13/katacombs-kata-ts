import type { PlayerInput } from '../../ports/player-input.ts';

import type { LineWriter } from './terminal-output.ts';

const PROMPT = '> ';

export class TerminalInput implements PlayerInput {
  readonly #lines: AsyncIterator<string>;
  readonly #screen: LineWriter;

  constructor(keyboard: AsyncIterable<string>, screen: LineWriter) {
    this.#lines = keyboard[Symbol.asyncIterator]();
    this.#screen = screen;
  }

  async ask(): Promise<string | null> {
    this.#screen.write(PROMPT);

    const line = await this.#lines.next();

    return line.done === true ? null : line.value;
  }
}
