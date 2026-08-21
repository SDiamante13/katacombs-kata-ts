import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

export function scratchSpace(prefix) {
  const root = mkdtempSync(path.join(tmpdir(), prefix));

  return {
    directory: (name) => mkdtempSync(path.join(root, name)),
    remove: () => rmSync(root, { recursive: true, force: true }),
  };
}

export function runSensor(script, target) {
  const result = spawnSync(process.execPath, [script, target], {
    cwd: path.resolve(),
    encoding: 'utf8',
  });

  return { output: result.stdout, status: result.status };
}
