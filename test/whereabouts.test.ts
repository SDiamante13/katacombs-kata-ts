import { describe, expect, it } from 'vitest';

import { Item } from '../src/domain/item.ts';
import { Location } from '../src/domain/location.ts';
import { Whereabouts } from '../src/domain/whereabouts.ts';

describe('what lies about', () => {
  it('is what the place was built holding, until something moves', () => {
    const room = aRoomHolding(aKey());

    expect(lying(Whereabouts.asFound(), room)).toEqual(['A rusted key lies here.']);
  });

  it('is nothing where the place was built holding nothing', () => {
    const bare = new Location('Cell', 'Four walls and a drain.');

    expect(lying(Whereabouts.asFound(), bare)).toEqual([]);
  });

  it('loses the item the player takes', () => {
    const room = aRoomHolding(aKey());
    const taken = Whereabouts.asFound().take(room, 'KEY').whereabouts;

    expect(lying(taken, room)).toEqual([]);
  });

  it('keeps the item where it was dropped', () => {
    const room = aRoomHolding(aKey());
    const cell = new Location('Cell', 'Four walls and a drain.');
    const carried = Whereabouts.asFound().take(room, 'KEY').whereabouts;

    expect(lying(carried.drop(cell, 'KEY').whereabouts, cell)).toEqual([
      'A rusted key lies here.',
    ]);
  });

  it('leaves the place it was made from as it was', () => {
    const room = aRoomHolding(aKey());
    const asFound = Whereabouts.asFound();

    asFound.take(room, 'KEY');

    expect(lying(asFound, room)).toEqual(['A rusted key lies here.']);
  });
});

describe('taking a thing', () => {
  it('says the player has taken it', () => {
    const room = aRoomHolding(aKey());

    expect(Whereabouts.asFound().take(room, 'KEY').said).toEqual([
      'You take the rusted key.',
    ]);
  });

  it('refuses what is not lying here', () => {
    const bare = new Location('Cell', 'Four walls and a drain.');

    expect(Whereabouts.asFound().take(bare, 'KEY').said).toEqual([
      'There is no such thing here.',
    ]);
  });

  it('carries nothing away when it refuses', () => {
    const bare = new Location('Cell', 'Four walls and a drain.');

    expect(Whereabouts.asFound().take(bare, 'KEY').whereabouts.bagReads()).toEqual([
      'You are carrying nothing.',
    ]);
  });

  it('refuses an eleventh thing', () => {
    const hoard = aRoomHolding(...eleven());

    expect(withTenTaken(hoard).take(hoard, 'KEY').said).toEqual(['Your bag is full.']);
  });

  it('leaves the eleventh thing lying where it was', () => {
    const hoard = aRoomHolding(...eleven());

    expect(lying(withTenTaken(hoard).take(hoard, 'KEY').whereabouts, hoard)).toEqual([
      'A rusted key lies here.',
    ]);
  });

  it('still holds exactly ten after the eleventh is refused', () => {
    const hoard = aRoomHolding(...eleven());

    expect(withTenTaken(hoard).take(hoard, 'KEY').whereabouts.bagReads()).toEqual([
      'You are carrying:',
      ...tenLanterns(),
    ]);
  });
});

describe('dropping a thing', () => {
  it('says the player has dropped it', () => {
    const room = aRoomHolding(aKey());
    const carried = Whereabouts.asFound().take(room, 'KEY').whereabouts;

    expect(carried.drop(room, 'KEY').said).toEqual(['You drop the rusted key.']);
  });

  it('refuses what the player does not carry', () => {
    const bare = new Location('Cell', 'Four walls and a drain.');

    expect(Whereabouts.asFound().drop(bare, 'KEY').said).toEqual([
      'There is no such thing here.',
    ]);
  });

  it('empties the bag of it', () => {
    const room = aRoomHolding(aKey());
    const carried = Whereabouts.asFound().take(room, 'KEY').whereabouts;

    expect(carried.drop(room, 'KEY').whereabouts.bagReads()).toEqual([
      'You are carrying nothing.',
    ]);
  });
});

describe('the bag', () => {
  it('says it is empty before anything is taken', () => {
    expect(Whereabouts.asFound().bagReads()).toEqual(['You are carrying nothing.']);
  });

  it('lists what the player took', () => {
    const room = aRoomHolding(aKey());

    expect(Whereabouts.asFound().take(room, 'KEY').whereabouts.bagReads()).toEqual([
      'You are carrying:',
      'A rusted key.',
    ]);
  });
});

describe('what the player can reach', () => {
  it('is what lies here together with what is carried', () => {
    const room = aRoomHolding(aKey(), aLantern());
    const carried = Whereabouts.asFound().take(room, 'KEY').whereabouts;

    expect(carried.withinReach(room).map((item) => item.held())).toEqual([
      'A rusted key.',
      'A brass lantern.',
    ]);
  });
});

function aKey(): Item {
  return new Item('KEY', 'rusted key', 'A key of black iron.');
}

function aLantern(): Item {
  return new Item('LANTERN', 'brass lantern', 'A lantern of dented brass.');
}

function aRoomHolding(...items: readonly Item[]): Location {
  const room = new Location('Guard Room', 'Rusted pikes lean in a rack.');

  Location.lay(room, ...items);

  return room;
}

function lying(whereabouts: Whereabouts, place: Location): readonly string[] {
  return whereabouts.lyingIn(place).map((item) => item.lying());
}

function eleven(): readonly Item[] {
  return [...Array.from({ length: 10 }, aLantern), aKey()];
}

function tenLanterns(): readonly string[] {
  return Array.from({ length: 10 }, () => 'A brass lantern.');
}

function withTenTaken(hoard: Location): Whereabouts {
  return Array.from({ length: 10 }).reduce<Whereabouts>(
    (bag) => bag.take(hoard, 'LANTERN').whereabouts,
    Whereabouts.asFound(),
  );
}
