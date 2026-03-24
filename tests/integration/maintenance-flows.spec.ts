import { describe, expect, it } from "vitest";

import { scanReferenceInstall } from "../../src/application/migration/scan-reference-install.js";

describe("maintenance flows integration", () => {
  it("returns migration mappings without throwing", async () => {
    await expect(scanReferenceInstall(process.cwd())).resolves.toBeDefined();
  });
});
