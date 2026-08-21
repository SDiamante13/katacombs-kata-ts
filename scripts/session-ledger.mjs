import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const ledgerRoot = path.resolve(import.meta.dirname, '..', 'reports', 'ledger');

export function ledgerPath(session) {
  return path.join(ledgerRoot, `${session}.txt`);
}

export function record(session, files) {
  if (!session || files.length === 0) return;

  mkdirSync(ledgerRoot, { recursive: true });
  appendFileSync(ledgerPath(session), files.map((file) => `${file}\n`).join(''));
}

export function changedThisSession(session) {
  const ledger = ledgerPath(session);

  if (!session || !existsSync(ledger)) return [];

  return [...new Set(readFileSync(ledger, 'utf8').split('\n').filter(Boolean))];
}
