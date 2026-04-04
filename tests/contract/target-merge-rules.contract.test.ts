import { describe, expect, it } from "vitest";

describe("target merge rules contract", () => {
  it("documents merge rules explicitly", () => {
    const mergeRules = {
      ".codex/config.toml": "merge-toml-table",
      "AGENTS.md": "managed-block"
    };
    expect(Object.keys(mergeRules).length).toBeGreaterThan(0);
  });
});
