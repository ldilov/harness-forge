import { describe, expect, it } from "vitest";

import { parseRecursiveSubcall } from "../../src/domain/recursive/subcall.js";

describe("recursive subcall contract", () => {
  it("parses bounded recursive subcalls with routing posture", () => {
    const subcall = parseRecursiveSubcall({
      subcallId: "SUB-001",
      sessionId: "RS-001",
      parentIterationId: "ITER-001",
      subcallType: "inspect",
      inputRefs: ["repo-map"],
      routingTier: "child",
      status: "completed",
      prompt: "Inspect billing ownership",
      resultRef: "subcalls/SUB-001.json",
      createdAt: "2026-04-01T10:00:00.000Z",
      updatedAt: "2026-04-01T10:00:01.000Z"
    });

    expect(subcall.routingTier).toBe("child");
  });

});
