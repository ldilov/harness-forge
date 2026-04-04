import { describe, it } from "vitest";

import { expectContainsAll } from "../../helpers/reasoning-template-assertions";

describe("data flow structure", () => {
  it("tracks state mutation and semantic checks", async () => {
    await expectContainsAll(".hforge/templates/reasoning/ledgers/data-flow-and-semantic-properties.md", [
      "Data flow analysis",
      "modified at",
      "Semantic properties",
      "Alternative semantic check"
    ]);
  });
});
