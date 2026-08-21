import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import path from 'node:path';

import { guides } from './sensor-guides.mjs';
import { coach, sensorReport } from './sensor-report.mjs';

const projectRoot = path.resolve(import.meta.dirname, '..');
const jscpdBin = path.join(projectRoot, 'node_modules', 'jscpd', 'run-jscpd.js');
const reportRoot = path.join(projectRoot, 'reports', 'jscpd', String(process.pid));
const reportPath = path.join(reportRoot, 'jscpd-report.json');

function detectClones(targets) {
  rmSync(reportRoot, { recursive: true, force: true });
  spawnSync(process.execPath, [jscpdBin, ...targets, '--output', reportRoot], {
    cwd: projectRoot,
    stdio: 'ignore',
  });

  if (!existsSync(reportPath)) return [];

  const found = JSON.parse(readFileSync(reportPath, 'utf8')).duplicates ?? [];
  rmSync(reportRoot, { recursive: true, force: true });

  return found;
}

function locate(file) {
  return `${path.relative(projectRoot, file.name)}:${file.start}`;
}

const duplicationGuide = {
  name: 'duplicated-code',
  text: guides['duplicated-code'],
  kernel: 'find what varies, parameterise it',
};

function formatDuplicate(duplicate, _index, coached) {
  return [
    `${locate(duplicate.firstFile)} ERROR duplicated-code`,
    `  ${duplicate.lines ?? 0} lines duplicated at ${locate(duplicate.secondFile)}`,
    coach(duplicationGuide, coached),
  ].join('\n');
}

const coached = new Set();
const findings = detectClones(process.argv.slice(2)).map((duplicate, index) =>
  formatDuplicate(duplicate, index, coached),
);

process.stdout.write(sensorReport('jscpd', findings));
process.exitCode = findings.length === 0 ? 0 : 1;
