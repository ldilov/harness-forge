import { describe, it } from "vitest";

import { expectContainsAll } from "../../helpers/reasoning-template-assertions";

describe("code QA certificate contract", () => {
  it("requires trace, data flow, and alternative check", async () => {
    await expectContainsAll("templates/reasoning/certificates/code-question-answering-certificate.md", [
      "Function trace table",
      "Data flow analysis",
      "Alternative hypothesis check",
      "<answer>",
      "Quality notes"
    ]);
  });
});
