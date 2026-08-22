// Findings from a stage that stopped the ladder, before any mutant existed.
const MOST_BLOCKS = 4;
const BLOCK_LINES = 14;
const PLAIN_TAIL = 30;

function summaryLines(lines) {
  return lines.filter((line) => /^\s*(Test Files|Tests)\s/.test(line));
}

function failureBlocks(lines) {
  return lines
    .map((line, index) => (/(^|\s)FAIL(\s|$)/.test(line) ? index : -1))
    .filter((index) => index >= 0)
    .slice(0, MOST_BLOCKS)
    .map((index) => lines.slice(index, index + BLOCK_LINES).join('\n'));
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
