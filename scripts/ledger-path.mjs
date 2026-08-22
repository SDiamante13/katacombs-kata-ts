import { createHash } from 'node:crypto';
import path from 'node:path';

export const ledgerRoot = path.resolve(import.meta.dirname, '..', 'reports', 'ledger');

const SAFE_NAME = /^[A-Za-z0-9_-]{1,128}$/;

// Collapsing every rejected id to one name would make unrelated sessions share state.
function safely(session) {
  if (SAFE_NAME.test(session)) return session;

  return `session-${createHash('sha256').update(session).digest('hex').slice(0, 32)}`;
}

// A session id arrives in a hook payload and ends up naming a file.
export function ledgerFile(session, suffix) {
  const named = typeof session === 'string' && session.length > 0;

  return path.join(ledgerRoot, `${named ? safely(session) : 'unidentified'}${suffix}`);
}
