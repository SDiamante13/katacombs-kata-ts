import { Location } from './location.ts';

export function katacombs(): Location {
  const entranceHall = new Location('Entrance Hall', 'Daylight dies on wet flagstones.');
  const guardRoom = new Location('Guard Room', 'Rusted pikes lean in a rack.');
  const armoury = new Location('Armoury', 'Empty racks, stripped to the pegs.');
  const cistern = new Location('Cistern', 'Black water laps at a stone ledge.');
  const crypt = new Location('Crypt', 'Shelves of the dead, names worn off.');
  const watchtower = new Location('Watchtower', 'Arrow slits look out on fog.');

  Location.connect(entranceHall, 'N', guardRoom);
  Location.connect(guardRoom, 'E', armoury);
  Location.connect(armoury, 'S', cistern);
  Location.connect(cistern, 'W', entranceHall);
  Location.connect(entranceHall, 'DOWN', crypt);
  Location.connect(guardRoom, 'UP', watchtower);

  return entranceHall;
}
