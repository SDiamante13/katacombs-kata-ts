import { RuleTester } from 'eslint';
import { describe, it } from 'vitest';

import { noMockingLibrary } from '../../scripts/eslint-rules/no-mocking-library.mjs';

RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester();
const flagged = [{ messageId: 'mocking' }];

ruleTester.run('no-mocking-library', noMockingLibrary, {
  valid: [
    { code: 'const world = new FakeWorld();' },
    { code: 'const clock = fixedClockAt(0);' },
    { code: 'vi.useFakeTimers();' },
    { code: 'expect(room.name).toBe("Vault");' },
    { code: 'const mock = { name: "not a call" };' },
    { code: 'thing.mock;' },
  ],
  invalid: [
    { code: 'vi.mock("../src/domain/world.js");', errors: flagged },
    { code: 'vi.spyOn(world, "describe");', errors: flagged },
    { code: 'vi.mocked(loadWorld).mockReturnValue(1);', errors: flagged },
    { code: 'jest.mock("../src/domain/world.js");', errors: flagged },
    { code: 'jest.spyOn(world, "describe");', errors: flagged },
    { code: 'sinon.stub(world, "describe");', errors: flagged },
  ],
});
