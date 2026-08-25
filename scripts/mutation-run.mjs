import {
  existsSync,
  mkdirSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';

import { readJsonOr } from './json-file.mjs';
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

export const MUTATION_BUDGET = 90_000;
const runRoot = path.join(mutationRoot, String(process.pid));

export const viewablePath = path.join(mutationRoot, 'mutation.html');
export const readablePath = path.join(mutationRoot, 'mutation.json');
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

// Written beside, then renamed: a reader never sees half a stamp.
function writeStamp(stamp) {
  const beside = `${stampPath}.${process.pid}`;

  try {
    writeFileSync(beside, JSON.stringify(stamp));
    renameSync(beside, stampPath);
  } catch {
    rmSync(beside, { force: true });
  }
}

// The html is for a person, the json for whatever reads the findings back.
function promote(name, destination) {
  const produced = path.join(runRoot, name);

  if (existsSync(produced)) renameSync(produced, destination);
}

function publishReport(files, at) {
  promote('mutation.html', viewablePath);
  promote('mutation.json', readablePath);
  writeStamp({ at, files, run: process.pid, current: true });
  rmSync(runRoot, { recursive: true, force: true });
}

export function reportStamp() {
  return readJsonOr(stampPath);
}

// Only its own report: a slow run must not mark a newer one stale.
export function markReportStale(startedAt) {
  const stamp = reportStamp();

  if (!stamp || stamp.current === false) return;
  if (startedAt && stamp.at > startedAt) return;

  writeStamp({ ...stamp, current: false });
}

export function runMutation(files, run = node) {
  sweepStaleRuns();
  const { output, timedOut } = run(
    [strykerBin, 'run', writeRunConfig(files)],
    {},
    MUTATION_BUDGET,
  );
  const produced = path.join(runRoot, 'mutation.json');

  if (timedOut) {
    rmSync(runRoot, { recursive: true, force: true });

    return { tooSlow: MUTATION_BUDGET / 1000 };
  }

  if (!existsSync(produced)) {
    rmSync(runRoot, { recursive: true, force: true });

    return { crashed: output };
  }

  const report = readJsonOr(produced);

  if (report === null) {
    rmSync(runRoot, { recursive: true, force: true });

    return { crashed: `${output}\n\nThe mutation report was unreadable.` };
  }

  publishReport(files, new Date().toISOString());

  return { report };
}
