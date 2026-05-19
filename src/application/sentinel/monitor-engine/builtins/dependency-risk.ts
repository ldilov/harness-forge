import path from "node:path";
import fs from "node:fs/promises";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { exists, readJsonFile } from "../../../../shared/fs.js";
import { resolveFingerprint } from "../../../../domain/sentinel/observation/fingerprint.js";
import { safeWorldCacheKey } from "../../../../infrastructure/sentinel/stores/world-store.js";
import type { ObservationDraft } from "../../../../infrastructure/sentinel/stores/observation-store.js";
import type { CollectResult, SourceAdapter, SourceAdapterContext } from "../source-adapter.js";

export const DEPENDENCY_RISK_ADAPTER_ID = "harness.dependency_risk";

interface PackageJson {
  readonly name?: string;
  readonly version?: string;
  readonly dependencies?: Record<string, string>;
  readonly devDependencies?: Record<string, string>;
  readonly peerDependencies?: Record<string, string>;
  readonly optionalDependencies?: Record<string, string>;
}

interface InstalledManifest {
  readonly name?: string;
  readonly version?: string;
  readonly deprecated?: string;
}

interface NpmCacheDocument {
  readonly name?: string;
  readonly "dist-tags"?: Record<string, string>;
  readonly time?: Record<string, string>;
  readonly deprecated?: string;
}

type DepKind = "direct" | "dev" | "peer" | "optional";

interface DependencyRecord {
  readonly name: string;
  readonly kind: DepKind;
  readonly declaredRange: string;
  readonly installedVersion: string | null;
  readonly installedDeprecated: string | null;
}

const RANGE_NUMBER_RE = /\d+\.\d+\.\d+(?:[-+][^\s]*)?|\d+\.\d+|\d+/;

function semverParse(version: string): { major: number; minor: number; patch: number } | null {
  const match = RANGE_NUMBER_RE.exec(version);
  if (match === null) {
    return null;
  }
  const parts = match[0].split(".").map((segment) => Number.parseInt(segment.replace(/[^0-9]/g, ""), 10));
  const major = parts[0];
  const minor = parts[1];
  const patch = parts[2];
  if (!Number.isFinite(major)) {
    return null;
  }
  return {
    major: major ?? 0,
    minor: minor ?? 0,
    patch: patch ?? 0,
  };
}

function isMajorBump(from: string, to: string): boolean {
  const a = semverParse(from);
  const b = semverParse(to);
  if (a === null || b === null) {
    return false;
  }
  return b.major > a.major;
}

function resolveCandidatePaths(workspaceRoot: string, name: string): readonly string[] {
  const candidates: string[] = [];
  try {
    const requireFromRoot = createRequire(pathToFileURL(path.join(workspaceRoot, "package.json")).href);
    candidates.push(requireFromRoot.resolve(`${name}/package.json`));
  } catch {
    candidates.length = 0;
  }
  candidates.push(path.join(workspaceRoot, "node_modules", name, "package.json"));
  return candidates;
}

async function readInstalledManifest(workspaceRoot: string, name: string): Promise<InstalledManifest | null> {
  const candidates = resolveCandidatePaths(workspaceRoot, name);
  for (const manifestPath of candidates) {
    if (!(await exists(manifestPath))) {
      continue;
    }
    try {
      return await readJsonFile<InstalledManifest>(manifestPath);
    } catch {
      continue;
    }
  }
  return null;
}

async function readWorldCacheLatest(workspaceRoot: string, name: string): Promise<{
  readonly version: string;
  readonly deprecated: string | null;
} | null> {
  const cachePath = path.join(
    workspaceRoot,
    ".hforge/runtime/world/cache/npm",
    `${safeWorldCacheKey(name)}.json`,
  );
  if (!(await exists(cachePath))) {
    return null;
  }
  try {
    const raw = await fs.readFile(cachePath, "utf8");
    const doc = JSON.parse(raw) as NpmCacheDocument;
    const latest = doc["dist-tags"]?.latest ?? null;
    if (latest === null) {
      return null;
    }
    return { version: latest, deprecated: doc.deprecated ?? null };
  } catch {
    return null;
  }
}

function collectDependencies(pkg: PackageJson): readonly { readonly name: string; readonly kind: DepKind; readonly range: string }[] {
  const out: { readonly name: string; readonly kind: DepKind; readonly range: string }[] = [];
  for (const [name, range] of Object.entries(pkg.dependencies ?? {})) {
    out.push({ name, kind: "direct", range });
  }
  for (const [name, range] of Object.entries(pkg.devDependencies ?? {})) {
    out.push({ name, kind: "dev", range });
  }
  for (const [name, range] of Object.entries(pkg.peerDependencies ?? {})) {
    out.push({ name, kind: "peer", range });
  }
  for (const [name, range] of Object.entries(pkg.optionalDependencies ?? {})) {
    out.push({ name, kind: "optional", range });
  }
  return out;
}

