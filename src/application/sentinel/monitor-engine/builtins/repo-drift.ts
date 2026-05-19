import path from "node:path";
import fs from "node:fs/promises";
import { exists, readJsonFile } from "../../../../shared/fs.js";
import { sha256ContentHash } from "../../../../shared/sha256.js";
import { resolveFingerprint } from "../../../../domain/sentinel/observation/fingerprint.js";
import type { ObservationDraft } from "../../../../infrastructure/sentinel/stores/observation-store.js";
import type { CollectResult, SourceAdapter, SourceAdapterContext } from "../source-adapter.js";

interface PackageJson {
  readonly name?: string;
  readonly version?: string;
  readonly dependencies?: Record<string, string>;
  readonly devDependencies?: Record<string, string>;
}

interface DriftSnapshot {
  readonly packageHash: string | null;
  readonly lockHash: string | null;
  readonly tsconfigHash: string | null;
  readonly hforgeManifestHash: string | null;
}

const DRIFT_SNAPSHOT_FILE = ".hforge/runtime/observations/repo-drift-snapshot.json";

async function fileHash(workspaceRoot: string, relativePath: string): Promise<string | null> {
  const fullPath = path.join(workspaceRoot, relativePath);
  if (!(await exists(fullPath))) {
    return null;
  }
  const content = await fs.readFile(fullPath);
  return sha256ContentHash(content);
}

async function loadPreviousSnapshot(workspaceRoot: string): Promise<DriftSnapshot | null> {
  const snapshotPath = path.join(workspaceRoot, DRIFT_SNAPSHOT_FILE);
  if (!(await exists(snapshotPath))) {
    return null;
  }
  return readJsonFile<DriftSnapshot>(snapshotPath);
}

async function writeSnapshot(workspaceRoot: string, snapshot: DriftSnapshot): Promise<void> {
  const snapshotPath = path.join(workspaceRoot, DRIFT_SNAPSHOT_FILE);
  await fs.mkdir(path.dirname(snapshotPath), { recursive: true });
  await fs.writeFile(snapshotPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
}

async function captureSnapshot(workspaceRoot: string): Promise<DriftSnapshot> {
  return {
    packageHash: await fileHash(workspaceRoot, "package.json"),
    lockHash:
      (await fileHash(workspaceRoot, "package-lock.json")) ??
      (await fileHash(workspaceRoot, "pnpm-lock.yaml")) ??
      (await fileHash(workspaceRoot, "yarn.lock")),
    tsconfigHash: await fileHash(workspaceRoot, "tsconfig.json"),
    hforgeManifestHash: await fileHash(workspaceRoot, ".hforge/agent-manifest.json"),
  };
}

function diffSnapshots(prev: DriftSnapshot, current: DriftSnapshot): readonly string[] {
  const changes: string[] = [];
  if (prev.packageHash !== current.packageHash) {
    changes.push("package.json");
  }
  if (prev.lockHash !== current.lockHash) {
    changes.push("lockfile");
  }
  if (prev.tsconfigHash !== current.tsconfigHash) {
    changes.push("tsconfig.json");
  }
  if (prev.hforgeManifestHash !== current.hforgeManifestHash) {
    changes.push(".hforge/agent-manifest.json");
  }
  return changes;
}

async function describeFrameworks(workspaceRoot: string): Promise<readonly string[]> {
  const pkgPath = path.join(workspaceRoot, "package.json");
  if (!(await exists(pkgPath))) {
    return [];
  }
  const pkg = await readJsonFile<PackageJson>(pkgPath);
  const deps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
  const known: Array<[string, string]> = [
    ["next", "next.js"],
    ["react", "react"],
    ["vue", "vue"],
    ["@nestjs/core", "nestjs"],
    ["express", "express"],
    ["vitest", "vitest"],
    ["jest", "jest"],
  ];
  const found: string[] = [];
  for (const [dep, label] of known) {
    if (Object.prototype.hasOwnProperty.call(deps, dep)) {
      found.push(label);
    }
  }
  return found;
}

export class RepoDriftSourceAdapter implements SourceAdapter {
  readonly id = "harness.repo_drift";

  async collect(context: SourceAdapterContext): Promise<CollectResult> {
    const { workspaceRoot, monitor } = context;
    const current = await captureSnapshot(workspaceRoot);
    const previous = await loadPreviousSnapshot(workspaceRoot);
    const commit = async () => {
      await writeSnapshot(workspaceRoot, current);
    };

    if (previous === null) {
      const frameworks = await describeFrameworks(workspaceRoot);
      const fingerprint = resolveFingerprint(monitor.config.dedupe.fingerprint, {
        subject: "repo-drift:baseline",
        metadata: { frameworks },
      });
      const draft: ObservationDraft = {
        source: this.id,
        kind: "drift.baseline",
        severity: "info",
        subject: "repo-drift baseline captured",
        summary: `Captured baseline for ${frameworks.length === 0 ? "no recognised frameworks" : frameworks.join(", ")}.`,
        evidence: [
          { kind: "file", ref: "package.json" },
          { kind: "file", ref: ".hforge/runtime/observations/repo-drift-snapshot.json" },
        ],
        fingerprint,
        confidence: 1,
        metadata: { frameworks, snapshotHashes: current },
      };
      return { drafts: [draft], commit };
    }

    const changes = diffSnapshots(previous, current);
    if (changes.length === 0) {
      return { drafts: [], commit };
    }
    const fingerprint = resolveFingerprint(monitor.config.dedupe.fingerprint, {
      subject: "repo-drift:" + changes.join(","),
      metadata: { changes },
    });
    const manifestChanged = changes.includes(".hforge/agent-manifest.json");
    const draft: ObservationDraft = {
      source: this.id,
      kind: "drift.detected",
      severity: "notice",
      classifyKey: manifestChanged ? "manifest_changed" : "default",
      subject: `Repo drift in ${changes.length} surface${changes.length === 1 ? "" : "s"}`,
      summary: `Changed since last tick: ${changes.join(", ")}. Consider running 'hforge refresh' to keep the harness in sync.`,
      evidence: changes.map((change) => ({ kind: "file" as const, ref: change })),
      fingerprint,
      confidence: 0.9,
      metadata: { changes, before: previous, after: current },
    };
    return { drafts: [draft], commit };
  }
}
