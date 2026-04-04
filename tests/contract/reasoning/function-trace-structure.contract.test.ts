import { describe, it } from "vitest";

import { expectContainsAll } from "../../helpers/reasoning-template-assertions";

describe("function trace structure", () => {
  it("keeps verified behavior requirements", async () => {
    await expectContainsAll("templates/reasoning/ledgers/function-trace-table.md", [
      "verified behavior",
      "line locations",
      "hidden semantics",
      "Completion check"
    ]);
  });
});
