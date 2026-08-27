import { describe, expect, it } from 'vitest';

import { playInTerminal } from '../../src/adapters/terminal/terminal-game.ts';
import { RecordedWriter } from '../fakes/recorded-writer.ts';
import { ScriptedKeyboard } from '../fakes/scripted-keyboard.ts';

describe('playing in a terminal', () => {
  it('walks a loop back to where the player started', async () => {
    const keyboard = new ScriptedKeyboard(['GO N', 'GO E', 'GO S', 'GO W', 'QUIT']);
    const screen = new RecordedWriter();

    await playInTerminal(keyboard, screen);

    expect(screen.written.slice(-3)).toEqual([
      'Entrance Hall\n',
      'Daylight dies on wet flagstones.\n',
      '> ',
    ]);
  });

  it('lets go of the keyboard when the player quits', async () => {
    const keyboard = new ScriptedKeyboard(['QUIT']);

    await playInTerminal(keyboard, new RecordedWriter());

    expect(keyboard.closed).toBe(true);
  });

  it('lets go of the keyboard when the player walks away', async () => {
    const keyboard = new ScriptedKeyboard([]);

    await playInTerminal(keyboard, new RecordedWriter());

    expect(keyboard.closed).toBe(true);
  });

  it('prints the opening description before asking for a command', async () => {
    const screen = new RecordedWriter();

    await playInTerminal(new ScriptedKeyboard(['QUIT']), screen);

    expect(screen.written).toEqual([
      'Entrance Hall\n',
      'Daylight dies on wet flagstones.\n',
      '> ',
    ]);
  });

  it('describes a direction without walking the player down it', async () => {
    const keyboard = new ScriptedKeyboard(['LOOK N', 'QUIT']);
    const screen = new RecordedWriter();

    await playInTerminal(keyboard, screen);

    expect(afterTheOpening(screen)).toEqual([
      '> ',
      'A low arch, and torch smoke curling out of it.\n',
      '> ',
    ]);
  });
});

const OPENING = ['Entrance Hall\n', 'Daylight dies on wet flagstones.\n'];

function afterTheOpening(screen: RecordedWriter): readonly string[] {
  return screen.written.slice(OPENING.length);
}
