export const comments = {
  'commented-out-code': [
    'Dead Code wearing a comment. This is not documentation — it is a branch someone was afraid to delete, and every reader after you has to work out whether it still matters.',
    'Delete it. Git remembers it, and `git log -S` will find it faster than anyone will find it here.',
    'If you are keeping it because the live code is wrong, fix the live code. If you are keeping it as a worked example, it belongs in a test, where it runs and stays true.',
    'Not this: leaving it with a note explaining why it is still here. A comment about dead code is two problems.',
  ],
  'deferred-work': [
    'A decision deferred, with no owner and no date, in the one place nobody looks — code that already works.',
    'If it is small, do it now. If it is not small, it is a piece of work: put it where work is tracked, with enough context to be actionable.',
    'If the note is really a warning about a constraint or a trap, rewrite it as one. A comment saying **why** the code is shaped this way earns its place; a comment saying what somebody ought to do later does not.',
    'Not this: relabelling it to a word the sensor does not scan. The work does not move because the label did.',
  ],
};
