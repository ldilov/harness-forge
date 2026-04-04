import { describe, expect, it } from "vitest";
import { resolveExportProfile } from "../../src/application/runtime/resolve-export-profile.js";

describe("runtime export profiles integration", () => {
  it("loads runtime-standard profile", async () => {
    const profile = await resolveExportProfile(process.cwd(), "runtime-standard");
    expect(profile?.profile).toBe("runtime-standard");
  });
});
