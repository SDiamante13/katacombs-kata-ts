#!/usr/bin/env node
// PostToolUse sensor for Codex. Codex only matches shell commands, so the
// adapter cannot be told which file changed — it watches the worktree instead.
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
