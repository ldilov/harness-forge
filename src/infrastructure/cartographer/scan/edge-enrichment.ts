import path from "node:path";
import { edgeId, type GraphEdge } from "../../../domain/cartographer/graph/graph-edge.js";

const TEST_SUFFIX = /\.(test|spec|unit|integration|e2e)$/;
const NON_TEST_TARGET = /(helper|fixture|mock|stub|util|^index$|^constants$|^types$|^config$|^main$|^entry$)/i;
const MARKDOWN_LINK = /\[[^\]]*\]\(([^)]+)\)|<([^>\s]+\.[a-zA-Z0-9]+)>/g;
const EXTERNAL_LINK = /^(https?:|mailto:|ftp:|#)/i;
const GLOB_TOKEN = /[*?{}[\]]/;
const SCRIPT_PATH_TOKEN = /(?:^|\s)((?:\.\/)?(?:src|tests?|scripts|lib)\/[A-Za-z0-9._/-]+\.[A-Za-z0-9]+)/g;
const IMPLEMENTS_CLAUSE =
  /\bclass\s+[A-Za-z0-9_]+(?:<[^>]*>)?(?:\s+extends\s+[A-Za-z0-9_.]+(?:<[^>]*>)?)?\s+implements\s+([A-Za-z0-9_,.\s<>]+?)\s*\{/g;

function stripCode(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|[^:])\/\/[^\n]*/g, "$1 ")
    .replace(/`(?:\\.|[^`\\])*`/g, " ")
    .replace(/"(?:\\.|[^"\\])*"/g, ' "" ')
    .replace(/'(?:\\.|[^'\\])*'/g, " '' ");
}

export interface FileLike {
  readonly relativePath: string;
  readonly content: string;
}

function dedupeKey(from: string, to: string, kind: GraphEdge["kind"]): string {
  return `${kind}:${from}->${to}`;
}

export function deriveTestEdges(
  testFiles: ReadonlyMap<string, string>,
  resolveImport: (fromPath: string, content: string) => readonly string[],
  indexedFiles: ReadonlySet<string>,
): readonly GraphEdge[] {
  const edges: GraphEdge[] = [];
  const seen = new Set<string>();
  const sourceByBase = new Map<string, string[]>();
  for (const sourcePath of indexedFiles) {
    const base = path.posix.basename(sourcePath).replace(/\.[A-Za-z0-9]+$/, "");
    (sourceByBase.get(base) ?? sourceByBase.set(base, []).get(base)!).push(sourcePath);
  }
  for (const [testPath, content] of testFiles) {
    const fromId = `test:${testPath}`;
    let matchedViaImport = false;
    for (const target of resolveImport(testPath, content)) {
      if (!indexedFiles.has(target)) {
        continue;
      }
      const key = dedupeKey(fromId, `file:${target}`, "tests");
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      matchedViaImport = true;
      edges.push({
        id: edgeId(fromId, `file:${target}`, "tests"),
        from: fromId,
        to: `file:${target}`,
        kind: "tests",
        confidence: 0.92,
        evidence: [{ kind: "file", ref: testPath, excerpt: "test imports source module" }],
      });
    }
    if (matchedViaImport) {
      continue;
    }
    const baseName = path.posix.basename(testPath).replace(/\.[A-Za-z0-9]+$/, "");
    if (NON_TEST_TARGET.test(baseName)) {
      continue;
    }
    const stripped = baseName.replace(TEST_SUFFIX, "");
    if (NON_TEST_TARGET.test(stripped)) {
      continue;
    }
    const candidates = (sourceByBase.get(stripped) ?? []).filter((candidate) => indexedFiles.has(candidate));
    if (candidates.length !== 1) {
      continue;
    }
    const target = candidates[0]!;
    const key = dedupeKey(fromId, `file:${target}`, "tests");
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    edges.push({
      id: edgeId(fromId, `file:${target}`, "tests"),
      from: fromId,
      to: `file:${target}`,
      kind: "tests",
      confidence: 0.8,
      evidence: [{ kind: "heuristic", ref: testPath, excerpt: `basename mirror of ${stripped}` }],
    });
  }
  return edges;
}

export function deriveDocumentEdges(
  docFiles: ReadonlyMap<string, string>,
  indexedFiles: ReadonlySet<string>,
): readonly GraphEdge[] {
  const edges: GraphEdge[] = [];
  const seen = new Set<string>();
  for (const [docPath, content] of docFiles) {
    const fromId = `doc:${docPath}`;
    const docDir = path.posix.dirname(docPath.replace(/\\/g, "/"));
    MARKDOWN_LINK.lastIndex = 0;
    let match: RegExpExecArray | null = MARKDOWN_LINK.exec(content);
    while (match !== null) {
      const raw = (match[1] ?? match[2] ?? "").replace(/\\/g, "/").trim().split("#")[0]!.trim();
      match = MARKDOWN_LINK.exec(content);
      if (raw.length === 0 || EXTERNAL_LINK.test(raw)) {
        continue;
      }
      const candidates = raw.startsWith("/")
        ? [raw.replace(/^\/+/, "")]
        : [
            path.posix.normalize(path.posix.join(docDir, raw)),
            path.posix.normalize(raw),
          ];
      const target = candidates.find((candidate) => indexedFiles.has(candidate));
      if (target === undefined) {
        continue;
      }
      const key = dedupeKey(fromId, `file:${target}`, "documents");
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      edges.push({
        id: edgeId(fromId, `file:${target}`, "documents"),
        from: fromId,
        to: `file:${target}`,
        kind: "documents",
        confidence: 0.9,
        evidence: [{ kind: "file", ref: docPath, excerpt: raw }],
      });
    }
  }
  return edges;
}

export function deriveCommandEdges(
  scripts: ReadonlyMap<string, string>,
  indexedFiles: ReadonlySet<string>,
): readonly GraphEdge[] {
  const edges: GraphEdge[] = [];
  const seen = new Set<string>();
  for (const [scriptName, scriptBody] of scripts) {
    const commandId = `command:${scriptName}`;
    const isVerifier = /(test|spec|vitest|jest|lint|typecheck|validate)/i.test(scriptName);
    SCRIPT_PATH_TOKEN.lastIndex = 0;
    let match: RegExpExecArray | null = SCRIPT_PATH_TOKEN.exec(scriptBody);
    while (match !== null) {
      const token = (match[1] ?? "").replace(/^\.\//, "");
      match = SCRIPT_PATH_TOKEN.exec(scriptBody);
      if (token.length === 0 || GLOB_TOKEN.test(token) || !indexedFiles.has(token)) {
        continue;
      }
      const usesKey = dedupeKey(`file:${token}`, commandId, "uses-command");
      if (!seen.has(usesKey)) {
        seen.add(usesKey);
        edges.push({
          id: edgeId(`file:${token}`, commandId, "uses-command"),
          from: `file:${token}`,
          to: commandId,
          kind: "uses-command",
          confidence: 0.8,
          evidence: [{ kind: "config", ref: "package.json", excerpt: `${scriptName}: ${token}` }],
        });
      }
      if (isVerifier) {
        const verKey = dedupeKey(commandId, `file:${token}`, "verifies");
        if (!seen.has(verKey)) {
          seen.add(verKey);
          edges.push({
            id: edgeId(commandId, `file:${token}`, "verifies"),
            from: commandId,
            to: `file:${token}`,
            kind: "verifies",
            confidence: 0.7,
            evidence: [{ kind: "config", ref: "package.json", excerpt: `${scriptName} verifies ${token}` }],
          });
        }
      }
    }
  }
  return edges;
}

export function deriveImplementsEdges(
  sourceFiles: ReadonlyMap<string, string>,
  exportNameToFiles: ReadonlyMap<string, readonly string[]>,
): readonly GraphEdge[] {
  const edges: GraphEdge[] = [];
  const seen = new Set<string>();
  for (const [sourcePath, rawContent] of sourceFiles) {
    const content = stripCode(rawContent);
    IMPLEMENTS_CLAUSE.lastIndex = 0;
    let match: RegExpExecArray | null = IMPLEMENTS_CLAUSE.exec(content);
    while (match !== null) {
      const clause = (match[1] ?? "").replace(/<[^>]*>/g, "");
      match = IMPLEMENTS_CLAUSE.exec(content);
      for (const rawIface of clause.split(",")) {
        const iface = rawIface.trim();
        if (iface.length === 0 || !/^[A-Za-z_][A-Za-z0-9_.]*$/.test(iface)) {
          continue;
        }
        const owners = (exportNameToFiles.get(iface) ?? []).filter((owner) => owner !== sourcePath);
        if (owners.length !== 1) {
          continue;
        }
        const target = owners[0]!;
        const key = dedupeKey(`file:${sourcePath}`, `file:${target}`, "implements");
        if (seen.has(key)) {
          continue;
        }
        seen.add(key);
        edges.push({
          id: edgeId(`file:${sourcePath}`, `file:${target}`, "implements"),
          from: `file:${sourcePath}`,
          to: `file:${target}`,
          kind: "implements",
          confidence: 0.7,
          evidence: [{ kind: "heuristic", ref: sourcePath, excerpt: `implements ${iface}` }],
        });
      }
    }
  }
  return edges;
}

const EXPORT_NAME = /\bexport\s+(?:declare\s+)?(?:abstract\s+)?(?:interface|type|class|enum)\s+([A-Za-z0-9_]+)/g;

export function collectExportNames(sourceFiles: ReadonlyMap<string, string>): ReadonlyMap<string, readonly string[]> {
  const out = new Map<string, string[]>();
  for (const [sourcePath, rawContent] of sourceFiles) {
    const content = stripCode(rawContent);
    EXPORT_NAME.lastIndex = 0;
    let match: RegExpExecArray | null = EXPORT_NAME.exec(content);
    while (match !== null) {
      const name = match[1];
      match = EXPORT_NAME.exec(content);
      if (name === undefined) {
        continue;
      }
      (out.get(name) ?? out.set(name, []).get(name)!).push(sourcePath);
    }
  }
  return out;
}
