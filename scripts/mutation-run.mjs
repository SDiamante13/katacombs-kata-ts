import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';

import { node } from './node-runner.mjs';

const projectRoot = path.resolve(import.meta.dirname, '..');
const strykerBin = path.join(
  projectRoot,
  'node_modules',
  '@stryker-mutator',
  'core',
  'bin',
  'stryker.js',
);

const mutationRoot = path.join(projectRoot, 'reports', 'mutation');
const strykerRoot = path.join(projectRoot, '.stryker-tmp');
const runRoot = path.join(mutationRoot, String(process.pid));

export const viewablePath = path.join(mutationRoot, 'mutation.html');
const stampPath = path.join(mutationRoot, 'mutation.stamp.json');

// A fixed report path is how two concurrent runs read each other's answer.
function runConfig(files) {
  const overrides = {
    mutate: files,
    tempDirName: path.join('.stryker-tmp', String(process.pid)),
    jsonReporter: { fileName: `reports/mutation/${process.pid}/mutation.json` },
    htmlReporter: { fileName: `reports/mutation/${process.pid}/mutation.html` },
  };

  return `import base from '../../../stryker.config.mjs';\n\nexport default { ...base, ...${JSON.stringify(overrides)} };\n`;
}

function writeRunConfig(files) {
  const file = path.join(runRoot, 'stryker.run.mjs');

  mkdirSync(runRoot, { recursive: true });
  writeFileSync(file, runConfig(files));

  return file;
}

function alive(pid) {
  try {
    process.kill(pid, 0);

    return true;
  } catch (error) {
    return error.code === 'EPERM';
  }
}

function reapDeadPids(root) {
  if (!existsSync(root)) return;

  readdirSync(root)
    .filter((entry) => /^\d+$/.test(entry) && !alive(Number(entry)))
    .forEach((entry) => rmSync(path.join(root, entry), { recursive: true, force: true }));
}

// A killed run leaves both its directories behind; nothing else would remove them.
function sweepStaleRuns() {
  reapDeadPids(mutationRoot);
  reapDeadPids(strykerRoot);
}

function publishReport(files, at) {
  const produced = path.join(runRoot, 'mutation.html');

  if (existsSync(produced)) renameSync(produced, viewablePath);
  writeFileSync(stampPath, JSON.stringify({ at, files, current: true }));
  rmSync(runRoot, { recursive: true, force: true });
}

// A run that stops before mutation leaves a report about a different change.
export function markReportStale() {
  if (!existsSync(stampPath)) return;

  const stamp = JSON.parse(readFileSync(stampPath, 'utf8'));

  writeFileSync(stampPath, JSON.stringify({ ...stamp, current: false }));
}

export function reportStamp() {
  return existsSync(stampPath) ? JSON.parse(readFileSync(stampPath, 'utf8')) : null;
}

export function runMutation(files, run = node) {
  sweepStaleRuns();
  const { output } = run([strykerBin, 'run', writeRunConfig(files)]);
  const produced = path.join(runRoot, 'mutation.json');

  if (!existsSync(produced)) {
    rmSync(runRoot, { recursive: true, force: true });

    return { crashed: output };
  }

  const report = JSON.parse(readFileSync(produced, 'utf8'));
  publishReport(files, new Date().toISOString());

  return { report };
}
