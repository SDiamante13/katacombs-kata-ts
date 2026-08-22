import { fileURLToPath } from 'node:url';

import { currentRequest } from './design-request.mjs';

function listed(files, whenEmpty) {
  if (files.length === 0) return `  ${whenEmpty}`;

  return files.map((file) => `  ${file}`).join('\n');
}

export function brief(request) {
  return [
    `DESIGN REVIEW · session ${request.session ?? 'unidentified'}`,
    request.at
      ? `Asked for at ${request.at}`
      : 'Not asked for by a hook; scope taken from git.',
    '',
    'Source changed this session — every one of these must appear in `files`:',
    listed(request.source, '(none)'),
    '',
    'Prose changed this session — context for questions 10 to 12:',
    listed(request.prose, '(none)'),
    '',
    'The twelve questions: context/design-charter.md',
    'Record the review with: npm run design:review -- <findings.json>',
    '',
  ].join('\n');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.stdout.write(brief(currentRequest()));
}
