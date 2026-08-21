#!/usr/bin/env node
// PostToolUse sensor for Claude Code. The tool knows which file it just wrote,
// so the adapter reads the path straight off the payload.
import { inspect } from '../../scripts/edit-sensors.mjs';
import { editedPaths, readHookPayload } from '../../scripts/hook-io.mjs';
import { record } from '../../scripts/session-ledger.mjs';
import { agentTierFires } from '../../scripts/sensor-tier.mjs';

if (!agentTierFires()) process.exit(0);

const payload = await readHookPayload();
const verdict = inspect(editedPaths(payload));

if (verdict) {
  record(payload.session_id, verdict.files);

  if (!verdict.passed) {
    process.stderr.write(`${verdict.report}\n`);
    process.exit(2);
  }
}
