import { lstatSync, readFileSync, realpathSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { charter } from '../../scripts/design-charter.mjs';

const skillSource = path.resolve('.agents/skills/design-sensor/SKILL.md');
const claudeSkill = path.resolve('.claude/skills/design-sensor');
const skill = readFileSync(skillSource, 'utf8');
const argument = readFileSync(path.resolve('context/design-charter.md'), 'utf8');

function numberedQuestions(text) {
  return text.split('\n').filter((line) => /^\d+\. /.test(line));
}

// The reviewer reads the skill; the recorder enforces the code. They must agree.
describe('the charter the reviewer reads and the charter the recorder enforces', () => {
  it.each(charter)('asks question $id in both places', (question) => {
    expect(skill).toContain(`${question.id}. ${question.ask}`);
  });

  it('asks nothing in the skill that the recorder would reject', () => {
    expect(numberedQuestions(skill)).toHaveLength(charter.length);
  });
});

describe('the skill both runtimes read', () => {
  it('is one file, which Claude Code reaches by a link and never by a copy', () => {
    expect(lstatSync(claudeSkill).isSymbolicLink()).toBe(true);
    expect(realpathSync(path.join(claudeSkill, 'SKILL.md'))).toBe(
      realpathSync(skillSource),
    );
  });

  it('carries the questions itself, so the reviewer needs no second file', () => {
    expect(skill).toContain('Primitive obsession');
  });

  it('names both commands the procedure depends on', () => {
    expect(skill).toContain('npm run design:scope');
    expect(skill).toContain('npm run design:review');
  });
});

// A page that restates the skill is this charter's own question 12.
describe('the argument beside the charter', () => {
  it('explains the list without listing it', () => {
    expect(numberedQuestions(argument)).toHaveLength(0);
    expect(argument).not.toContain('Primitive obsession');
  });

  it('points at the skill as the place the questions live', () => {
    expect(argument).toContain('skills/design-sensor/SKILL.md');
  });
});
