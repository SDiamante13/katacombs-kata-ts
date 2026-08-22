#!/usr/bin/env node
// PostToolUse for Codex: it matches shell commands only, so watch the worktree.
import { inspect } from '../../scripts/edit-sensors.mjs';
import { readHookPayload } from '../../scripts/hook-io.mjs';
import { stamp } from '../../scripts/sensor-liveness.mjs';
import { record } from '../../scripts/session-ledger.mjs';
import { agentTierFires } from '../../scripts/sensor-tier.mjs';
import { changedSinceLastLook } from '../../scripts/worktree-watch.mjs';

if (!agentTierFires()) process.exit(0);

const payload = await readHookPayload();

stamp('codex');
const verdict = inspect(changedSinceLastLook(payload.session_id));

if (verdict) {
  record(payload.session_id, verdict.files);

  if (!verdict.passed) {
    process.stdout.write(JSON.stringify({ decision: 'block', reason: verdict.report }));
  }
}
