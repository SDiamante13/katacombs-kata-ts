import { describe, expect, it } from 'vitest';

import { commands } from '../src/domain/command.ts';
import { Game } from '../src/domain/game.ts';
import { katacombs } from '../src/domain/katacombs.ts';

describe('starting a game', () => {
  it('prints the title and description of where the player wakes up', () => {
    expect(Game.begin(katacombs()).arrival()).toEqual([
      'Entrance Hall',
      'Daylight dies on wet flagstones.',
    ]);
  });

  it('is not over before anything has been typed', () => {
    expect(Game.begin(katacombs()).finished).toBe(false);
  });
});

describe('walking', () => {
  it('prints where the player arrives', () => {
    expect(aGame().play('GO N').said).toEqual([
      'Guard Room',
      'Rusted pikes lean in a rack.',
    ]);
  });

  it('leaves the game running', () => {
    expect(aGame().play('GO N').next.finished).toBe(false);
  });

  it('carries the player, so the next command starts from the new place', () => {
    expect(aGame().play('GO N').next.play('GO E').said).toEqual([
      'Armoury',
      'Empty racks, stripped to the pegs.',
    ]);
  });
});

describe('a refusal', () => {
  it('says the way is not there when the direction has no exit', () => {
    expect(aGame().play('GO W').said).toEqual(['You cannot go that way.']);
  });

  it('leaves the player where they were when the direction has no exit', () => {
    expect(aGame().play('GO W').next.arrival()).toEqual(aGame().arrival());
  });

  it('says the words were not understood when they are not a command', () => {
    expect(aGame().play('xyzzy').said).toEqual(['I do not understand that.']);
  });

  it('says the words were not understood when the direction is invented', () => {
    expect(aGame().play('GO SIDEWAYS').said).toEqual(['I do not understand that.']);
  });

  it('leaves the player where they were when the direction is invented', () => {
    expect(aGame().play('GO SIDEWAYS').next.arrival()).toEqual(aGame().arrival());
  });

  it('keeps taking commands after nonsense', () => {
    expect(aGame().play('xyzzy').next.play('GO N').said).toEqual([
      'Guard Room',
      'Rusted pikes lean in a rack.',
    ]);
  });
});

describe('the other two commands', () => {
  it('lists what the game understands when the player types a question mark', () => {
    expect(aGame().play('?').said).toEqual(commands());
  });

  it('ends the game on QUIT', () => {
    expect(aGame().play('QUIT').next.finished).toBe(true);
  });

  it('says nothing on the way out', () => {
    expect(aGame().play('QUIT').said).toEqual([]);
  });
});

function aGame(): Game {
  return Game.begin(katacombs());
}
