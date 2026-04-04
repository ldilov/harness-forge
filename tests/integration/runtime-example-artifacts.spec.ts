import fs from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("runtime example artifacts integration", () => {
  it("reads runtime examples folder", async () => {
    const dir = path.join(process.cwd(), "docs", "runtime", "examples");
    const entries = await fs.readdir(dir);
    expect(entries.length).toBeGreaterThan(3);
  });
});
