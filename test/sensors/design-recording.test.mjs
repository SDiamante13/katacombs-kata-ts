import { existsSync, rmSync } from 'node:fs';

import { afterEach, describe, expect, it } from 'vitest';

import { designLedger } from '../../scripts/design-ledger.mjs';
import { requestPath, requestReview } from '../../scripts/design-request.mjs';
import { reportPath } from '../../scripts/design-store.mjs';
import { ledgerFile } from '../../scripts/ledger-path.mjs';
import { projectScratch, runSensor } from './sensor-harness.mjs';

const session = 'design-recording-probe';
const reviewed = 'scripts/design-gate.mjs';
const scratch = projectScratch('design-recording');

const A_REAL_FINDING = {
  question: 2,
  where: 'scripts/design-gate.mjs:4',
  what: 'The skip table and the gate decision live in one module.',
  why: 'A new guard means editing the thing that also decides the outcome.',
  instead: 'Keep the table where the guards are named and let the gate read it.',
};

function askForReview() {
  requestReview(session, { source: [reviewed], prose: [] }, '2026-08-22T09:00:00.000Z');
}

function record(review) {
  const file = scratch.file('findings.json', JSON.stringify(review));

  return runSensor('scripts/design-review.mjs', file);
}

function forget() {
  scratch.remove();
  rmSync(requestPath, { force: true });
  rmSync(ledgerFile(session, '.design.json'), { force: true });
  rmSync(reportPath(session), { force: true });
}

describe('recording a review the hook asked for', () => {
  afterEach(forget);

  it('keeps the report and leaves the receipt the gate reads', () => {
    askForReview();
    const { output, status } = record({ files: [reviewed], findings: [] });

    expect(status).toBe(0);
    expect(output).toContain('SENSOR design: PASS (0 findings)');
    expect(existsSync(reportPath(session))).toBe(true);
    expect(designLedger(session).review).toMatchObject({ findings: 0 });
  });

  it('exits non-zero when the review found something, and still records it', () => {
    askForReview();
    const { output, status } = record({ files: [reviewed], findings: [A_REAL_FINDING] });

    expect(status).toBe(1);
    expect(output).toContain('design-q2');
    expect(designLedger(session).review).toMatchObject({ findings: 1 });
  });

  it('records nothing when the review skipped a file the session changed', () => {
    askForReview();
    const { output, status } = record({ files: [], findings: [] });

    expect(status).toBe(1);
    expect(output).toContain('REFUSED');
    expect(designLedger(session).review).toBe(null);
  });

  it('records nothing when the findings file is not JSON', () => {
    askForReview();
    const file = scratch.file('broken.json', '{ not json');
    const { output, status } = runSensor('scripts/design-review.mjs', file);

    expect(status).toBe(1);
    expect(output).toContain('not readable JSON');
    expect(designLedger(session).review).toBe(null);
  });
});
