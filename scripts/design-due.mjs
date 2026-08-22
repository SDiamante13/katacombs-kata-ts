import { designGate, MOST_BLOCKS, OUTCOMES } from './design-gate.mjs';
import { designLedger, noteBlock } from './design-ledger.mjs';
import { requestReview } from './design-request.mjs';
import { reviewScope } from './design-scope.mjs';

const ASKED_ENOUGH = [
  `The design review was asked for ${MOST_BLOCKS} times and never recorded, so this turn ends without it.`,
  'Nothing here can make a judgment happen; the gate can only ask, and it has stopped asking.',
].join(' ');

function reviewed(entry) {
  const { findings, at } = entry.review;
  const said = findings === 0 ? 'no findings' : `${findings} findings`;

  return `design: reviewed at ${at} — ${said}. npm run design:report`;
}

// Every outcome is listed, so a new one cannot go out silently by accident.
const NOTES = {
  [OUTCOMES.recursing]: () => null,
  [OUTCOMES.reviewed]: reviewed,
  [OUTCOMES.nothingChanged]: () => null,
  [OUTCOMES.sensorsRed]: () => null,
  [OUTCOMES.askedEnough]: () => ASKED_ENOUGH,
  [OUTCOMES.reviewDue]: () => null,
};

export function noteFor(why, entry) {
  return NOTES[why]?.(entry) ?? null;
}

function blockReason(scope) {
  return [
    'SENSOR design: DUE (no review recorded this session)',
    '',
    'This session changed design, and the one sensor that can see design has not looked.',
    'Review the files below against the twelve questions in `context/design-charter.md`,',
    'then record what you found — a review that is not recorded did not happen:',
    '',
    '  npm run design:scope',
    '  npm run design:review -- <findings.json>',
    '',
    'Claude Code: the `design-sensor` skill. Codex: `.codex/prompts/design-sensor.md`.',
    '',
    ...scope.source.map((file) => `  ${file}`),
    '',
  ].join('\n');
}

export function designDue(payload, changed, sensorsGreen, at) {
  const scope = reviewScope(changed);
  const entry = designLedger(payload.session_id);
  const gate = designGate({
    recursing: Boolean(payload.stop_hook_active),
    reviewed: entry.review !== null,
    scope: scope.source,
    sensorsGreen,
    blocks: entry.blocks,
  });

  if (!gate.fires) return { fires: false, why: gate.why, note: noteFor(gate.why, entry) };

  requestReview(payload.session_id, scope, at);
  noteBlock(payload.session_id);

  return { fires: true, why: gate.why, reason: blockReason(scope) };
}
