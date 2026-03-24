import { describe, expect, it } from "vitest";

import { validateTemplateCatalog } from "../../src/application/validation/validate-templates.js";

describe("template catalog contract", () => {
  it("exports a validator", () => {
    expect(typeof validateTemplateCatalog).toBe("function");
  });
});
