import { describe, expect, it } from "vitest";
import { parseOutputPolicyDocument } from "../../src/domain/runtime/output-policy.js";

describe("output policy contract", () => {
  it("parses required defaults and profiles", () => {
    const doc = parseOutputPolicyDocument({
      schemaVersion: "1",
      defaults: { topLevelHuman: "standard", recursiveWorker: "brief", releaseSignoff: "standard" },
      profiles: {
        brief: { maxOutputTokens: 300, maxFindings: 3, deltaOnly: true, artifactFirst: true },
        standard: { maxOutputTokens: 900, maxFindings: 7, deltaOnly: false, artifactFirst: false }
      }
    });
    expect(doc.defaults.recursiveWorker).toBe("brief");
  });
});
