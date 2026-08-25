import type { GameOutput } from '../../src/ports/game-output.ts';

export class RecordedScreen implements GameOutput {
  readonly shown: string[] = [];

  show(lines: readonly string[]): void {
    this.shown.push(...lines);
  }
}
