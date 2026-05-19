import { describe, expect, it } from "vitest";

import { loadAgentCommandCatalog } from "../../src/application/runtime/command-catalog.js";

const packageRoot = process.cwd();

describe("double diamond command catalog integration", () => {
  it("exposes the feature and bug workflow commands to agents", async () => {
    const catalog = await loadAgentCommandCatalog(packageRoot);

    expect(
      catalog.markdownCommands.some(
        (entry) =>
          entry.trigger === "/hforge-double-diamond" &&
          entry.docPath === "commands/hforge-double-diamond.md"
      )
    ).toBe(true);

    expect(
      catalog.markdownCommands.some(
        (entry) =>
          entry.trigger === "/hforge-bug-diamond" && entry.docPath === "commands/hforge-bug-diamond.md"
      )
    ).toBe(true);

    const feature = catalog.markdownCommands.find((entry) => entry.trigger === "/hforge-double-diamond");
    const bug = catalog.markdownCommands.find((entry) => entry.trigger === "/hforge-bug-diamond");

    expect(feature?.relatedCliCommandIds).toEqual(expect.arrayContaining(["status", "review"]));
    expect(bug?.relatedCliCommandIds).toEqual(expect.arrayContaining(["doctor", "audit"]));
    expect(feature?.description).toContain("Deliver");
    expect(bug?.description.toLowerCase()).toContain("recurrence");
  });
});
