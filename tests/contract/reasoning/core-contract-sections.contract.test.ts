import { describe, it } from "vitest";

import { expectContainsAll } from "../../helpers/reasoning-template-assertions";

describe("core contract sections", () => {
  it("keeps required semiformal core sections", async () => {
    await expectContainsAll("templates/reasoning/contracts/semiformal-core-contract.md", [
      "## Required outputs",
      "premises",
      "evidence ledger",
      "alternative hypothesis check",
      "formal conclusion",
      "unresolved assumptions"
    ]);
  });
});
