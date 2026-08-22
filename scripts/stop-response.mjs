const OUTPUT_LIMIT = 6_000;

// The header, the rule and the file:line are at the top. Keep those.
function head(report) {
  const text = report.trim();

  if (text.length <= OUTPUT_LIMIT) return text;

  return `${text.slice(0, OUTPUT_LIMIT)}\n\n… truncated. Run \`npm run behavior:sensor\` for the rest.`;
}

function failureMessage(report) {
  return [
    'The behavioral sensor is not satisfied. Repair the findings, then run',
    '`npm run behavior:sensor` to check before you stop again.',
    '',
    head(report),
  ].join('\n');
}

export function stopResponse(verdict, pushBack) {
  if (!verdict) return { continue: true };
  // A pass that says nothing is indistinguishable from a run that checked nothing.
  if (verdict.passed) return { continue: true, systemMessage: verdict.report.trim() };

  const message = failureMessage(verdict.report);

  if (!pushBack) {
    return {
      continue: true,
      systemMessage: `The behavioral sensor still has findings.\n\n${message}`,
    };
  }

  return { decision: 'block', reason: message };
}
