#!/usr/bin/env node
// Stop, for both runtimes: the cheap sensors, then the tests, then the mutants.
import { readHookPayload } from './hook-io.mjs';
import { agentTierFires } from './sensor-tier.mjs';
import { changedThisSession } from './session-ledger.mjs';
import { shouldPushBack } from './stop-continuation.mjs';
import { stopResponse } from './stop-response.mjs';
import { verdictFor } from './stop-verdict.mjs';

const DISABLED =
  'behavior sensor: agent tier disabled by SENSORS=git; the commit gate is the gate.\n';

if (!agentTierFires()) {
  process.stderr.write(DISABLED);
  process.exit(0);
}

const payload = await readHookPayload();
const changed = changedThisSession(payload.session_id);
const verdict = verdictFor(changed);

const pushBack =
  !verdict.passed &&
  !payload.stop_hook_active &&
  shouldPushBack(payload.session_id, verdict.findings);

const answer = stopResponse(verdict, pushBack);

// systemMessage is not guaranteed to render; stderr is the runtime-agnostic copy.
if (!answer.decision) process.stderr.write(`${verdict.report}\n`);

process.stdout.write(JSON.stringify(answer));
