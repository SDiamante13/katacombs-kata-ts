import type { GameOutput } from '../ports/game-output.ts';
import type { PlayerInput } from '../ports/player-input.ts';

import type { Game } from './game.ts';

export async function explore(
  game: Game,
  player: PlayerInput,
  screen: GameOutput,
): Promise<void> {
  let here = game;

  screen.show(here.arrival());

  while (!here.finished) {
    const typed = await player.ask();

    if (typed === null) return;

    const turn = here.play(typed);

    screen.show(turn.said);
    here = turn.next;
  }
}
