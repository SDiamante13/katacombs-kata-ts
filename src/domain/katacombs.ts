import { Location } from './location.ts';

export function katacombs(): Location {
  const entranceHall = theEntranceHall();
  const guardRoom = theGuardRoom();
  const armoury = theArmoury();
  const cistern = theCistern();
  const crypt = theCrypt();
  const watchtower = theWatchtower();

  Location.connect(entranceHall, 'N', guardRoom);
  Location.connect(guardRoom, 'E', armoury);
  Location.connect(armoury, 'S', cistern);
  Location.connect(cistern, 'W', entranceHall);
  Location.connect(entranceHall, 'DOWN', crypt);
  Location.connect(guardRoom, 'UP', watchtower);

  return entranceHall;
}

function theEntranceHall(): Location {
  return new Location('Entrance Hall', 'Daylight dies on wet flagstones.', {
    N: 'A low arch, and torch smoke curling out of it.',
    E: 'A passage slopes away towards the sound of water.',
    S: 'The stair you came down, choked with rubble to the roof.',
    DOWN: 'Steps drop under the flagstones into cold air.',
  });
}

function theGuardRoom(): Location {
  return new Location('Guard Room', 'Rusted pikes lean in a rack.', {
    S: 'Grey daylight, back the way you came.',
    E: 'A doorway with its door off the hinges.',
    UP: 'A ladder climbs to an open trapdoor.',
  });
}

function theArmoury(): Location {
  return new Location('Armoury', 'Empty racks, stripped to the pegs.', {
    W: 'The guard room, and the pikes leaning in it.',
    S: 'A drain runs off that way, and the air turns wet.',
  });
}

function theCistern(): Location {
  return new Location('Cistern', 'Black water laps at a stone ledge.', {
    N: 'The drain climbs back towards the empty racks.',
    W: 'Flagstones, and the last of the daylight on them.',
  });
}

function theCrypt(): Location {
  return new Location('Crypt', 'Shelves of the dead, names worn off.', {
    UP: 'Steps climb back towards the daylight.',
  });
}

function theWatchtower(): Location {
  return new Location('Watchtower', 'Arrow slits look out on fog.', {
    DOWN: 'The ladder drops back through the trapdoor.',
  });
}
