// Findings from a stage that stopped the ladder, before any mutant existed.
const MOST_BLOCKS = 4;
const BLOCK_LINES = 14;
const PLAIN_TAIL = 30;

function summaryLines(lines) {
  return lines.filter((line) => /^\s*(Test Files|Tests)\s/.test(line));
}

function failureAt(lines) {
  return lines
    .map((line, index) => (/(^|\s)FAIL(\s|$)/.test(line) ? index : -1))
    .filter((index) => index >= 0);
}

function failureBlocks(lines) {
  const found = failureAt(lines);
  const shown = found
    .slice(0, MOST_BLOCKS)
    .map((index) => lines.slice(index, index + BLOCK_LINES).join('\n'));

  if (found.length <= MOST_BLOCKS) return shown;

  return [
    ...shown,
    `… and ${found.length - MOST_BLOCKS} more failing tests; run npm test.`,
  ];
}

// A flat tail drops the first failure when several tests break at once.
function readable(output) {
  const lines = output.trim().split('\n');
  const blocks = failureBlocks(lines);

  if (blocks.length === 0) return lines.slice(-PLAIN_TAIL);

  return [...summaryLines(lines), '', ...blocks];
}

export function brokenBehavior(output) {
  return {
    rule: 'broken-behavior',
    where: 'vitest',
    detail: ['The tests related to this change failed.', ...readable(output)].join('\n'),
  };
}

export function scopeTooLarge(detail) {
  return { rule: 'scope-too-large', where: 'behavior', detail };
}

export function tooManyFiles(files) {
  return scopeTooLarge(
    `${files.length} source files changed this turn, which is more than an end-of-turn check can mutate honestly.`,
  );
}

export function tookTooLong(seconds) {
  return scopeTooLarge(
    `The mutation run did not finish within ${seconds}s and was killed. Cost scales with the mutants your tests cover, so this change has more of them than a pause can hold.`,
  );
}

export function unreadableScope(files) {
  return {
    rule: 'unreadable-scope',
    where: 'behavior',
    detail: `These paths look like source and cannot be read as source: ${files.join(', ')}.`,
  };
}

export function cheapTierFirst(report) {
  return {
    rule: 'cheap-tier-first',
    where: 'edit sensors',
    detail: [
      'The millisecond sensors still have findings on what this turn changed.',
      report.trim(),
    ].join('\n\n'),
  };
}

export function brokenTypes(output) {
  return {
    rule: 'broken-types',
    where: 'tsc',
    detail: [
      'The compiler rejects this change, so the tests below it prove nothing.',
      ...output.trim().split('\n').slice(0, PLAIN_TAIL),
    ].join('\n'),
  };
}

export function mutationUnavailable(output) {
  return {
    rule: 'mutation-unavailable',
    where: 'stryker',
    detail: [
      'The mutation run produced no report, so nothing was checked for weak assertions.',
      ...output.trim().split('\n').slice(-PLAIN_TAIL),
    ].join('\n'),
  };
}
