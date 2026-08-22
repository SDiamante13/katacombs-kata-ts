import { existsSync } from 'node:fs';

import { behaviorReport, summarise, unavailableReport } from './behavior-findings.mjs';
import { markReportStale, reportStamp, viewablePath } from './mutation-run.mjs';
import { sensorReport } from './sensor-report.mjs';

const SKIP_REPORT = [
  'SENSOR behavior: SKIP (nothing in scope)',
  '',
  '  No source under src/ and no test file changed, so nothing was checked.',
  '  This is not a pass. The sensor had nothing to look at.',
  '',
].join('\n');

function trailer(findings) {
  const fromMutation = findings.some((finding) => finding.rule.startsWith('mutant'));
  const stamp = reportStamp();

  if (!fromMutation || !existsSync(viewablePath) || !stamp) return '';

  return `\nEvery mutant, killed and surviving, for ${stamp.files.join(', ')}: npm run behavior:report\n`;
}

function accounting(report) {
  return report ? `${summarise(report)}\n` : '';
}

export function skipped(startedAt, note = null) {
  markReportStale(startedAt);

  return {
    outcome: 'skip',
    passed: true,
    findings: [],
    report: note ? `${SKIP_REPORT}  ${note}\n` : SKIP_REPORT,
  };
}

export function passing(report, note = null) {
  const said = report ? accounting(report) : `  ${note}\n`;

  return {
    outcome: 'pass',
    passed: true,
    findings: [],
    report: sensorReport('behavior', []) + said,
  };
}

export function failing(findings, report = null, startedAt = null) {
  if (report === null) markReportStale(startedAt);

  return {
    outcome: 'fail',
    passed: false,
    findings,
    report: behaviorReport(findings) + accounting(report) + trailer(findings),
  };
}

export function unavailable(findings, startedAt = null) {
  markReportStale(startedAt);

  return {
    outcome: 'unavailable',
    passed: false,
    findings,
    report: unavailableReport(findings),
  };
}
