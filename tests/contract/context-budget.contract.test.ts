import { describe, expect, it } from "vitest";
import { parseOutputPolicyDocument } from "../../src/domain/runtime/output-policy.js";

describe("context budget contract", () => {
  it("accepts profile-like output constraints", () => {
    const parsed = parseOutputPolicyDocument({
      schemaVersion: "1",
      defaults: { topLevelHuman: "standard", recursiveWorker: "brief", releaseSignoff: "standard" },
      profiles: { brief: { maxOutputTokens: 300, maxFindings: 3, deltaOnly: true, artifactFirst: true } }
    });
    expect(parsed.profiles.brief.maxFindings).toBe(3);
  });
});
