import { spawnSync } from 'node:child_process';
import path from 'node:path';

const projectRoot = path.resolve(import.meta.dirname, '..');

// --untracked-files=all: a file the change created is a changed file.
export function dirtyPaths() {
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
