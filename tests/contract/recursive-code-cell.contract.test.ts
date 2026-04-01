import { describe, expect, it } from "vitest";

import { parseRecursiveCodeCell } from "../../src/domain/recursive/code-cell.js";

describe("recursive code cell contract", () => {
  it("parses bounded code-cell metadata with explicit sandbox posture", () => {
    const cell = parseRecursiveCodeCell({
      cellId: "CELL-001",
      sessionId: "RS-001",
      iterationId: "ITER-001",
      languageId: "javascript",
      inputRefs: ["repo-map"],
      expectedOutputs: ["stdout summary"],
      sandboxPosture: {
        sandboxMode: "read-only-inspection",
        networkPosture: "offline",
        timeoutMs: 1000,
        writeScope: "cell-artifacts-only"
      },
      status: "completed",
      createdAt: "2026-04-01T10:00:00.000Z",
      updatedAt: "2026-04-01T10:00:01.000Z"
    });

    expect(cell.sandboxPosture.networkPosture).toBe("offline");
  });

});
