import { describe, it } from "vitest";

import { expectContainsAll } from "../../helpers/reasoning-template-assertions";

describe("patch equivalence certificate contract", () => {
  it("requires fail-to-pass and counterexample handling", async () => {
    await expectContainsAll("templates/reasoning/certificates/patch-equivalence-certificate.md", [
      "FAIL_TO_PASS",
      "PASS_TO_PASS",
      "Counterexample section",
      "Formal conclusion",
      "ANSWER: YES | NO"
    ]);
  });
});
