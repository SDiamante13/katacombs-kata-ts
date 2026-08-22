import { guides, kernels } from './sensor-guides.mjs';
import { coach, indent, sensorReport } from './sensor-report.mjs';

const MOST = 8;
const TAIL = 24;

function guideFor(rule) {
  return { name: rule, text: guides[rule], kernel: kernels[rule] };
}

function lastLines(output, lines = TAIL) {
  return output.trim().split('\n').slice(-lines).join('\n');
}

export function brokenBehavior(output) {
  return {
    rule: 'broken-behavior',
    where: 'vitest',
    detail: `The tests related to this change failed.\n${lastLines(output)}`,
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

export function behaviorFindings(report) {
  const files = Object.entries(report.files ?? {});
  const survived = files.flatMap(([file, data]) =>
    withStatus(data, 'Survived').map((mutant) => survivor(file, mutant)),
  );
  const missed = files.flatMap(([file, data]) =>
    [...tallyLines(withStatus(data, 'NoCoverage'))].map((entry) =>
      uncovered(file, entry),
    ),
  );

  return [...survived, ...missed];
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

export function behaviorReport(findings) {
  const coached = new Set();
  const shown = findings.slice(0, MOST).map((finding) => format(finding, coached));

  return sensorReport('behavior', [...shown, ...overflow(findings)], findings.length);
}
