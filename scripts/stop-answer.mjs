import { designDue } from './design-due.mjs';
import { shouldPushBack } from './stop-continuation.mjs';
import { stopResponse } from './stop-response.mjs';

function joined(parts) {
  return parts.filter(Boolean).join('\n\n');
}

function withDesign(answer, payload, changed, verdict) {
  const design = designDue(payload, changed, verdict.passed, new Date().toISOString());

  if (design.fires) {
    return { decision: 'block', reason: joined([design.reason, verdict.report.trim()]) };
  }

  const said = joined([answer.systemMessage, design.note]);

  return said ? { ...answer, systemMessage: said } : answer;
}

export function stopAnswer(payload, changed, verdict) {
  const pushBack =
    !verdict.passed &&
    !payload.stop_hook_active &&
    shouldPushBack(payload.session_id, verdict.findings);
  const answer = stopResponse(verdict, pushBack);

  if (answer.decision) return answer;

  return withDesign(answer, payload, changed, verdict);
}
