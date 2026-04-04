import { describe, it } from "vitest";

import { expectContainsAll } from "../../helpers/reasoning-template-assertions";

describe("pre-merge decision outcomes", () => {
  it("keeps deterministic recommendation outcome set", async () => {
    await expectContainsAll(".hforge/templates/reasoning/contracts/pre-merge-decision-interface.md", [
      "safe-to-merge",
      "safe-with-conditions",
      "not-yet-safe",
      "Decision Rules",
      "Validation Rules"
    ]);
  });
});
