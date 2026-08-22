const OUTPUT_LIMIT = 6_000;

function failureMessage(report) {
  return [
    'The behavioral sensor is not satisfied. Repair the findings, then run',
    '`npm run behavior:sensor` to check before you stop again.',
    '',
    report.trim().slice(-OUTPUT_LIMIT),
  ].join('\n');
}

export function stopResponse(verdict, pushBack) {
  if (!verdict || verdict.passed) return { continue: true };

  const message = failureMessage(verdict.report);

  if (!pushBack) {
    return {
      continue: true,
      systemMessage: `The behavioral sensor still has findings.\n\n${message}`,
    };
  }

  return { decision: 'block', reason: message };
}
