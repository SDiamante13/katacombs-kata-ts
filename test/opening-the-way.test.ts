import { describe, expect, it } from 'vitest';

import { Game } from '../src/domain/game.ts';
import { katacombs } from '../src/domain/katacombs.ts';

describe('a door in the way', () => {
  it('is part of the place the player arrives in', () => {
    expect(inTheCrypt().arrival()).toEqual([
      'Crypt',
      'Shelves of the dead, names worn off.',
      'An iron gate of black bars, hung in the arch. It is closed.',
    ]);
  });

  it('names itself when it refuses the way through', () => {
    expect(inTheCrypt().play('GO E').said).toEqual(['The iron gate is closed.']);
  });

  it('tells being stopped by a thing apart from having nowhere to go', () => {
    expect([inTheCrypt().play('GO E').said, inTheCrypt().play('GO N').said]).toEqual([
      ['The iron gate is closed.'],
      ['You cannot go that way.'],
    ]);
  });

  it('leaves the player where they were when it refuses', () => {
    expect(inTheCrypt().play('GO E').next.arrival()).toEqual(inTheCrypt().arrival());
  });

  it('says so when the player opens it', () => {
    expect(inTheCrypt().play('OPEN GATE').said).toEqual(['The iron gate is now open.']);
  });

  it('leaves the game running when it opens', () => {
    expect(theOpenedGate().finished).toBe(false);
  });

  it('does not carry the player through the moment it opens', () => {
    expect(theOpenedGate().arrival()).toEqual(
      inTheCrypt()
        .arrival()
        .slice(0, 2)
        .concat('An iron gate of black bars, hung in the arch. It is open.'),
    );
  });

  it('lets the player through once it is open', () => {
    expect(theOpenedGate().play('GO E').said).toEqual(OSSUARY);
  });

  it('stays open behind the player', () => {
    const goneThroughAndBack = theOpenedGate().play('GO E').next.play('GO W').next;

    expect(goneThroughAndBack.play('GO E').said).toEqual(OSSUARY);
  });

  it('says it was open already when the player opens it twice', () => {
    expect(theOpenedGate().play('OPEN GATE').said).toEqual([
      'The iron gate is already open.',
    ]);
  });

  it('describes itself, and that it is shut, when the player looks at it', () => {
    expect(inTheCrypt().play('LOOK GATE').said).toEqual([
      'An iron gate of black bars, hung in the arch. It is closed.',
    ]);
  });

  it('describes itself as open once it is', () => {
    expect(theOpenedGate().play('LOOK GATE').said).toEqual([
      'An iron gate of black bars, hung in the arch. It is open.',
    ]);
  });

  it('does not move the player when they only look at it', () => {
    expect(inTheCrypt().play('LOOK GATE').next.arrival()).toEqual(inTheCrypt().arrival());
  });
});

describe('a thing that is not here', () => {
  it('cannot be opened', () => {
    expect(aGame().play('OPEN GATE').said).toEqual(['There is no such thing here.']);
  });

  it('cannot be looked at', () => {
    expect(aGame().play('LOOK GATE').said).toEqual(['There is no such thing here.']);
  });

  it('is refused in words of its own, not the ones for a dead direction', () => {
    expect(aGame().play('OPEN GATE').said).not.toEqual(aGame().play('GO W').said);
  });

  it('leaves the player where they were', () => {
    expect(aGame().play('OPEN GATE').next.arrival()).toEqual(aGame().arrival());
  });
});

const OSSUARY = [
  'Ossuary',
  'Bones stacked to the vault, sorted by kind.',
  'An iron gate of black bars, hung in the arch. It is open.',
];

function aGame(): Game {
  return Game.begin(katacombs());
}

function inTheCrypt(): Game {
  return aGame().play('GO DOWN').next;
}

function theOpenedGate(): Game {
  return inTheCrypt().play('OPEN GATE').next;
}
