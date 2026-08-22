#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { latestReport } from './design-store.mjs';

function show() {
  const kept = latestReport();

  if (kept === null) {
    process.stdout.write(
      'No design review yet. Run `npm run design:scope`, then `npm run design:review`.\n',
    );
    process.exitCode = 1;

    return;
  }

  process.stdout.write(`${kept}\n\n${readFileSync(kept, 'utf8')}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) show();
