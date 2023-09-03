import { describe, test, expect } from "@jest/globals";

import { generateConfirmationCode } from "./generateConfirmationCode";

describe("generateConfirmationCode", () => {
  test("code is number", () => {
    expect(typeof generateConfirmationCode()).toBe("number");
  });

  test("code length is equal 6", () => {
    expect(generateConfirmationCode()).toBeGreaterThanOrEqual(100000);
    expect(generateConfirmationCode()).toBeLessThanOrEqual(999999);
  });
});
