import type { LineWriter } from '../../src/adapters/terminal/terminal-output.ts';

export class RecordedWriter implements LineWriter {
  readonly written: string[] = [];

  write(text: string): void {
    this.written.push(text);
  }
}
