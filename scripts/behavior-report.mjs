#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

import { viewablePath } from './behavior-sensor.mjs';

const openers = { darwin: 'open', win32: 'start' };
const opener = openers[process.platform] ?? 'xdg-open';

if (!existsSync(viewablePath)) {
  process.stdout.write('No mutation report yet. Run `npm run behavior:sensor` first.\n');
  process.exitCode = 1;
} else {
  process.stdout.write(`${viewablePath}\n`);
  spawnSync(opener, [viewablePath], { stdio: 'ignore' });
}
