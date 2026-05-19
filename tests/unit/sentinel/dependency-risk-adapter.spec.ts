import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { DependencyRiskSourceAdapter } from "../../../src/application/sentinel/monitor-engine/builtins/dependency-risk.js";
import { MonitorConfigSchema } from "../../../src/domain/sentinel/monitor/monitor.js";
import type { LoadedMonitor } from "../../../src/application/sentinel/monitor-engine/registry.js";

let workspace: string;

function loadedMonitor(): LoadedMonitor {
  const config = MonitorConfigSchema.parse({
    id: "dependency-risk",
    enabled: true,
    source: "harness.dependency_risk",
    interval: "6h",
    dedupe: { fingerprint: "dep:${subject}" },
  });
  return { config, intervalSeconds: 6 * 3600, sourceFile: "test.yaml", warnings: [] };
}

async function writePackageJson(workspaceRoot: string, contents: object): Promise<void> {
  await fs.writeFile(
    path.join(workspaceRoot, "package.json"),
    `${JSON.stringify(contents, null, 2)}\n`,
    "utf8",
  );
}

async function writeInstalledManifest(
  workspaceRoot: string,
  pkgName: string,
  manifest: { readonly version: string; readonly deprecated?: string },
): Promise<void> {
  const dir = path.join(workspaceRoot, "node_modules", pkgName);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, "package.json"), JSON.stringify(manifest), "utf8");
}

async function writeWorldCache(
  workspaceRoot: string,
  pkgName: string,
  doc: { readonly latest: string; readonly deprecated?: string },
): Promise<void> {
  const dir = path.join(workspaceRoot, ".hforge/runtime/world/cache/npm");
  await fs.mkdir(dir, { recursive: true });
  const safeKey = pkgName.replace(/[^a-zA-Z0-9._-]+/g, "_");
  const payload: Record<string, unknown> = { name: pkgName, "dist-tags": { latest: doc.latest } };
  if (doc.deprecated !== undefined) {
    payload.deprecated = doc.deprecated;
  }
  await fs.writeFile(path.join(dir, `${safeKey}.json`), JSON.stringify(payload), "utf8");
}

beforeEach(async () => {
  workspace = await fs.mkdtemp(path.join(os.tmpdir(), "sentinel-deprisk-"));
});

afterEach(async () => {
  await fs.rm(workspace, { recursive: true, force: true });
});