function severityForFinding(finding: Finding): ObservationDraft["severity"] {
  if (finding.kind === "deprecated") {
    return finding.dep.kind === "direct" ? "warning" : "notice";
  }
  if (finding.kind === "major_upgrade") {
    return finding.dep.kind === "direct" ? "notice" : "info";
  }
  return "info";
}

interface MajorUpgradeFinding {
  readonly kind: "major_upgrade";
  readonly dep: DependencyRecord;
  readonly latest: string;
}

interface DeprecatedFinding {
  readonly kind: "deprecated";
  readonly dep: DependencyRecord;
  readonly message: string;
}

type Finding = MajorUpgradeFinding | DeprecatedFinding;

export class DependencyRiskSourceAdapter implements SourceAdapter {
  readonly id = DEPENDENCY_RISK_ADAPTER_ID;

  async collect(context: SourceAdapterContext): Promise<CollectResult> {
    const { workspaceRoot, monitor } = context;
    const pkgPath = path.join(workspaceRoot, "package.json");
    if (!(await exists(pkgPath))) {
      return { drafts: [] };
    }
    const pkg = await readJsonFile<PackageJson>(pkgPath);
    const deps = collectDependencies(pkg);
    const resolved = await Promise.all(
      deps.map(async (dep) => {
        const [installed, cached] = await Promise.all([
          readInstalledManifest(workspaceRoot, dep.name),
          readWorldCacheLatest(workspaceRoot, dep.name),
        ]);
        return { dep, installed, cached };
      }),
    );
    const findings: Finding[] = [];
    for (const { dep, installed, cached } of resolved) {
      const record: DependencyRecord = {
        name: dep.name,
        kind: dep.kind,
        declaredRange: dep.range,
        installedVersion: installed?.version ?? null,
        installedDeprecated: installed?.deprecated ?? null,
      };
      if (record.installedDeprecated !== null) {
        findings.push({ kind: "deprecated", dep: record, message: record.installedDeprecated });
        continue;
      }
      if (cached?.deprecated !== null && cached?.deprecated !== undefined) {
        findings.push({ kind: "deprecated", dep: record, message: cached.deprecated });
        continue;
      }
      if (
        cached !== null &&
        record.installedVersion !== null &&
        isMajorBump(record.installedVersion, cached.version)
      ) {
        findings.push({ kind: "major_upgrade", dep: record, latest: cached.version });
      }
    }
    if (findings.length === 0) {
      return { drafts: [] };
    }
    const drafts: ObservationDraft[] = findings.map((finding) => {
      const severity = severityForFinding(finding);
      const fingerprintInput = `dep:${finding.kind}:${finding.dep.name}:${finding.kind === "major_upgrade" ? finding.latest : "deprecated"}`;
      const fingerprint = resolveFingerprint(monitor.config.dedupe.fingerprint, {
        subject: fingerprintInput,
        metadata: { dep: finding.dep.name, kind: finding.kind },
      });
      const summary =
        finding.kind === "deprecated"
          ? `${finding.dep.name} (${finding.dep.kind}) is deprecated: ${finding.message}`
          : `${finding.dep.name} (${finding.dep.kind}) has a major version available: ${finding.dep.installedVersion ?? "?"} → ${finding.latest}`;
      const evidence = [
        { kind: "file" as const, ref: "package.json" },
      ];
      if (finding.dep.installedVersion !== null) {
        evidence.push({
          kind: "file" as const,
          ref: `node_modules/${finding.dep.name}/package.json`,
        });
      }
      return {
        source: this.id,
        kind: finding.kind === "deprecated" ? "dependency.deprecated" : "dependency.major_upgrade",
        severity,
        classifyKey:
          finding.kind === "deprecated"
            ? finding.dep.kind === "direct"
              ? "deprecated_direct"
              : "deprecated_indirect"
            : finding.dep.kind === "direct"
              ? "major_direct"
              : "major_indirect",
        subject: finding.dep.name,
        summary,
        evidence,
        fingerprint,
        confidence: finding.kind === "deprecated" ? 0.95 : 0.85,
        metadata: {
          dependencyKind: finding.dep.kind,
          declaredRange: finding.dep.declaredRange,
          installedVersion: finding.dep.installedVersion,
          findingKind: finding.kind,
          ...(finding.kind === "major_upgrade" ? { latest: finding.latest } : {}),
          ...(finding.kind === "deprecated" ? { deprecationMessage: finding.message } : {}),
        },
      };
    });
    return { drafts };
  }
}
