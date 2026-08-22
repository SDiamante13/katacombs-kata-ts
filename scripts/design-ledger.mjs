import { readJsonOr, writeJsonOrGiveUp } from './json-file.mjs';
import { ledgerFile, ledgerRoot } from './ledger-path.mjs';

const NOTHING_YET = { blocks: 0, review: null };

function entryPath(session) {
  return ledgerFile(session, '.design.json');
}

function save(session, entry) {
  writeJsonOrGiveUp(entryPath(session), entry, ledgerRoot);
}

export function designLedger(session) {
  return { ...NOTHING_YET, ...readJsonOr(entryPath(session), NOTHING_YET) };
}

export function noteBlock(session) {
  const entry = designLedger(session);

  save(session, { ...entry, blocks: entry.blocks + 1 });
}

export function recordReview(session, review) {
  save(session, { ...designLedger(session), review });
}
