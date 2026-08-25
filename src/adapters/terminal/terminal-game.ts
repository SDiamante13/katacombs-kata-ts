import { Game } from '../../domain/game.ts';
import { katacombs } from '../../domain/katacombs.ts';
import { explore } from '../../domain/session.ts';

import { TerminalInput } from './terminal-input.ts';
import type { LineWriter } from './terminal-output.ts';
import { TerminalOutput } from './terminal-output.ts';

export interface Keyboard extends AsyncIterable<string> {
  close(): void;
}

export async function playInTerminal(
  keyboard: Keyboard,
  screen: LineWriter,
): Promise<void> {
  const player = new TerminalInput(keyboard, screen);

  await explore(Game.begin(katacombs()), player, new TerminalOutput(screen));

  keyboard.close();
}
