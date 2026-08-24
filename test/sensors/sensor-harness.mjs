import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

// Not a dot-directory: TypeScript skips those, so a .ts fixture would go unparsed.
const scratchRoot = path.resolve('test/scratch');

export function scratchSpace(prefix) {
  const root = mkdtempSync(path.join(tmpdir(), prefix));

  return {
    directory: (name) => mkdtempSync(path.join(root, name)),
    remove: () => rmSync(root, { recursive: true, force: true }),
  };
}

export function projectScratch(owner) {
  const root = path.join(scratchRoot, owner);

  return {
    file(name, contents) {
      mkdirSync(root, { recursive: true });
      const full = path.join(root, name);
      writeFileSync(full, contents);

      return path.relative(path.resolve(), full);
    },
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

function sensorPromise(script, target) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [script, target], { cwd: path.resolve() });
    let output = '';

    child.stdout.on('data', (chunk) => (output += chunk));
    child.on('close', (status) => resolve({ output, status }));
  });
}

export function runSensorsAtOnce(runs) {
  return Promise.all(runs.map(([script, target]) => sensorPromise(script, target)));
}

export function fireHook(hook, payload, environment = {}) {
  const result = spawnSync(process.execPath, [hook], {
    input: JSON.stringify(payload),
    encoding: 'utf8',
    env: { ...process.env, ...environment },
  });

  return { out: result.stdout, err: result.stderr, status: result.status };
}
