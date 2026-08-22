import { describe, expect, it } from 'vitest';

import { designReport, MOST_FINDINGS, validate } from '../../scripts/design-findings.mjs';

const scope = ['scripts/design-findings.mjs'];

function aFinding(differences = {}) {
  return {
    question: 6,
    where: 'scripts/design-findings.mjs:12',
    what: 'Room ids are raw strings, parsed at four call sites.',
    why: 'Every caller repeats the validation and none of them agree.',
    instead: 'Introduce a RoomId value object that validates once.',
    ...differences,
  };
}

function aReview(differences = {}) {
  return { files: scope, findings: [aFinding()], ...differences };
}

function refusalFor(differences) {
  return validate(aReview(differences), scope).join(' | ');
}

describe('a review the recorder accepts', () => {
  it('takes a complete finding', () => {
    expect(validate(aReview(), scope)).toEqual([]);
  });

  it('takes the empty review, because nothing found is an answer', () => {
    expect(validate(aReview({ findings: [] }), scope)).toEqual([]);
  });
});

describe('a review the recorder refuses', () => {
  it('refuses one that skipped a file the session changed', () => {
    expect(refusalFor({ files: [] })).toContain('does not cover');
  });

  it('refuses a finding that cites no charter question', () => {
    expect(refusalFor({ findings: [aFinding({ question: 99 })] })).toContain(
      'cites no charter question',
    );
  });

  it('refuses a finding pointing at a path that is not here', () => {
    expect(
      refusalFor({ findings: [aFinding({ where: 'src/invented.ts:3' })] }),
    ).toContain('not a path in this project');
  });

  it('refuses a finding that says what but not what to do instead', () => {
    expect(refusalFor({ findings: [aFinding({ instead: '' })] })).toContain('instead');
  });

  it('refuses an unranked pile', () => {
    const pile = new Array(MOST_FINDINGS + 1).fill(aFinding());

    expect(refusalFor({ findings: pile })).toContain(`the cap is ${MOST_FINDINGS}`);
  });

  it('refuses a document with no findings array at all', () => {
    expect(validate({ files: scope }, scope).join(' ')).toContain('no findings array');
  });
});

describe('what the recorded report says', () => {
  const reviewed = { ...aReview(), prose: ['README.md'], at: '2026-08-22T09:00:00.000Z' };

  it('names the question behind the finding and the group it came from', () => {
    const report = designReport(reviewed);

    expect(report).toContain('design-q6');
    expect(report).toContain('naming, question 6');
  });

  it('accounts for what it looked at, so a pass is not silence', () => {
    const passed = designReport({ ...reviewed, findings: [] });

    expect(passed).toContain('SENSOR design: PASS (0 findings)');
    expect(passed).toContain('12 questions · 1 file · 1 document');
  });
});
