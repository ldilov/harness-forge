import { describe, it } from "vitest";

import { expectContainsAll } from "../../helpers/reasoning-template-assertions";

describe("fault localization certificate contract", () => {
  it("preserves four-phase reasoning structure", async () => {
    await expectContainsAll("templates/reasoning/certificates/fault-localization-certificate.md", [
      "Phase 1 - test semantics analysis",
      "Phase 2 - code path tracing",
      "Phase 3 - divergence analysis",
      "Phase 4 - ranked predictions",
      "root cause or crash site?"
    ]);
  });
});
