import { describe, expect, it } from "vitest";

import { parseActionBundle } from "../../src/application/recursive/parse-action-bundle.js";

describe("recursive action bundle unit", () => {
  it("fills bundle identity from the execution context", () => {
    const bundle = parseActionBundle({
      sessionId: "RS-001",
      iterationId: "ITER-001",
      sourceText: JSON.stringify({
        intent: "Read the repo map",
        actions: [
          {
            actionId: "A1",
            kind: "read-handle",
            args: {
              handleId: "repo-map"
            }
          }
        ],
        modelTier: "root"
      })
    });

    expect(bundle.sessionId).toBe("RS-001");
    expect(bundle.bundleId).toMatch(/^BUNDLE-/);
  });

});
