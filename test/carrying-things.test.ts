import { describe, expect, it } from 'vitest';

import { Game } from '../src/domain/game.ts';
import { katacombs } from '../src/domain/katacombs.ts';

describe('what lies in a place', () => {
  it('is listed under the title and description on arrival', () => {
    expect(inTheGuardRoom().arrival()).toEqual([
      'Guard Room',
      'Rusted pikes lean in a rack.',
      'A rusted key lies here.',
    ]);
  });

  it('is listed again when the player looks around', () => {
    expect(inTheGuardRoom().play('LOOK').said).toEqual(inTheGuardRoom().arrival());
  });

  it('is gone from the place once the player has taken it', () => {
    expect(carryingTheKey().play('LOOK').said).toEqual([
      'Guard Room',
      'Rusted pikes lean in a rack.',
    ]);
  });

  it('lies where it was dropped, and is still there on the way back', () => {
    const droppedInTheArmoury = carryingTheKey().play('GO E').next.play('DROP KEY').next;
    const walkedAwayAndBack = droppedInTheArmoury.play('GO W').next.play('GO E').next;

    expect(walkedAwayAndBack.play('LOOK').said).toContain('A rusted key lies here.');
  });
});

describe('taking a thing', () => {
  it('says the player has taken it', () => {
    expect(inTheGuardRoom().play('TAKE KEY').said).toEqual(['You take the rusted key.']);
  });

  it('leaves the game running', () => {
    expect(carryingTheKey().finished).toBe(false);
  });

  it('refuses a thing that is not lying here', () => {
    expect(inTheGuardRoom().play('TAKE LANTERN').said).toEqual([
      'There is no such thing here.',
    ]);
  });

  it('refuses a word the world has never had at all', () => {
    expect(inTheGuardRoom().play('TAKE BANANA').said).toEqual([
      'I do not understand that.',
    ]);
  });
});

describe('the bag', () => {
  it('says it is empty before anything is taken', () => {
    expect(aGame().play('BAG').said).toEqual(['You are carrying nothing.']);
  });

  it('lists what the player took, two rooms later', () => {
    const walkedOn = carryingTheKey().play('GO E').next.play('GO S').next;

    expect(walkedOn.play('BAG').said).toEqual(['You are carrying:', 'A rusted key.']);
  });

  it('is listed by ? among the commands', () => {
    expect(aGame().play('?').said).toContain('BAG — list what you carry');
  });
});

describe('dropping a thing', () => {
  it('says the player has dropped it', () => {
    expect(carryingTheKey().play('DROP KEY').said).toEqual(['You drop the rusted key.']);
  });

  it('empties the bag of it', () => {
    expect(carryingTheKey().play('DROP KEY').next.play('BAG').said).toEqual([
      'You are carrying nothing.',
    ]);
  });

  it('refuses a thing the player does not carry', () => {
    expect(aGame().play('DROP KEY').said).toEqual(['There is no such thing here.']);
  });
});

describe('looking at a thing you carry', () => {
  it('describes it wherever the player is standing', () => {
    const walkedOn = carryingTheKey().play('GO E').next;

    expect(walkedOn.play('LOOK KEY').said).toEqual([
      'A key of black iron, its teeth worn round.',
    ]);
  });

  it('describes a thing lying here without picking it up', () => {
    expect(inTheGuardRoom().play('LOOK KEY').next.arrival()).toEqual(
      inTheGuardRoom().arrival(),
    );
  });

  it('refuses a thing that is neither here nor carried', () => {
    expect(aGame().play('LOOK KEY').said).toEqual(['There is no such thing here.']);
  });
});

function aGame(): Game {
  return Game.begin(katacombs());
}

function inTheGuardRoom(): Game {
  return aGame().play('GO N').next;
}

function carryingTheKey(): Game {
  return inTheGuardRoom().play('TAKE KEY').next;
}
