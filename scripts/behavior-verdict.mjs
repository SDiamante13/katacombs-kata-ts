import { existsSync } from 'node:fs';

import { behaviorReport, summarise, unavailableReport } from './behavior-findings.mjs';
import { viewablePath } from './mutation-run.mjs';
import { sensorReport } from './sensor-report.mjs';

const SKIP_REPORT = [
  'SENSOR behavior: SKIP (nothing in scope)',
  '',
  '  No source under src/ and no test file changed, so nothing was checked.',
  '  This is not a pass. The sensor had nothing to look at.',
  '',
].join('\n');

function trailer(findings) {
  const fromMutation = findings.some((finding) => finding.rule.startsWith('mutant-'));

  if (!fromMutation || !existsSync(viewablePath)) return '';

  return '\nEvery mutant, killed and surviving: npm run behavior:report\n';
}

function accounting(report) {
  return report ? `${summarise(report)}\n` : '';
}

export function skipped() {
  return { outcome: 'skip', passed: true, findings: [], report: SKIP_REPORT };
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

export function failing(findings, report = null) {
  return {
    outcome: 'fail',
    passed: false,
    findings,
    report: behaviorReport(findings) + accounting(report) + trailer(findings),
  };
}

export function unavailable(findings) {
  return {
    outcome: 'unavailable',
    passed: false,
    findings,
    report: unavailableReport(findings),
  };
}
