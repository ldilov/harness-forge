import { describe, it } from "vitest";

import { expectContainsAll } from "../../helpers/reasoning-template-assertions";

describe("risk mode escalation", () => {
  it("documents Lite/Standard/Deep and escalation triggers", async () => {
    await expectContainsAll("docs/reasoning/getting-started.md", [
      "Lite",
      "Standard",
      "Deep",
      "Escalation triggers"
    ]);
  });
});
