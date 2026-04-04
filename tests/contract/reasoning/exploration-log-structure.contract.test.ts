import { describe, it } from "vitest";

import { expectContainsAll } from "../../helpers/reasoning-template-assertions";

describe("exploration log structure", () => {
  it("requires hypothesis-before-read workflow", async () => {
    await expectContainsAll("templates/reasoning/logs/semiformal-exploration-log.md", [
      "do not request or open the next file",
      "HYPOTHESIS",
      "EVIDENCE ALREADY HELD",
      "NEXT ACTION RATIONALE",
      "HYPOTHESIS UPDATE"
    ]);
  });
});
