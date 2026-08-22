import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { charter } from '../../scripts/design-charter.mjs';

const prose = readFileSync(path.resolve('context/design-charter.md'), 'utf8');
const claudeSkill = path.resolve('.claude/skills/design-sensor/SKILL.md');
const codexSkill = path.resolve('.codex/skills/design-sensor/SKILL.md');

function numberedQuestions() {
  return prose.split('\n').filter((line) => /^\d+\. /.test(line));
}

// The wording lives twice: prose for a reader, code for the validator.
describe('the charter a human reads and the charter the validator enforces', () => {
  it.each(charter)('asks question $id in both places', (question) => {
    expect(prose).toContain(`${question.id}. ${question.ask}`);
  });

  it('has no question in the prose that the validator would reject', () => {
    expect(numberedQuestions()).toHaveLength(charter.length);
  });
});

describe('the skill both runtimes read', () => {
  it('is the same file in .claude and in .codex', () => {
    expect(readFileSync(codexSkill, 'utf8')).toBe(readFileSync(claudeSkill, 'utf8'));
  });

  it('sends the reviewer to the charter rather than restating it', () => {
    const skill = readFileSync(claudeSkill, 'utf8');

    expect(skill).toContain('context/design-charter.md');
    expect(skill).not.toContain('Primitive obsession');
  });
});
