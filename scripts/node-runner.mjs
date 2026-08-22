import { spawnSync } from 'node:child_process';
import path from 'node:path';

const projectRoot = path.resolve(import.meta.dirname, '..');

export function node(args, environment = {}) {
  const result = spawnSync(process.execPath, args, {
    cwd: projectRoot,
    encoding: 'utf8',
    env: { ...process.env, ...environment },
  });

  return {
    output: [result.stdout, result.stderr].filter(Boolean).join('').trim(),
    status: result.status,
  };
}
