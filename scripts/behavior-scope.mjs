import { existsSync, realpathSync } from 'node:fs';
import path from 'node:path';

// realpath: a worktree reached through a symlink is still this project.
const projectRoot = realpathSync(path.resolve(import.meta.dirname, '..'));

const MUTATED_ROOT = 'src';
const SOURCE = /\.(ts|mjs|js)$/;
const TEST = /\.test\.(ts|mjs|js)$/;

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

export function normalise(files) {
  return [...new Set(files.map(relativeTo).filter(Boolean))].filter((file) =>
    SOURCE.test(file),
  );
}

export function isMutated(file) {
  return file.startsWith(`${MUTATED_ROOT}/`) && !TEST.test(file);
}

export function present(files) {
  return files.filter((file) => existsSync(path.join(projectRoot, file)));
}

export function scopeOf(files) {
  const named = normalise(files);
  const here = new Set(present(named));

  return {
    tests: named.filter((file) => here.has(file) && (TEST.test(file) || isMutated(file))),
    mutated: named.filter((file) => here.has(file) && isMutated(file)),
    gone: named.filter((file) => !here.has(file)),
  };
}
