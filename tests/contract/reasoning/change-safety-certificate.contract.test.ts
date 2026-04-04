import { describe, it } from "vitest";

import { expectContainsAll } from "../../helpers/reasoning-template-assertions";

describe("change safety certificate contract", () => {
  it("enforces preserved-vs-changed behavior and recommendation outcomes", async () => {
    await expectContainsAll(".hforge/templates/reasoning/certificates/change-safety-certificate.md", [
      "Preserved-behavior claims",
      "Changed-behavior claims",
      "Regression hypotheses",
      "Alternative hypothesis check",
      "safe to merge"
    ]);
  });
});
