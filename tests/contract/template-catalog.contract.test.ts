import { describe, expect, it } from "vitest";

import { validateTemplateCatalog } from "../../src/application/validation/validate-templates.js";

describe("template catalog contract", () => {
  it("exports a validator", () => {
    expect(typeof validateTemplateCatalog).toBe("function");
  });

  it("accepts the shipped templates under the canonical section contract", async () => {
    const report = await validateTemplateCatalog(process.cwd());
    expect(report.ok).toBe(true);
  });
});
