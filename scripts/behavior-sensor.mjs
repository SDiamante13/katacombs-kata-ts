import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { behaviorFindings, untestedSource } from './behavior-findings.mjs';
import { scopeOf } from './behavior-scope.mjs';
import { failing, passing, skipped, unavailable } from './behavior-verdict.mjs';
import { dirtyPaths } from './git-changes.mjs';
import { runMutation } from './mutation-run.mjs';
import { node } from './node-runner.mjs';
import { changedThisSession } from './session-ledger.mjs';
import {
  brokenBehavior,
  brokenTypes,
  mutationUnavailable,
  tooManyFiles,
  tookTooLong,
  unreadableScope,
} from './stage-findings.mjs';

const projectRoot = path.resolve(import.meta.dirname, '..');
const vitestBin = path.join(projectRoot, 'node_modules', 'vitest', 'vitest.mjs');
const tscBin = path.join(projectRoot, 'node_modules', 'typescript', 'bin', 'tsc');

export { viewablePath } from './mutation-run.mjs';

const PLAIN = { NO_COLOR: '1', FORCE_COLOR: '0' };
const MOST_FILES = 25;
const TEST_BUDGET = 120_000;

function typeErrors() {
  const { output, status } = node([tscBin, '--noEmit'], PLAIN);

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
  const { output, status, timedOut } = node(
    [...testArguments(scope), '--passWithNoTests'],
    PLAIN,
    TEST_BUDGET,
  );
  const stalled = timedOut
    ? `${output}\n\nThe test run did not finish within ${TEST_BUDGET / 1000}s and was killed.`
    : null;

  return {
    failed: status === 0 && !timedOut ? null : (stalled ?? output),
    ranNothing: output.includes('No test files found'),
  };
}

function nothingMutated(scope) {
  const ran =
    scope.gone.length > 0
      ? 'the whole product suite ran green, because this change deleted a source file'
      : `${scope.tests.length} test file${scope.tests.length === 1 ? '' : 's'} related to this change ran green`;

  return `${ran}; no source under src/ changed, so no mutants were made.`;
}

function unknownNote(scope) {
  if (scope.unknown.length === 0) return null;

  return `Named but not on disk, and git has no record of deleting them: ${scope.unknown.join(', ')}.`;
}

function refusals(scope, startedAt) {
  if (scope.malformed.length > 0) {
    return failing([unreadableScope(scope.malformed)], null, startedAt);
  }
  if (scope.tests.length === 0 && scope.gone.length === 0) {
    return skipped(startedAt, unknownNote(scope));
  }
  if (scope.mutated.length > MOST_FILES) {
    return failing([tooManyFiles(scope.mutated)], null, startedAt);
  }

  return null;
}

function beforeMutation(scope, startedAt) {
  const types = typeErrors();

  if (types !== null) return failing([brokenTypes(types)], null, startedAt);

  const tests = runTests(scope);

  if (tests.failed !== null)
    return failing([brokenBehavior(tests.failed)], null, startedAt);
  // Stryker cannot mutate what no test imports; it errors instead of reporting.
  if (tests.ranNothing && scope.mutated.length > 0) {
    return failing(scope.mutated.map(untestedSource), null, startedAt);
  }

  return null;
}

function afterMutation(outcome, startedAt) {
  if (outcome.tooSlow) return failing([tookTooLong(outcome.tooSlow)], null, startedAt);
  if (outcome.crashed) {
    return unavailable([mutationUnavailable(outcome.crashed)], startedAt);
  }

  const findings = behaviorFindings(outcome.report);

  return findings.length === 0
    ? passing(outcome.report)
    : failing(findings, outcome.report);
}

export function examine(changed) {
  const startedAt = new Date().toISOString();
  const scope = scopeOf(changed);
  const refused = refusals(scope, startedAt);

  if (refused !== null) return refused;

  const stopped = beforeMutation(scope, startedAt);

  if (stopped !== null) return stopped;
  if (scope.mutated.length === 0) return passing(null, nothingMutated(scope));

  return afterMutation(runMutation(scope.mutated), startedAt);
}

// The ledger is append-only, so it outlives the change — context/mutation-scope.md.
export function requestedScope(argv, session) {
  if (argv.length > 0) return argv;

  const recorded = changedThisSession(session);

  if (recorded.length === 0) return dirtyPaths();

  const dirty = new Set(dirtyPaths());

  return recorded.filter((file) => dirty.has(file));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const answer = examine(
    requestedScope(process.argv.slice(2), process.env.SENSOR_SESSION),
  );

  process.stdout.write(answer.report);
  process.exitCode = answer.passed ? 0 : 1;
}
