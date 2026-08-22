import { guides, kernels } from './sensor-guides.mjs';
import { coach, indent, sensorReport } from './sensor-report.mjs';

const MOST = 8;
const MOST_BLOCKS = 4;
const BLOCK_LINES = 14;
const PLAIN_TAIL = 30;

const DETECTED = new Set(['Killed', 'Timeout']);
const NOT_EVALUATED = new Set(['CompileError', 'RuntimeError', 'Ignored', 'Pending']);

function guideFor(rule) {
  return { name: rule, text: guides[rule], kernel: kernels[rule] };
}

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

function startOf(mutant) {
  return mutant.location.start;
}

function survivor(file, mutant) {
  return {
    rule: 'mutant-survived',
    where: `${file}:${startOf(mutant).line}:${startOf(mutant).column}`,
    detail: `${mutant.mutatorName} replaced this with \`${mutant.replacement}\` and the tests still passed.`,
  };
}

function tallyLines(mutants) {
  return mutants.reduce(
    (tally, mutant) =>
      tally.set(startOf(mutant).line, (tally.get(startOf(mutant).line) ?? 0) + 1),
    new Map(),
  );
}

function uncovered(file, [line, count]) {
  return {
    rule: 'mutant-uncovered',
    where: `${file}:${line}`,
    detail: `No test reaches this line: ${count} mutant${count === 1 ? '' : 's'} here, none of them tried.`,
  };
}

function withStatus(data, status) {
  return (data.mutants ?? []).filter((mutant) => mutant.status === status);
}

function filesIn(report) {
  return Object.entries(report.files ?? {});
}

export function behaviorFindings(report) {
  const survived = filesIn(report).flatMap(([file, data]) =>
    withStatus(data, 'Survived').map((mutant) => survivor(file, mutant)),
  );
  const missed = filesIn(report).flatMap(([file, data]) =>
    [...tallyLines(withStatus(data, 'NoCoverage'))].map((entry) =>
      uncovered(file, entry),
    ),
  );

  return [...survived, ...missed];
}

function count(mutants, statuses) {
  return mutants.filter((mutant) => statuses.has(mutant.status)).length;
}

// A PASS that says nothing is indistinguishable from a run that checked nothing.
export function summarise(report) {
  const files = filesIn(report);
  const mutants = files.flatMap(([, data]) => data.mutants ?? []);
  const parts = [
    `${files.length} file${files.length === 1 ? '' : 's'}`,
    `${mutants.length} mutants`,
    `${count(mutants, DETECTED)} killed`,
    `${count(mutants, new Set(['Survived']))} survived`,
    `${count(mutants, new Set(['NoCoverage']))} untried`,
  ];
  const unevaluated = count(mutants, NOT_EVALUATED);

  if (unevaluated > 0) parts.push(`${unevaluated} not evaluated`);

  return `  ${parts.join(' · ')}`;
}

function format(finding, coached) {
  return [
    `${finding.where} ERROR ${finding.rule}`,
    indent(finding.detail),
    coach(guideFor(finding.rule), coached),
  ].join('\n');
}

function overflow(findings) {
  if (findings.length <= MOST) return [];

  return [`  … and ${findings.length - MOST} more, all of them in the report.`];
}

export function unavailableReport(findings) {
  const coached = new Set();

  return `SENSOR behavior: UNAVAILABLE\n\n${findings.map((finding) => format(finding, coached)).join('\n')}\n`;
}

export function behaviorReport(findings) {
  const coached = new Set();
  const shown = findings.slice(0, MOST).map((finding) => format(finding, coached));

  return sensorReport('behavior', [...shown, ...overflow(findings)], findings.length);
}