describe("DependencyRiskSourceAdapter", () => {
  it("returns no drafts when package.json is missing", async () => {
    const adapter = new DependencyRiskSourceAdapter();
    const result = await adapter.collect({ workspaceRoot: workspace, monitor: loadedMonitor() });
    expect(result.drafts).toEqual([]);
  });

  it("returns no drafts when no findings", async () => {
    await writePackageJson(workspace, { name: "demo", version: "1.0.0", dependencies: { typescript: "5.0.0" } });
    await writeInstalledManifest(workspace, "typescript", { version: "5.0.0" });
    await writeWorldCache(workspace, "typescript", { latest: "5.0.4" });
    const adapter = new DependencyRiskSourceAdapter();
    const result = await adapter.collect({ workspaceRoot: workspace, monitor: loadedMonitor() });
    expect(result.drafts).toEqual([]);
  });

  it("flags deprecated direct dependencies as severity warning", async () => {
    await writePackageJson(workspace, {
      name: "demo",
      version: "1.0.0",
      dependencies: { "old-pkg": "1.0.0" },
    });
    await writeInstalledManifest(workspace, "old-pkg", { version: "1.0.0", deprecated: "use new-pkg instead" });
    const adapter = new DependencyRiskSourceAdapter();
    const result = await adapter.collect({ workspaceRoot: workspace, monitor: loadedMonitor() });
    expect(result.drafts).toHaveLength(1);
    expect(result.drafts[0]?.severity).toBe("warning");
    expect(result.drafts[0]?.classifyKey).toBe("deprecated_direct");
    expect(result.drafts[0]?.kind).toBe("dependency.deprecated");
    expect(result.drafts[0]?.summary).toContain("use new-pkg instead");
  });

  it("flags deprecated dev dependencies at notice severity", async () => {
    await writePackageJson(workspace, {
      name: "demo",
      version: "1.0.0",
      devDependencies: { "old-dev": "1.0.0" },
    });
    await writeInstalledManifest(workspace, "old-dev", { version: "1.0.0", deprecated: "yikes" });
    const adapter = new DependencyRiskSourceAdapter();
    const result = await adapter.collect({ workspaceRoot: workspace, monitor: loadedMonitor() });
    expect(result.drafts).toHaveLength(1);
    expect(result.drafts[0]?.severity).toBe("notice");
    expect(result.drafts[0]?.classifyKey).toBe("deprecated_indirect");
  });

  it("emits a major_upgrade finding when world cache says a new major is out", async () => {
    await writePackageJson(workspace, {
      name: "demo",
      version: "1.0.0",
      dependencies: { vitest: "3.0.0" },
    });
    await writeInstalledManifest(workspace, "vitest", { version: "3.0.0" });
    await writeWorldCache(workspace, "vitest", { latest: "4.0.0" });
    const adapter = new DependencyRiskSourceAdapter();
    const result = await adapter.collect({ workspaceRoot: workspace, monitor: loadedMonitor() });
    expect(result.drafts).toHaveLength(1);
    expect(result.drafts[0]?.kind).toBe("dependency.major_upgrade");
    expect(result.drafts[0]?.classifyKey).toBe("major_direct");
    expect(result.drafts[0]?.summary).toContain("3.0.0 → 4.0.0");
  });

  it("does not flag minor or patch upgrades", async () => {
    await writePackageJson(workspace, {
      name: "demo",
      version: "1.0.0",
      dependencies: { vitest: "3.0.0" },
    });
    await writeInstalledManifest(workspace, "vitest", { version: "3.0.0" });
    await writeWorldCache(workspace, "vitest", { latest: "3.5.1" });
    const adapter = new DependencyRiskSourceAdapter();
    const result = await adapter.collect({ workspaceRoot: workspace, monitor: loadedMonitor() });
    expect(result.drafts).toEqual([]);
  });

  it("prefers the deprecation finding when both deprecation and major upgrade apply", async () => {
    await writePackageJson(workspace, {
      name: "demo",
      version: "1.0.0",
      dependencies: { stuck: "1.0.0" },
    });
    await writeInstalledManifest(workspace, "stuck", { version: "1.0.0", deprecated: "no longer maintained" });
    await writeWorldCache(workspace, "stuck", { latest: "2.0.0" });
    const adapter = new DependencyRiskSourceAdapter();
    const result = await adapter.collect({ workspaceRoot: workspace, monitor: loadedMonitor() });
    expect(result.drafts).toHaveLength(1);
    expect(result.drafts[0]?.kind).toBe("dependency.deprecated");
  });

  it("does not crash when a dep is missing from both resolver and direct node_modules layout", async () => {
    await writePackageJson(workspace, {
      name: "demo",
      version: "1.0.0",
      dependencies: { "ghost-pkg": "1.0.0" },
    });
    const adapter = new DependencyRiskSourceAdapter();
    const result = await adapter.collect({ workspaceRoot: workspace, monitor: loadedMonitor() });
    expect(result.drafts).toEqual([]);
  });

  it("uses the world cache deprecation flag when no installed manifest exists", async () => {
    await writePackageJson(workspace, {
      name: "demo",
      version: "1.0.0",
      dependencies: { "phantom-pkg": "1.0.0" },
    });
    await writeWorldCache(workspace, "phantom-pkg", {
      latest: "1.5.0",
      deprecated: "package abandoned",
    });
    const adapter = new DependencyRiskSourceAdapter();
    const result = await adapter.collect({ workspaceRoot: workspace, monitor: loadedMonitor() });
    expect(result.drafts).toHaveLength(1);
    expect(result.drafts[0]?.kind).toBe("dependency.deprecated");
    expect(result.drafts[0]?.summary).toContain("package abandoned");
  });

  it("resolves installed manifest via createRequire when direct node_modules path missing", async () => {
    await writePackageJson(workspace, {
      name: "demo",
      version: "1.0.0",
      dependencies: { resolvable: "1.0.0" },
    });
    await writeInstalledManifest(workspace, "resolvable", {
      version: "1.0.0",
      deprecated: "use successor",
    });
    const adapter = new DependencyRiskSourceAdapter();
    const result = await adapter.collect({ workspaceRoot: workspace, monitor: loadedMonitor() });
    expect(result.drafts).toHaveLength(1);
    expect(result.drafts[0]?.kind).toBe("dependency.deprecated");
  });

  it("emits multiple drafts when multiple findings apply", async () => {
    await writePackageJson(workspace, {
      name: "demo",
      version: "1.0.0",
      dependencies: { "old-direct": "1.0.0", vitest: "3.0.0" },
    });
    await writeInstalledManifest(workspace, "old-direct", { version: "1.0.0", deprecated: "deprecated" });
    await writeInstalledManifest(workspace, "vitest", { version: "3.0.0" });
    await writeWorldCache(workspace, "vitest", { latest: "4.0.0" });
    const adapter = new DependencyRiskSourceAdapter();
    const result = await adapter.collect({ workspaceRoot: workspace, monitor: loadedMonitor() });
    expect(result.drafts).toHaveLength(2);
    const kinds = result.drafts.map((d) => d.kind).sort();
    expect(kinds).toEqual(["dependency.deprecated", "dependency.major_upgrade"]);
  });
});
