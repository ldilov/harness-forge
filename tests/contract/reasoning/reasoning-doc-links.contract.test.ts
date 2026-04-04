import { describe, expect, it } from "vitest";

import { exists, readText } from "../../helpers/reasoning-template-assertions";

describe("reasoning docs links", () => {
  it("indexes required reasoning docs and examples", async () => {
    const index = await readText("docs/reasoning/index.md");
    const required = [
      "./adoption-strategy.md",
      "./paper-source-map.md",
      "./template-selection-guide.md",
      "./harness-forge-placement.md",
      "./examples/django-name-shadowing-mini-case-study.md",
      "./examples/mockito-root-cause-mini-case-study.md"
    ];
    for (const fragment of required) {
      expect(index).toContain(fragment);
    }

    const files = [
      "docs/reasoning/adoption-strategy.md",
      "docs/reasoning/paper-source-map.md",
      "docs/reasoning/template-selection-guide.md",
      "docs/reasoning/harness-forge-placement.md",
      "docs/reasoning/examples/django-name-shadowing-mini-case-study.md",
      "docs/reasoning/examples/mockito-root-cause-mini-case-study.md"
    ];

    const checks = await Promise.all(files.map((file) => exists(file)));
    expect(checks.every(Boolean)).toBe(true);
  });
});
