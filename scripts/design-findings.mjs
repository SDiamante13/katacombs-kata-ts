import { existsSync } from 'node:fs';
import path from 'node:path';

import { charter, questionById } from './design-charter.mjs';
import { pluralize, sensorReport } from './sensor-report.mjs';

export const MOST_FINDINGS = 5;
const SHORTEST = 15;
const PROSE_FIELDS = ['what', 'why', 'instead'];

function said(finding, field) {
  return typeof finding[field] === 'string' && finding[field].trim().length >= SHORTEST;
}

function fileOf(where) {
  return String(where ?? '').split(':')[0];
}

function faultsIn(finding, index) {
  const at = `finding ${index + 1}`;
  const missing = PROSE_FIELDS.filter((field) => !said(finding, field));

  return [
    questionById(finding.question) ? null : `${at} cites no charter question`,
    existsSync(path.resolve(fileOf(finding.where)))
      ? null
      : `${at} names ${finding.where}, which is not a path in this project`,
    missing.length === 0
      ? null
      : `${at} leaves ${missing.join(', ')} empty or too short to act on`,
  ].filter(Boolean);
}

function skipped(reviewed, scope) {
  const seen = new Set(reviewed);

  return scope.filter((file) => !seen.has(file));
}

function shapeFault(findings) {
  if (findings) return null;

  return 'the review has no findings array; an empty one is how you say "nothing"';
}

function coverageFault(reviewed, scope) {
  const missed = skipped(reviewed, scope);

  if (missed.length === 0) return null;

  return `the review does not cover ${missed.join(', ')}`;
}

function capFault(findings) {
  if (!findings || findings.length <= MOST_FINDINGS) return null;

  return `${findings.length} findings; the cap is ${MOST_FINDINGS}, so rank them and keep the ${MOST_FINDINGS} that matter`;
}

function shapeOf(review) {
  const given = review ?? {};

  return {
    files: Array.isArray(given.files) ? given.files : [],
    findings: Array.isArray(given.findings) ? given.findings : null,
  };
}

export function validate(review, scope) {
  const { files, findings } = shapeOf(review);

  return [
    shapeFault(findings),
    coverageFault(files, scope),
    capFault(findings),
    ...(findings ?? []).flatMap(faultsIn),
  ].filter(Boolean);
}

function format(finding) {
  const question = questionById(finding.question);

  return [
    `${finding.where} ERROR design-q${question.id}`,
    `  ${finding.what.trim()}`,
    `  Why it matters: ${finding.why.trim()}`,
    `  Instead: ${finding.instead.trim()}`,
    `  → ${question.group.toLowerCase()}, question ${question.id} (${question.kernel})`,
    `    ${question.ask}`,
  ].join('\n');
}

export function accounting(review) {
  const documents = review.prose?.length ?? 0;

  const counted = [
    pluralize(charter.length, 'question'),
    pluralize(review.files.length, 'file'),
    pluralize(documents, 'document'),
  ];

  return `  ${counted.join(' · ')} · reviewed ${review.at}\n`;
}

export function designReport(review) {
  const findings = review.findings.map(format);

  return sensorReport('design', findings) + accounting(review);
}
