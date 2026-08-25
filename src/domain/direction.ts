export const DIRECTIONS = ['N', 'E', 'S', 'W', 'UP', 'DOWN'] as const;

export type Direction = (typeof DIRECTIONS)[number];

const OPPOSITES: Readonly<Record<Direction, Direction>> = {
  N: 'S',
  E: 'W',
  S: 'N',
  W: 'E',
  UP: 'DOWN',
  DOWN: 'UP',
};

function isDirection(word: string | undefined): word is Direction {
  return DIRECTIONS.some((known) => known === word);
}

export function directionFrom(word: string | undefined): Direction | null {
  return isDirection(word) ? word : null;
}

export function opposite(direction: Direction): Direction {
  return OPPOSITES[direction];
}
