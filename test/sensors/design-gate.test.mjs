import { describe, expect, it } from 'vitest';

import { noteFor } from '../../scripts/design-due.mjs';
import { designGate, MOST_BLOCKS, OUTCOMES } from '../../scripts/design-gate.mjs';

const reviewIsDue = {
  recursing: false,
  reviewed: false,
  scope: ['src/domain/cave.ts'],
  sensorsGreen: true,
  blocks: 0,
};

const HELD_BACK = [
  ['the hook is answering its own block', { recursing: true }, OUTCOMES.recursing],
  ['the review already ran this session', { reviewed: true }, OUTCOMES.reviewed],
  ['nothing but prose changed', { scope: [] }, OUTCOMES.nothingChanged],
  [
    'a cheap sensor still has something to say',
    { sensorsGreen: false },
    OUTCOMES.sensorsRed,
  ],
  ['it has asked twice and been ignored', { blocks: MOST_BLOCKS }, OUTCOMES.askedEnough],
];

describe('when the review is worth buying', () => {
  it('fires on a session that changed design with everything else green', () => {
    expect(designGate(reviewIsDue)).toEqual({ fires: true, why: OUTCOMES.reviewDue });
  });
});

describe('every guard is a reason the review is not worth buying', () => {
  it.each(HELD_BACK)('holds back when %s', (_situation, difference, why) => {
    expect(designGate({ ...reviewIsDue, ...difference })).toEqual({ fires: false, why });
  });

  it('names the first reason it found, not every reason there is', () => {
    const allAtOnce = { ...reviewIsDue, recursing: true, reviewed: true, scope: [] };

    expect(designGate(allAtOnce).why).toBe(OUTCOMES.recursing);
  });

  it('still asks on the run before the cap', () => {
    expect(designGate({ ...reviewIsDue, blocks: MOST_BLOCKS - 1 }).fires).toBe(true);
  });
});

describe('every outcome the gate can reach has a decided voice', () => {
  const aReview = { review: { at: '2026-08-22T09:00:00.000Z', findings: 0 } };

  it.each(Object.values(OUTCOMES))('answers for %s without throwing', (why) => {
    expect(noteFor(why, aReview)).not.toBeUndefined();
  });

  it('speaks for the two outcomes a silent turn would hide', () => {
    expect(noteFor(OUTCOMES.reviewed, aReview)).toContain('no findings');
    expect(noteFor(OUTCOMES.askedEnough, aReview)).toContain('never recorded');
  });
});
