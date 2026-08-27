import type { Direction } from './direction.ts';
import { DIRECTIONS, directionFrom } from './direction.ts';
import type { Noun } from './noun.ts';
import { nounFrom } from './noun.ts';

type Handling = 'inspect' | 'open' | 'take' | 'drop';

export type Command =
  | { readonly kind: 'go'; readonly direction: Direction }
  | { readonly kind: 'look'; readonly direction: Direction | null }
  | { readonly kind: Handling; readonly noun: Noun }
  | { readonly kind: 'bag' }
  | { readonly kind: 'help' }
  | { readonly kind: 'quit' }
  | { readonly kind: 'unknown' };

interface Entry {
  readonly usage: string;
  readonly summary: string;
  readonly read: (rest: readonly string[]) => Command;
}

const UNKNOWN: Command = { kind: 'unknown' };
const LOOK_AROUND: Command = { kind: 'look', direction: null };
const BAG: Command = { kind: 'bag' };
const HELP: Command = { kind: 'help' };
const QUIT: Command = { kind: 'quit' };

function readGo(rest: readonly string[]): Command {
  const direction = directionFrom(rest[0]);

  return direction === null ? UNKNOWN : { kind: 'go', direction };
}

function readLook(rest: readonly string[]): Command {
  const target = rest[0];

  if (target === undefined) return LOOK_AROUND;

  const direction = directionFrom(target);

  if (direction !== null) return { kind: 'look', direction };

  return readThing('inspect', target);
}

function readThing(kind: Handling, target: string | undefined): Command {
  const noun = nounFrom(target);

  return noun === null ? UNKNOWN : { kind, noun };
}

function reads(kind: Handling): (rest: readonly string[]) => Command {
  return (rest) => readThing(kind, rest[0]);
}

const VOCABULARY: Readonly<Record<string, Entry>> = {
  GO: {
    usage: `GO <${DIRECTIONS.join('|')}>`,
    summary: 'walk through an exit',
    read: readGo,
  },
  LOOK: {
    usage: `LOOK [<${DIRECTIONS.join('|')}>|<thing>]`,
    summary: 'look about you, in one direction, or at a thing',
    read: readLook,
  },
  OPEN: {
    usage: 'OPEN <thing>',
    summary: 'open a thing that stands in your way',
    read: reads('open'),
  },
  TAKE: {
    usage: 'TAKE <thing>',
    summary: 'pick up a thing lying here and put it in your bag',
    read: reads('take'),
  },
  DROP: {
    usage: 'DROP <thing>',
    summary: 'leave a thing you carry lying where you stand',
    read: reads('drop'),
  },
  BAG: {
    usage: 'BAG',
    summary: 'list what you carry',
    read: (): Command => BAG,
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
