import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { AdrDriftSourceAdapter } from "../../../src/application/sentinel/monitor-engine/builtins/adr-drift.js";
import { MonitorConfigSchema } from "../../../src/domain/sentinel/monitor/monitor.js";
import type { LoadedMonitor } from "../../../src/application/sentinel/monitor-engine/registry.js";

let workspace: string;

function loadedMonitor(): LoadedMonitor {
  const config = MonitorConfigSchema.parse({
    id: "adr-drift",
    enabled: true,
    source: "harness.adr_drift",
    interval: "1h",
    dedupe: { fingerprint: "adr:${subject}" },
  });
  return { config, intervalSeconds: 3600, sourceFile: "test.yaml", warnings: [] };
}

async function writeAdr(workspaceRoot: string, relativePath: string, body: string): Promise<void> {
  const full = path.join(workspaceRoot, relativePath);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, body, "utf8");
}

beforeEach(async () => {
  workspace = await fs.mkdtemp(path.join(os.tmpdir(), "sentinel-adr-"));
});

afterEach(async () => {
  await fs.rm(workspace, { recursive: true, force: true });
});

describe("AdrDriftSourceAdapter", () => {
  it("returns empty when no ADR roots exist", async () => {
    const adapter = new AdrDriftSourceAdapter();
    const result = await adapter.collect({ workspaceRoot: workspace, monitor: loadedMonitor() });
    expect(result.drafts).toEqual([]);
  });

  it("returns empty when ADR references all resolve", async () => {
    await fs.writeFile(path.join(workspace, "tsconfig.json"), "{}", "utf8");
    await writeAdr(workspace, "docs/adrs/0001-x.md", "See [config](../../tsconfig.json)\n");
    const adapter = new AdrDriftSourceAdapter();
    const result = await adapter.collect({ workspaceRoot: workspace, monitor: loadedMonitor() });
    expect(result.drafts).toEqual([]);
  });

  it("flags broken file references with severity notice (1-2 broken)", async () => {
    await writeAdr(workspace, "docs/adrs/0001-x.md", "See [vanished](../../src/missing.ts)\n");
    const adapter = new AdrDriftSourceAdapter();
    const result = await adapter.collect({ workspaceRoot: workspace, monitor: loadedMonitor() });
    expect(result.drafts).toHaveLength(1);
    expect(result.drafts[0]?.severity).toBe("notice");
    expect(result.drafts[0]?.classifyKey).toBe("default");
    expect(result.drafts[0]?.summary).toContain("missing.ts");
  });

  it("escalates to warning when 3+ references are broken", async () => {
    await writeAdr(
      workspace,
      "docs/adrs/0002-many.md",
      [
        "[a](../../src/gone-a.ts)",
        "[b](../../src/gone-b.ts)",
        "[c](../../src/gone-c.ts)",
        "[d](../../src/gone-d.ts)",
      ].join("\n"),
    );
    const adapter = new AdrDriftSourceAdapter();
    const result = await adapter.collect({ workspaceRoot: workspace, monitor: loadedMonitor() });
    expect(result.drafts).toHaveLength(1);
    expect(result.drafts[0]?.severity).toBe("warning");
    expect(result.drafts[0]?.classifyKey).toBe("many_broken");
  });

  it("ignores http/https/mailto links and empty fragments", async () => {
    await writeAdr(
      workspace,
      "docs/adrs/0003-links.md",
      [
        "[ext](https://example.com/foo)",
        "[mail](mailto:foo@example.com)",
        "[anchor](#section)",
      ].join("\n"),
    );
    const adapter = new AdrDriftSourceAdapter();
    const result = await adapter.collect({ workspaceRoot: workspace, monitor: loadedMonitor() });
    expect(result.drafts).toEqual([]);
  });

  it("strips fragments before resolving the file", async () => {
    await fs.writeFile(path.join(workspace, "tsconfig.json"), "{}", "utf8");
    await writeAdr(workspace, "docs/adrs/0004-frag.md", "[link](../../tsconfig.json#section-a)\n");
    const adapter = new AdrDriftSourceAdapter();
    const result = await adapter.collect({ workspaceRoot: workspace, monitor: loadedMonitor() });
    expect(result.drafts).toEqual([]);
  });

  it("scans .hforge/runtime/decisions in addition to docs/adrs", async () => {
    await writeAdr(workspace, ".hforge/runtime/decisions/0001-asr.md", "[gone](../../../src/gone.ts)\n");
    const adapter = new AdrDriftSourceAdapter();
    const result = await adapter.collect({ workspaceRoot: workspace, monitor: loadedMonitor() });
    expect(result.drafts).toHaveLength(1);
    expect(result.drafts[0]?.subject).toContain("decisions/0001-asr.md");
  });

  it("emits a draft per ADR file with broken refs", async () => {
    await writeAdr(workspace, "docs/adrs/0001.md", "[gone-a](../../src/gone-a.ts)\n");
    await writeAdr(workspace, "docs/adrs/0002.md", "[gone-b](../../src/gone-b.ts)\n");
    const adapter = new AdrDriftSourceAdapter();
    const result = await adapter.collect({ workspaceRoot: workspace, monitor: loadedMonitor() });
    expect(result.drafts).toHaveLength(2);
    const subjects = result.drafts.map((d) => d.subject).sort();
    expect(subjects).toEqual(["docs/adrs/0001.md", "docs/adrs/0002.md"]);
  });
});
