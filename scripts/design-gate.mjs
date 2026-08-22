// The gate, not the sensor. Each clause is a reason the review is not worth buying.
export const MOST_BLOCKS = 2;

export const OUTCOMES = Object.freeze({
  recursing: 'recursing',
  reviewed: 'reviewed',
  nothingChanged: 'nothing-changed',
  sensorsRed: 'sensors-red',
  askedEnough: 'asked-enough',
  reviewDue: 'review-due',
});

const SKIPS = [
  [OUTCOMES.recursing, (facts) => facts.recursing],
  [OUTCOMES.reviewed, (facts) => facts.reviewed],
  [OUTCOMES.nothingChanged, (facts) => facts.scope.length === 0],
  [OUTCOMES.sensorsRed, (facts) => !facts.sensorsGreen],
  [OUTCOMES.askedEnough, (facts) => facts.blocks >= MOST_BLOCKS],
];

export const GUARDS = SKIPS.length;

export function designGate(facts) {
  const skipped = SKIPS.find(([, holds]) => holds(facts));

  if (skipped) return { fires: false, why: skipped[0] };

  return { fires: true, why: OUTCOMES.reviewDue };
}
