import { oneOf } from './vocabulary.ts';

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

export const directionFrom = oneOf(DIRECTIONS);

export function opposite(direction: Direction): Direction {
  return OPPOSITES[direction];
}
