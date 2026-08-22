#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { currentRequest } from './design-request.mjs';
import { designReport, validate } from './design-findings.mjs';
import { recordReview } from './design-ledger.mjs';
import { keepReport } from './design-store.mjs';

function refuse(problems) {
  process.stdout.write(
    [
      'SENSOR design: REFUSED (the review was not recorded)',
      '',
      ...problems.map((problem) => `  ${problem}`),
      '',
      '  Nothing was recorded, so the gate will ask again. Fix these and re-run.',
      '',
    ].join('\n'),
  );
  process.exitCode = 1;
}

function readReview(file) {
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch (error) {
    return { unreadable: String(error?.message ?? error) };
  }
}

function record(file) {
  const request = currentRequest();
  const given = readReview(file);

  if (given.unreadable)
    return refuse([`${file} is not readable JSON: ${given.unreadable}`]);

  const problems = validate(given, request.source);

  if (problems.length > 0) return refuse(problems);

  const review = { ...given, prose: request.prose, at: new Date().toISOString() };
  const report = designReport(review);

  recordReview(request.session, { at: review.at, findings: review.findings.length });
  process.stdout.write(`${report}\n  Kept at ${keepReport(request.session, report)}\n`);
  process.exitCode = review.findings.length === 0 ? 0 : 1;
}

const NEEDS_A_FILE =
  'Usage: npm run design:review -- <findings.json>. Run `npm run design:scope` first.\n';

export function review([target]) {
  if (target) return record(target);

  process.stdout.write(NEEDS_A_FILE);
  process.exitCode = 1;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) review(process.argv.slice(2));
