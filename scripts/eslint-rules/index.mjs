import { noCommentedOutCode } from './no-commented-out-code.mjs';
import { noMockingLibrary } from './no-mocking-library.mjs';

export const sensorRules = {
  rules: {
    'no-commented-out-code': noCommentedOutCode,
    'no-mocking-library': noMockingLibrary,
  },
};
