import { describe, expect, it } from 'vitest';

import { Game } from '../src/domain/game.ts';
import { katacombs } from '../src/domain/katacombs.ts';
import { explore } from '../src/domain/session.ts';

import { RecordedScreen } from './fakes/recorded-screen.ts';
import { TypedLines } from './fakes/typed-lines.ts';

describe('a session', () => {
  it('prints where the player starts before asking for anything', async () => {
    const screen = new RecordedScreen();

    await explore(aGame(), new TypedLines(['QUIT']), screen);

    expect(screen.shown).toEqual(['Entrance Hall', 'Daylight dies on wet flagstones.']);
  });

  it('obeys each line in turn until the player quits', async () => {
    const screen = new RecordedScreen();

    await explore(aGame(), new TypedLines(['GO N', 'GO S', 'QUIT']), screen);

    expect(screen.shown.slice(2)).toEqual([
      'Guard Room',
      'Rusted pikes lean in a rack.',
      'Entrance Hall',
      'Daylight dies on wet flagstones.',
    ]);
  });

  it('stops asking once the player has quit', async () => {
    const lines = new TypedLines(['QUIT', 'GO N']);

    await explore(aGame(), lines, new RecordedScreen());

    expect(await lines.ask()).toBe('GO N');
  });

  it('ends when the player goes away without quitting', async () => {
    const screen = new RecordedScreen();

    await explore(aGame(), new TypedLines([]), screen);

    expect(screen.shown).toEqual(['Entrance Hall', 'Daylight dies on wet flagstones.']);
  });
});

function aGame(): Game {
  return Game.begin(katacombs());
}
