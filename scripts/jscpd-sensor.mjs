import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import path from 'node:path';

import { guides } from './sensor-guides.mjs';
import { coach, sensorReport } from './sensor-report.mjs';

const projectRoot = path.resolve(import.meta.dirname, '..');
const jscpdBin = path.join(projectRoot, 'node_modules', 'jscpd', 'run-jscpd.js');
const reportPath = path.join(projectRoot, 'reports', 'jscpd', 'jscpd-report.json');

function detectClones(targets) {
  rmSync(reportPath, { force: true });
  spawnSync(process.execPath, [jscpdBin, ...targets], {
    cwd: projectRoot,
    stdio: 'ignore',
  });

  if (!existsSync(reportPath)) return [];

  return JSON.parse(readFileSync(reportPath, 'utf8')).duplicates ?? [];
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
