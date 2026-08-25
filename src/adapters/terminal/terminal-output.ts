import type { GameOutput } from '../../ports/game-output.ts';

export interface LineWriter {
  write(text: string): void;
}

export class TerminalOutput implements GameOutput {
  readonly #writer: LineWriter;

  constructor(writer: LineWriter) {
    this.#writer = writer;
  }

  show(lines: readonly string[]): void {
    for (const line of lines) this.#writer.write(`${line}\n`);
  }
}
