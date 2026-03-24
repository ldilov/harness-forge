import { describe, expect, it } from "vitest";

import { resolveBundles } from "../../src/application/planning/resolve-bundles.js";

describe("bundle resolution contract", () => {
  it("resolves direct bundle selection", () => {
    const result = resolveBundles(
      [
        {
          id: "baseline:commands",
          family: "baseline",
          version: 1,
          description: "",
          paths: [],
          targets: ["codex"],
          dependencies: [],
          conflicts: [],
          optional: false,
          defaultInstall: true,
          stability: "stable",
          tags: [],
          owner: "core"
        }
      ],
      [],
      undefined,
      ["baseline:commands"]
    );
    expect(result.selected.map((item) => item.id)).toContain("baseline:commands");
  });
});
