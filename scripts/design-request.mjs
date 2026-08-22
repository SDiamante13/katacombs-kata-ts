import path from 'node:path';

import { reviewScope } from './design-scope.mjs';
import { dirtyPaths } from './git-changes.mjs';
import { readJsonOr, writeJsonOrGiveUp } from './json-file.mjs';
import { ledgerRoot } from './ledger-path.mjs';

// The review runs in a plain shell, which is never told the session id.
export const requestPath = path.join(ledgerRoot, '.design-request.json');

export function requestReview(session, scope, at) {
  writeJsonOrGiveUp(requestPath, { session, at, ...scope }, ledgerRoot);
}

export function pendingRequest() {
  return readJsonOr(requestPath);
}

// A review nobody asked for still gets a scope, or `design:scope` would only work under a hook.
export function currentRequest(session = process.env.SENSOR_SESSION ?? null) {
  return pendingRequest() ?? { session, at: null, ...reviewScope(dirtyPaths()) };
}
