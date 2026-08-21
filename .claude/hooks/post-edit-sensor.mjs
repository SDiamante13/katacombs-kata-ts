#!/usr/bin/env node
// PostToolUse sensor for Claude Code. The edit tools name the file they wrote,
// but a shell command can write one too, so the worktree is watched either way.
import { inspect } from '../../scripts/edit-sensors.mjs';
import { editedPaths, readHookPayload } from '../../scripts/hook-io.mjs';
import { record } from '../../scripts/session-ledger.mjs';
import { agentTierFires } from '../../scripts/sensor-tier.mjs';
import { changedSinceLastLook } from '../../scripts/worktree-watch.mjs';

if (!agentTierFires()) process.exit(0);

const payload = await readHookPayload();
const verdict = inspect([
  ...editedPaths(payload),
  ...changedSinceLastLook(payload.session_id),
]);

if (verdict) {
  record(payload.session_id, verdict.files);

  if (!verdict.passed) {
    process.stderr.write(`${verdict.report}\n`);
    process.exit(2);
  }
}
