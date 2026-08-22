import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  behaviorFindings,
  behaviorReport,
  brokenBehavior,
} from './behavior-findings.mjs';
import { mutationScope, present, testScope } from './behavior-scope.mjs';
import { node } from './node-runner.mjs';
import { changedThisSession } from './session-ledger.mjs';

const projectRoot = path.resolve(import.meta.dirname, '..');
const vitestBin = path.join(projectRoot, 'node_modules', 'vitest', 'vitest.mjs');
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

function runTests(files) {
  const { output, status } = node(
    [vitestBin, 'related', ...files, '--run', '--passWithNoTests'],
    { NO_COLOR: '1', FORCE_COLOR: '0' },
  );

  return status === 0 ? null : output;
}

// A fixed report path is how two concurrent sensors read each other's answer.
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

function publishReport() {
  const produced = path.join(runRoot, 'mutation.html');

  if (existsSync(produced)) renameSync(produced, viewablePath);
  rmSync(runRoot, { recursive: true, force: true });
}

function runMutation(files) {
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

function sensorCrashed(output) {
  return {
    rule: 'sensor-contract',
    where: 'stryker',
    detail: `The mutation sensor could not run, so it has nothing to say about these tests.\n\n${output.slice(-2000)}`,
  };
}

function trailer(findings) {
  const fromMutation = findings.some((finding) => finding.rule.startsWith('mutant-'));

  if (!fromMutation || !existsSync(viewablePath)) return '';

  return '\nEvery mutant, killed and surviving: npm run behavior:report\n';
}

function verdict(findings) {
  return {
    passed: findings.length === 0,
    findings,
    report: behaviorReport(findings) + trailer(findings),
  };
}

export function examine(changed) {
  const live = present(changed);
  const tests = testScope(live);

  if (tests.length === 0) return null;

  const red = runTests(tests);

  if (red !== null) return verdict([brokenBehavior(red)]);

  const mutated = mutationScope(live);

  if (mutated.length === 0) return verdict([]);

  const outcome = runMutation(mutated);

  if (outcome.crashed) return verdict([sensorCrashed(outcome.crashed)]);

  return verdict(behaviorFindings(outcome.report));
}

function worktreeChanges() {
  const seen = spawnSync('git', ['diff', '--name-only', 'HEAD'], {
    cwd: projectRoot,
    encoding: 'utf8',
  });

  return (seen.stdout ?? '').split('\n').filter(Boolean);
}

export function requestedScope(argv, session) {
  if (argv.length > 0) return argv;

  const recorded = changedThisSession(session);

  return recorded.length > 0 ? recorded : worktreeChanges();
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const answer = examine(
    requestedScope(process.argv.slice(2), process.env.SENSOR_SESSION),
  );

  process.stdout.write(answer ? answer.report : 'SENSOR behavior: PASS (0 findings)\n');
  process.exitCode = !answer || answer.passed ? 0 : 1;
}
