import { noCommentedOutCode } from './no-commented-out-code.mjs';
import { noMockingLibrary } from './no-mocking-library.mjs';
import { noSensorSuppression } from './no-sensor-suppression.mjs';
import { noStaleReference } from './no-stale-reference.mjs';
import { oneLineComment } from './one-line-comment.mjs';

export const sensorRules = {
  rules: {
    'no-commented-out-code': noCommentedOutCode,
    'no-mocking-library': noMockingLibrary,
    'no-sensor-suppression': noSensorSuppression,
    'no-stale-reference': noStaleReference,
    'one-line-comment': oneLineComment,
  },
};
