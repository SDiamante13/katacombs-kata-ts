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
const runRoot = path.join(mutationRoot, String(process.pid));

export const viewablePath = path.join(mutationRoot, 'mutation.html');

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

// A killed run leaves its directory behind, and nothing else would remove it.
function sweepStaleRuns() {
  if (!existsSync(mutationRoot)) return;

  readdirSync(mutationRoot)
    .filter((entry) => /^\d+$/.test(entry) && !alive(Number(entry)))
    .forEach((entry) =>
      rmSync(path.join(mutationRoot, entry), { recursive: true, force: true }),
    );
}

function publishReport() {
  const produced = path.join(runRoot, 'mutation.html');

  if (existsSync(produced)) renameSync(produced, viewablePath);
  rmSync(runRoot, { recursive: true, force: true });
}

export function runMutation(files) {
  sweepStaleRuns();
  const { output } = node([strykerBin, 'run', writeRunConfig(files)]);
  const produced = path.join(runRoot, 'mutation.json');

  if (!existsSync(produced)) {
    rmSync(runRoot, { recursive: true, force: true });

    return { crashed: output };
  }

  const report = JSON.parse(readFileSync(produced, 'utf8'));
  publishReport();

  return { report };
}
