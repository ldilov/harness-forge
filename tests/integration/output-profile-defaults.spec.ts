import { describe, expect, it } from "vitest";
import { selectOutputProfile } from "../../src/application/runtime/select-output-profile.js";

describe("output profile defaults integration", () => {
  it("uses recursiveWorker default for recursive actor", () => {
    const profile = selectOutputProfile(
      {
        schemaVersion: "1",
        defaults: { topLevelHuman: "standard", recursiveWorker: "brief", releaseSignoff: "standard" },
        profiles: { brief: { maxOutputTokens: 300, maxFindings: 3, deltaOnly: true, artifactFirst: true } }
      },
      "recursiveWorker"
    );
    expect(profile).toBe("brief");
  });
});
