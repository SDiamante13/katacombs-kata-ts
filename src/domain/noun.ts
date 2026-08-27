import { oneOf } from './vocabulary.ts';

export const NOUNS = ['GATE'] as const;

export type Noun = (typeof NOUNS)[number];

export const nounFrom = oneOf(NOUNS);
