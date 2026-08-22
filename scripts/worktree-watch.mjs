import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const projectRoot = path.resolve(import.meta.dirname, '..');
const watchRoot = path.join(projectRoot, 'reports', 'ledger');

function dirtyPaths() {
  const seen = spawnSync('git', ['status', '--porcelain', '--untracked-files=all'], {
    cwd: projectRoot,
    encoding: 'utf8',
  });

  return (seen.stdout ?? '')
    .split('\n')
    .filter(Boolean)
    .map((line) => line.slice(3).trim())
    .map((entry) => entry.split(' -> ').at(-1));
}

function stampOf(file) {
  const full = path.join(projectRoot, file);

  return existsSync(full) ? statSync(full).mtimeMs : 0;
}

export function snapshot() {
  return Object.fromEntries(dirtyPaths().map((file) => [file, stampOf(file)]));
}

export function movedFiles(before, after) {
  return Object.keys(after).filter((file) => before[file] !== after[file]);
}

function snapshotPath(session) {
  return path.join(watchRoot, `${session || 'unidentified'}.worktree.json`);
}

function remember(session, taken) {
  mkdirSync(watchRoot, { recursive: true });
  writeFileSync(snapshotPath(session), JSON.stringify(taken));
}

export function baseline(session) {
  remember(session, snapshot());
}

export function changedSinceLastLook(session) {
  const stored = snapshotPath(session);
  const before = existsSync(stored) ? JSON.parse(readFileSync(stored, 'utf8')) : null;
  const after = snapshot();

  remember(session, after);

  return before === null ? [] : movedFiles(before, after);
}
