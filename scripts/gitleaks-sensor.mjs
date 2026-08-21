import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import path from 'node:path';

import { guides, kernels } from './sensor-guides.mjs';
import { coach, sensorReport } from './sensor-report.mjs';

const projectRoot = path.resolve(import.meta.dirname, '..');
const reportPath = path.join(projectRoot, 'reports', 'gitleaks', 'report.json');

const secretGuide = {
  name: 'leaked-secret',
  text: guides['leaked-secret'],
  kernel: kernels['leaked-secret'],
};

const UNAVAILABLE = [
  'SENSOR gitleaks: UNAVAILABLE',
  '',
  '  gitleaks did not run, so nothing here has been scanned for secrets.',
  '  A scanner that cannot run must never report green.',
  '  Install it if missing: brew install gitleaks',
  '',
].join('\n');

function scan(targets) {
  rmSync(reportPath, { force: true });
  mkdirSync(path.dirname(reportPath), { recursive: true });

  return spawnSync(
    'gitleaks',
    [
      'dir',
      ...targets,
      '--report-format',
      'json',
      '--report-path',
      reportPath,
      '--no-banner',
      '--ignore-gitleaks-allow',
      '--redact=100',
    ],
    { cwd: projectRoot, stdio: 'ignore' },
  );
}

function locate(file) {
  const relative = path.relative(projectRoot, file);

  return relative.startsWith('..') ? file : relative;
}

function formatFinding(finding, coached) {
  const where = `${locate(finding.File)}:${finding.StartLine}`;

  return [
    `${where} ERROR ${finding.RuleID}`,
    `  ${finding.Description}`,
    '  The value is redacted here on purpose — open the file to see it.',
    coach(secretGuide, coached),
  ].join('\n');
}

function completed(result) {
  const scanned = result.status === 0 || result.status === 1;

  return !result.error && scanned;
}

function run(targets) {
  const result = scan(targets);
  if (!completed(result) || !existsSync(reportPath)) return null;

  return JSON.parse(readFileSync(reportPath, 'utf8'));
}

const found = run(process.argv.slice(2).length ? process.argv.slice(2) : ['.']);

if (found === null) {
  process.stdout.write(UNAVAILABLE);
  process.exitCode = 1;
} else {
  const coached = new Set();
  const findings = found.map((finding) => formatFinding(finding, coached));

  process.stdout.write(sensorReport('gitleaks', findings));
  process.exitCode = findings.length === 0 ? 0 : 1;
}
