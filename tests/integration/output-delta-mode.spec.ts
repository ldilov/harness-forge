import { describe, expect, it } from "vitest";
import { renderDeltaOutput } from "../../src/application/runtime/render-delta-output.js";

describe("output delta mode integration", () => {
  it("reports unchanged findings separately", () => {
    const delta = renderDeltaOutput([{ id: "A", title: "a", severity: "low", evidence: [] }], [{ id: "A", title: "a", severity: "low", evidence: [] }]);
    expect(delta.unchanged).toHaveLength(1);
  });
});
