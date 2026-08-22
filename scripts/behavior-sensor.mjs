import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  behaviorFindings,
  brokenBehavior,
  brokenTypes,
  mutationUnavailable,
} from './behavior-findings.mjs';
import { scopeOf } from './behavior-scope.mjs';
import { failing, passing, skipped, unavailable } from './behavior-verdict.mjs';
import { dirtyPaths } from './git-changes.mjs';
import { runMutation } from './mutation-run.mjs';
import { node } from './node-runner.mjs';
import { changedThisSession } from './session-ledger.mjs';

const projectRoot = path.resolve(import.meta.dirname, '..');
const vitestBin = path.join(projectRoot, 'node_modules', 'vitest', 'vitest.mjs');
const tscBin = path.join(projectRoot, 'node_modules', 'typescript', 'bin', 'tsc');

export { viewablePath } from './mutation-run.mjs';

function typeErrors() {
  const { output, status } = node([tscBin, '--noEmit']);

  return status === 0 ? null : output;
}

function testArguments(scope) {
  // A deleted source file cannot be named to `related`, so widen to the suite.
  if (scope.gone.length > 0) {
    return [vitestBin, '--run', '--config', 'vitest.mutation.config.ts'];
  }

  return [vitestBin, 'related', ...scope.tests, '--run'];
}

function runTests(scope) {
  const { output, status } = node([...testArguments(scope), '--passWithNoTests'], {
    NO_COLOR: '1',
    FORCE_COLOR: '0',
  });

  return status === 0 ? null : output;
}

function nothingMutated(scope) {
  const ran = `${scope.tests.length} test file${scope.tests.length === 1 ? '' : 's'} related to this change ran green`;

  return `${ran}; no source under src/ changed, so no mutants were made.`;
}

function beforeMutation(scope) {
  const types = typeErrors();

  if (types !== null) return failing([brokenTypes(types)]);

  const red = runTests(scope);

  return red === null ? null : failing([brokenBehavior(red)]);
}

function afterMutation(outcome) {
  if (outcome.crashed) return unavailable([mutationUnavailable(outcome.crashed)]);

  const findings = behaviorFindings(outcome.report);

  return findings.length === 0
    ? passing(outcome.report)
    : failing(findings, outcome.report);
}

export function examine(changed) {
  const scope = scopeOf(changed);

  if (scope.tests.length === 0 && scope.gone.length === 0) return skipped();

  const stopped = beforeMutation(scope);

  if (stopped !== null) return stopped;
  if (scope.mutated.length === 0) return passing(null, nothingMutated(scope));

  return afterMutation(runMutation(scope.mutated));
}

export function requestedScope(argv, session) {
  if (argv.length > 0) return argv;

  const recorded = changedThisSession(session);

  return recorded.length > 0 ? recorded : dirtyPaths();
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const answer = examine(
    requestedScope(process.argv.slice(2), process.env.SENSOR_SESSION),
  );

  process.stdout.write(answer.report);
  process.exitCode = answer.passed ? 0 : 1;
}
