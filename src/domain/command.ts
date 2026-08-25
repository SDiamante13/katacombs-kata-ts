import type { Direction } from './direction.ts';
import { DIRECTIONS, directionFrom } from './direction.ts';

export type Command =
  | { readonly kind: 'go'; readonly direction: Direction }
  | { readonly kind: 'help' }
  | { readonly kind: 'quit' }
  | { readonly kind: 'unknown' };

interface Entry {
  readonly usage: string;
  readonly summary: string;
  readonly read: (rest: readonly string[]) => Command;
}

const UNKNOWN: Command = { kind: 'unknown' };
const HELP: Command = { kind: 'help' };
const QUIT: Command = { kind: 'quit' };

function readGo(rest: readonly string[]): Command {
  const direction = directionFrom(rest[0]);

  return direction === null ? UNKNOWN : { kind: 'go', direction };
}

const VOCABULARY: Readonly<Record<string, Entry>> = {
  GO: {
    usage: `GO <${DIRECTIONS.join('|')}>`,
    summary: 'walk through an exit',
    read: readGo,
  },
  '?': {
    usage: '?',
    summary: 'list what the game understands',
    read: (): Command => HELP,
  },
  QUIT: {
    usage: 'QUIT',
    summary: 'leave the katacombs',
    read: (): Command => QUIT,
  },
};

export function commands(): readonly string[] {
  return Object.values(VOCABULARY).map((entry) => `${entry.usage} — ${entry.summary}`);
}

function words(input: string): [string, ...string[]] {
  // Splitting always yields at least one word, even from a blank line.
  return input.trim().toUpperCase().split(' ') as [string, ...string[]];
}

export function parse(input: string): Command {
  const [verb, ...rest] = words(input);
  const entry = VOCABULARY[verb];

  return entry === undefined ? UNKNOWN : entry.read(rest);
}
