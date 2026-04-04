import { describe, expect, it } from "vitest";

import { readText } from "../../helpers/reasoning-template-assertions";

describe("reasoning success metrics coverage", () => {
  it("maps SC-001..SC-010 into an operational metrics doc", async () => {
    const [spec, metrics] = await Promise.all([
      readText(".specify/features/20260403-0948-semiformal-kit-spec/spec.md"),
      readText("docs/reasoning/success-metrics.md")
    ]);

    for (let i = 1; i <= 10; i += 1) {
      const id = `SC-${String(i).padStart(3, "0")}`;
      expect(spec).toContain(id);
      expect(metrics).toContain(id);
    }
  });
});

