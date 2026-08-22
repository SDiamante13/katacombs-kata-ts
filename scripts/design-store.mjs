import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { safeSessionName } from './ledger-path.mjs';

export const reportRoot = path.resolve(import.meta.dirname, '..', 'reports', 'design');

export function reportPath(session) {
  return path.join(reportRoot, `${safeSessionName(session)}.md`);
}

export function keepReport(session, text) {
  mkdirSync(reportRoot, { recursive: true });
  writeFileSync(reportPath(session), text);

  return reportPath(session);
}

function newestFirst(a, b) {
  return statSync(b).mtimeMs - statSync(a).mtimeMs;
}

export function latestReport() {
  if (!existsSync(reportRoot)) return null;

  const kept = readdirSync(reportRoot)
    .filter((name) => name.endsWith('.md'))
    .map((name) => path.join(reportRoot, name))
    .sort(newestFirst);

  return kept[0] ?? null;
}
