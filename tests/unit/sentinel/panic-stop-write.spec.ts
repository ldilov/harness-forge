import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  readPanicStop,
  writePanicStop,
} from "../../../src/application/sentinel/runtime/panic-stop.js";
import { sentinelCadencePath } from "../../../src/domain/sentinel/paths.js";

let workspace: string;

beforeEach(async () => {
  workspace = await fs.mkdtemp(path.join(os.tmpdir(), "sentinel-panic-"));
});

afterEach(async () => {
  await fs.rm(workspace, { recursive: true, force: true });
});

describe("writePanicStop", () => {
  it("creates the cadence file with panicStop=true on first write", async () => {
    const result = await writePanicStop(workspace, true);
    expect(result.previous).toBe(false);
    expect(result.current).toBe(true);
    expect(await readPanicStop(workspace)).toBe(true);
  });

  it("flips back to false and reports previous=true", async () => {
    await writePanicStop(workspace, true);
    const result = await writePanicStop(workspace, false);
    expect(result.previous).toBe(true);
    expect(result.current).toBe(false);
    expect(await readPanicStop(workspace)).toBe(false);
  });

  it("preserves existing cadence settings from disk", async () => {
    const filePath = sentinelCadencePath(workspace);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, "maxActionsPerHour: 7\n", "utf8");
    await writePanicStop(workspace, true);
    const raw = await fs.readFile(filePath, "utf8");
    expect(raw).toContain("maxActionsPerHour: 7");
    expect(raw).toContain("panicStop: true");
  });
});
