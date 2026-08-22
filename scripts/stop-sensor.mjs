#!/usr/bin/env node
// Stop, for both runtimes: the cheap sensors, then the tests, then the mutants.
import { examine } from './behavior-sensor.mjs';
import { failing } from './behavior-verdict.mjs';
import { inspect } from './edit-sensors.mjs';
import { readHookPayload } from './hook-io.mjs';
import { agentTierFires } from './sensor-tier.mjs';
import { changedThisSession } from './session-ledger.mjs';
import { cheapTierFirst } from './stage-findings.mjs';
import { shouldPushBack } from './stop-continuation.mjs';
import { stopResponse } from './stop-response.mjs';

if (!agentTierFires()) process.exit(0);

const payload = await readHookPayload();
const changed = changedThisSession(payload.session_id);

// Expensive sensors are gated on the cheap ones being green. This is that gate.
const cheap = inspect(changed);
const verdict =
  cheap && !cheap.passed ? failing([cheapTierFirst(cheap.report)]) : examine(changed);

const pushBack =
  !verdict.passed &&
  !payload.stop_hook_active &&
  shouldPushBack(payload.session_id, verdict.findings);

const answer = stopResponse(verdict, pushBack);

// systemMessage is not guaranteed to render; stderr is the runtime-agnostic copy.
if (!verdict.passed && !answer.decision) process.stderr.write(`${verdict.report}\n`);

process.stdout.write(JSON.stringify(answer));
