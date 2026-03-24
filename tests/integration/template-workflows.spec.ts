import { describe, expect, it } from "vitest";

import { workflowGraph } from "../../src/application/validation/validate-templates.js";

describe("template workflow integration", () => {
  it("builds a graph for a known workflow", async () => {
    await expect(workflowGraph(process.cwd(), "research-plan-implement-validate")).resolves.toContain("graph TD");
  });
});
