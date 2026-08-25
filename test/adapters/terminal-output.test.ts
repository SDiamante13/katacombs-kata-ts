import { describe, expect, it } from 'vitest';

import { TerminalOutput } from '../../src/adapters/terminal/terminal-output.ts';
import { RecordedWriter } from '../fakes/recorded-writer.ts';

describe('the terminal screen', () => {
  it('writes every line, each on a line of its own', () => {
    const writer = new RecordedWriter();

    new TerminalOutput(writer).show([
      'Entrance Hall',
      'Daylight dies on wet flagstones.',
    ]);

    expect(writer.written).toEqual([
      'Entrance Hall\n',
      'Daylight dies on wet flagstones.\n',
    ]);
  });

  it('writes nothing when the game says nothing', () => {
    const writer = new RecordedWriter();

    new TerminalOutput(writer).show([]);

    expect(writer.written).toEqual([]);
  });
});
