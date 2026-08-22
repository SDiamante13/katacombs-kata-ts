#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { reportStamp, viewablePath } from './mutation-run.mjs';

const openers = { darwin: 'open', win32: 'start' };
const opener = openers[process.platform] ?? 'xdg-open';

export function provenance(stamp) {
  if (!stamp) return ['This report carries no record of which run produced it.'];

  const covers = `Produced ${stamp.at} for ${stamp.files.join(', ')}.`;

  if (stamp.current) return [covers];

  return [
    'STALE — the last sensor run mutated nothing, so this answers an older change.',
    covers,
  ];
}

function show() {
  if (!existsSync(viewablePath)) {
    process.stdout.write(
      'No mutation report yet. Run `npm run behavior:sensor` first.\n',
    );
    process.exitCode = 1;

    return;
  }

  process.stdout.write(`${provenance(reportStamp()).join('\n')}\n${viewablePath}\n`);
  spawnSync(opener, [viewablePath], { stdio: 'ignore' });
}

// Importing this module must not open a browser.
if (process.argv[1] === fileURLToPath(import.meta.url)) show();
