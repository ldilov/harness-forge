import { describe, expect, it } from "vitest";
import { renderDeltaOutput } from "../../src/application/runtime/render-delta-output.js";

describe("output delta mode", () => {
  it("returns added and removed findings", () => {
    const delta = renderDeltaOutput([{ id: "A", title: "a", severity: "low", evidence: [] }], [{ id: "B", title: "b", severity: "high", evidence: [] }]);
    expect(delta.added).toHaveLength(1);
    expect(delta.removed).toHaveLength(1);
  });
});
