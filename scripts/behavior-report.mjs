#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

import { reportStamp, viewablePath } from './mutation-run.mjs';

const openers = { darwin: 'open', win32: 'start' };
const opener = openers[process.platform] ?? 'xdg-open';

function provenance() {
  const stamp = reportStamp();

  if (!stamp) return 'It carries no record of which run produced it.';

  const covers = `Produced ${stamp.at} for ${stamp.files.join(', ')}.`;

  if (stamp.current) return covers;

  return `${covers}\nThe last sensor run stopped before mutating, so this answers an older change.`;
}

if (!existsSync(viewablePath)) {
  process.stdout.write('No mutation report yet. Run `npm run behavior:sensor` first.\n');
  process.exitCode = 1;
} else {
  process.stdout.write(`${viewablePath}\n${provenance()}\n`);
  spawnSync(opener, [viewablePath], { stdio: 'ignore' });
}
