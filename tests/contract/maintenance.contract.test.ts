import { describe, expect, it } from "vitest";

import { scanReferenceInstall } from "../../src/application/migration/scan-reference-install.js";

describe("maintenance contract", () => {
  it("exports a migration scanner", () => {
    expect(typeof scanReferenceInstall).toBe("function");
  });
});
