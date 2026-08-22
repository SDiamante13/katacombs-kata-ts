import { spawnSync } from 'node:child_process';
import path from 'node:path';

const projectRoot = path.resolve(import.meta.dirname, '..');

const RENAMED = /[RC]/;

// -z, because git quotes and escapes any path with a space in the human format.
function records() {
  const seen = spawnSync(
    'git',
    ['status', '--porcelain', '--untracked-files=all', '-z'],
    { cwd: projectRoot, encoding: 'utf8' },
  );

  return (seen.stdout ?? '').split('\0').filter(Boolean);
}

export function dirtyPaths() {
  const entries = records();
  const paths = [];

  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];

    paths.push(entry.slice(3));
    // A rename spends a second record on the path it came from.
    if (RENAMED.test(entry.slice(0, 2))) index += 1;
  }

  return paths;
}
