import { normalise, present, projectPaths } from './behavior-scope.mjs';

const REVIEWED = /^(src|test|scripts)\//;
const PROSE = /\.md$/;

// Only source triggers a review; the prose comes along so questions 10 to 12 have something to read.
export function reviewable(files) {
  return present(normalise(files)).filter((file) => REVIEWED.test(file));
}

export function proseChanged(files) {
  return present(projectPaths(files)).filter((file) => PROSE.test(file));
}

export function reviewScope(files) {
  return { source: reviewable(files), prose: proseChanged(files) };
}
