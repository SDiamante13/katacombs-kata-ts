import { guides, kernels } from './sensor-guides.mjs';
import { coach, indent, sensorReport } from './sensor-report.mjs';

const MOST = 8;

const DETECTED = new Set(['Killed', 'Timeout']);
const NOT_EVALUATED = new Set(['CompileError', 'RuntimeError', 'Pending']);

function guideFor(rule) {
  return { name: rule, text: guides[rule], kernel: kernels[rule] };
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

export function untestedSource(file) {
  return {
    rule: 'untested-source',
    where: file,
    detail: 'No test file imports this source, so no mutant in it was ever tried.',
  };
}

function suppressed(file, [line, count]) {
  return {
    rule: 'mutation-suppressed',
    where: `${file}:${line}`,
    detail: `A comment here told the mutation runner to skip ${count} mutant${count === 1 ? '' : 's'}.`,
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

  const silenced = filesIn(report).flatMap(([file, data]) =>
    [...tallyLines(withStatus(data, 'Ignored'))].map((entry) => suppressed(file, entry)),
  );

  return [...silenced, ...survived, ...missed];
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
