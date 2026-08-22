import { existsSync, realpathSync } from 'node:fs';
import path from 'node:path';

import { deletedPaths } from './git-changes.mjs';

// realpath: a worktree reached through a symlink is still this project.
const projectRoot = realpathSync(path.resolve(import.meta.dirname, '..'));

const MUTATED_ROOT = 'src';
const SOURCE = /\.(ts|mjs|js)$/;
const TEST = /\.test\.(ts|mjs|js)$/;
// A source extension with something after it, such as a mutation-range suffix.
const MALFORMED = /\.(ts|mjs|js)[^A-Za-z0-9/][^/]*$/;

// Both sides of the comparison must be realpaths or a symlinked ancestor drops the file.
function realOf(file) {
  const resolved = path.resolve(projectRoot, file);

  try {
    return realpathSync(resolved);
  } catch {
    return resolved;
  }
}

function relativeTo(file) {
  const inside = path.relative(projectRoot, realOf(file));

  if (inside === '' || inside.startsWith('..')) return null;

  return inside.split(path.sep).join('/');
}

function inside(files) {
  return [...new Set(files.map(relativeTo).filter(Boolean))];
}

export function normalise(files) {
  return inside(files).filter((file) => SOURCE.test(file));
}

// A path the caller meant as source and the sensor cannot read is not a pass.
export function malformed(files) {
  return inside(files).filter((file) => !SOURCE.test(file) && MALFORMED.test(file));
}

export function isMutated(file) {
  return file.startsWith(`${MUTATED_ROOT}/`) && !TEST.test(file);
}

export function present(files) {
  return files.filter((file) => existsSync(path.join(projectRoot, file)));
}

export function scopeOf(files, deleted = deletedPaths()) {
  const named = normalise(files);
  const here = new Set(present(named));
  const removed = new Set(normalise(deleted));
  const absent = named.filter((file) => !here.has(file));

  return {
    tests: named.filter((file) => here.has(file) && (TEST.test(file) || isMutated(file))),
    mutated: named.filter((file) => here.has(file) && isMutated(file)),
    gone: absent.filter((file) => removed.has(file)),
    unknown: absent.filter((file) => !removed.has(file)),
    malformed: malformed(files),
  };
}
