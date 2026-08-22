import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

import { ledgerFile, ledgerRoot } from './ledger-path.mjs';

const MOST_PUSHBACKS = 3;

function markerPath(session) {
  return ledgerFile(session, '.behavior.json');
}

function seenIn(session) {
  const marker = markerPath(session);

  if (!existsSync(marker)) return [];

  try {
    return JSON.parse(readFileSync(marker, 'utf8'));
  } catch {
    return [];
  }
}

export function fingerprint(findings) {
  return findings
    .map((finding) => `${finding.rule}@${finding.where}`)
    .sort()
    .join('|');
}

// stop_hook_active is a Claude Code field; this guard holds without it.
export function shouldPushBack(session, findings) {
  const seen = seenIn(session);
  const mark = fingerprint(findings);

  if (seen.includes(mark) || seen.length >= MOST_PUSHBACKS) return false;

  try {
    mkdirSync(ledgerRoot, { recursive: true });
    writeFileSync(markerPath(session), JSON.stringify([...seen, mark]));
  } catch {
    // An unwritable marker must not take the agent's turn down with it.
  }

  return true;
}
