import path from 'node:path';

export const ledgerRoot = path.resolve(import.meta.dirname, '..', 'reports', 'ledger');

const SAFE_NAME = /^[A-Za-z0-9_-]+$/;

// A session id arrives in a hook payload and ends up naming a file.
export function ledgerFile(session, suffix) {
  const name = SAFE_NAME.test(session ?? '') ? session : 'unidentified';

  return path.join(ledgerRoot, `${name}${suffix}`);
}
