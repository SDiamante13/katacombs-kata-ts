#!/usr/bin/env node
// Stop, for both runtimes: the tests this turn touched, then the mutants they miss.
import { examine } from './behavior-sensor.mjs';
import { readHookPayload } from './hook-io.mjs';
import { agentTierFires } from './sensor-tier.mjs';
import { stopResponse } from './stop-response.mjs';
import { changedThisSession } from './session-ledger.mjs';
import { shouldPushBack } from './stop-continuation.mjs';

if (!agentTierFires()) process.exit(0);

const payload = await readHookPayload();
const verdict = examine(changedThisSession(payload.session_id));
const pushBack =
  Boolean(verdict) &&
  !verdict.passed &&
  !payload.stop_hook_active &&
  shouldPushBack(payload.session_id, verdict.findings);

process.stdout.write(JSON.stringify(stopResponse(verdict, pushBack)));
