import { describe, expect, it } from 'vitest';

import { TerminalInput } from '../../src/adapters/terminal/terminal-input.ts';
import { RecordedWriter } from '../fakes/recorded-writer.ts';
import { ScriptedKeyboard } from '../fakes/scripted-keyboard.ts';

describe('the terminal keyboard', () => {
  it('hands back the line the player typed', async () => {
    const keyboard = new ScriptedKeyboard(['GO N']);

    expect(await new TerminalInput(keyboard, new RecordedWriter()).ask()).toBe('GO N');
  });

  it('shows a prompt before each line it asks for', async () => {
    const screen = new RecordedWriter();
    const input = new TerminalInput(new ScriptedKeyboard(['GO N', 'QUIT']), screen);

    await input.ask();
    await input.ask();

    expect(screen.written).toEqual(['> ', '> ']);
  });

  it('hands back nothing once the player has gone', async () => {
    const keyboard = new ScriptedKeyboard([]);

    expect(await new TerminalInput(keyboard, new RecordedWriter()).ask()).toBeNull();
  });
});
