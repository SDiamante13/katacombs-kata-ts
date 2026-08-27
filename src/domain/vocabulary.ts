export type Reader<Word extends string> = (typed: string | undefined) => Word | null;

export function oneOf<Word extends string>(words: readonly Word[]): Reader<Word> {
  return (typed) => words.find((word) => word === typed) ?? null;
}
