import path from "node:path";
import fs from "node:fs/promises";
import { exists } from "../../../../shared/fs.js";
import { resolveFingerprint } from "../../../../domain/sentinel/observation/fingerprint.js";
import type { ObservationDraft } from "../../../../infrastructure/sentinel/stores/observation-store.js";
import type { CollectResult, SourceAdapter, SourceAdapterContext } from "../source-adapter.js";

export const ADR_DRIFT_ADAPTER_ID = "harness.adr_drift";

const DEFAULT_ROOTS: readonly string[] = [
  "docs/adrs",
  "docs/adr",
  ".hforge/runtime/decisions",
];

const SKIP_PATH_PREFIXES: readonly string[] = ["http://", "https://", "mailto:", "ftp://", "#"];

const MARKDOWN_LINK_RE = /\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
const ANGLE_LINK_RE = /<([^>\s]+\.[a-zA-Z0-9]+)>/g;

interface AdrFile {
  readonly file: string;
  readonly references: readonly string[];
}

interface BrokenReferenceFinding {
  readonly adr: string;
  readonly broken: readonly string[];
  readonly checked: number;
}

async function walk(dir: string): Promise<readonly string[]> {
  if (!(await exists(dir))) {
    return [];
  }
  const out: string[] = [];
  const stack: string[] = [dir];
  while (stack.length > 0) {
    const current = stack.pop()!;
    let entries;
    try {
      entries = await fs.readdir(current, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const next = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(next);
      } else if (entry.isFile() && (entry.name.endsWith(".md") || entry.name.endsWith(".markdown"))) {
        out.push(next);
      }
    }
  }
  return out;
}

function shouldSkipReference(reference: string): boolean {
  for (const prefix of SKIP_PATH_PREFIXES) {
    if (reference.startsWith(prefix)) {
      return true;
    }
  }
  return false;
}

function stripFragment(reference: string): string {
  const hash = reference.indexOf("#");
  return hash === -1 ? reference : reference.slice(0, hash);
}

function extractReferences(content: string): readonly string[] {
  const refs = new Set<string>();
  for (const match of content.matchAll(MARKDOWN_LINK_RE)) {
    const target = match[1];
    if (target !== undefined) {
      refs.add(target);
    }
  }
  for (const match of content.matchAll(ANGLE_LINK_RE)) {
    const target = match[1];
    if (target !== undefined) {
      refs.add(target);
    }
  }
  return [...refs];
}

async function checkReferences(
  workspaceRoot: string,
  adrFile: string,
  references: readonly string[],
): Promise<BrokenReferenceFinding | null> {
  if (references.length === 0) {
    return null;
  }
  const adrDir = path.dirname(adrFile);
  const broken: string[] = [];
  let checked = 0;
  for (const reference of references) {
    if (shouldSkipReference(reference)) {
      continue;
    }
    const stripped = stripFragment(reference).trim();
    if (stripped.length === 0) {
      continue;
    }
    checked += 1;
    const candidates: string[] = [];
    if (path.isAbsolute(stripped)) {
      candidates.push(stripped);
    } else {
      candidates.push(path.resolve(adrDir, stripped));
      candidates.push(path.resolve(workspaceRoot, stripped));
    }
    let found = false;
    for (const candidate of candidates) {
      if (await exists(candidate)) {
        found = true;
        break;
      }
    }
    if (!found) {
      broken.push(reference);
    }
  }
  if (broken.length === 0) {
    return null;
  }
  return { adr: adrFile, broken, checked };
}

function severityForBroken(brokenCount: number): ObservationDraft["severity"] {
  if (brokenCount >= 3) {
    return "warning";
  }
  return "notice";
}

export interface AdrDriftAdapterOptions {
  readonly extraRoots?: readonly string[];
}

export class AdrDriftSourceAdapter implements SourceAdapter {
  readonly id = ADR_DRIFT_ADAPTER_ID;

  constructor(private readonly options: AdrDriftAdapterOptions = {}) {}

  async collect(context: SourceAdapterContext): Promise<CollectResult> {
    const { workspaceRoot, monitor } = context;
    const roots = [...DEFAULT_ROOTS, ...(this.options.extraRoots ?? [])];
    const allAdrs: string[] = [];
    for (const root of roots) {
      const abs = path.join(workspaceRoot, root);
      const found = await walk(abs);
      allAdrs.push(...found);
    }
    if (allAdrs.length === 0) {
      return { drafts: [] };
    }
    const adrFiles: AdrFile[] = [];
    for (const file of allAdrs) {
      try {
        const content = await fs.readFile(file, "utf8");
        adrFiles.push({ file, references: extractReferences(content) });
      } catch {
        continue;
      }
    }
    const findings: BrokenReferenceFinding[] = [];
    for (const adr of adrFiles) {
      const finding = await checkReferences(workspaceRoot, adr.file, adr.references);
      if (finding !== null) {
        findings.push(finding);
      }
    }
    if (findings.length === 0) {
      return { drafts: [] };
    }
    const drafts: ObservationDraft[] = findings.map((finding) => {
      const relativeAdr = path.relative(workspaceRoot, finding.adr).replace(/\\/g, "/");
      const fingerprint = resolveFingerprint(monitor.config.dedupe.fingerprint, {
        subject: `adr-drift:${relativeAdr}`,
        metadata: { adr: relativeAdr, broken: finding.broken },
      });
      const severity = severityForBroken(finding.broken.length);
      const summary =
        finding.broken.length === 1
          ? `${relativeAdr} references a missing target: ${finding.broken[0]}`
          : `${relativeAdr} references ${finding.broken.length} missing targets (e.g. ${finding.broken[0]}).`;
      return {
        source: this.id,
        kind: "decision.drift",
        severity,
        classifyKey: finding.broken.length >= 3 ? "many_broken" : "default",
        subject: relativeAdr,
        summary,
        evidence: [
          { kind: "file" as const, ref: relativeAdr },
          ...finding.broken.slice(0, 5).map((target) => ({ kind: "file" as const, ref: target })),
        ],
        fingerprint,
        confidence: 0.9,
        metadata: {
          adr: relativeAdr,
          broken: finding.broken,
          checked: finding.checked,
        },
      };
    });
    return { drafts };
  }
}
