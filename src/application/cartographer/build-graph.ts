import fs from "node:fs/promises";
import { sha256ContentHash } from "../../shared/sha256.js";
import {
  scanFileTree,
  languageForPath,
  isTestPath,
  isDocPath,
} from "../../infrastructure/cartographer/scan/file-tree-scanner.js";
import {
  extractImportSpecifiers,
  resolveRelativeImport,
  collapseCycles,
} from "../../infrastructure/cartographer/scan/ts-import-extractor.js";
import { scanPackageScripts } from "../../infrastructure/cartographer/scan/package-script-scanner.js";
import {
  deriveTestEdges,
  deriveDocumentEdges,
  deriveCommandEdges,
  deriveImplementsEdges,
  collectExportNames,
} from "../../infrastructure/cartographer/scan/edge-enrichment.js";
import { layerForPath, type GraphNode } from "../../domain/cartographer/graph/graph-node.js";
import { edgeId, type GraphEdge } from "../../domain/cartographer/graph/graph-edge.js";
import type { GraphDiagnostic, ProjectGraph } from "../../domain/cartographer/graph/project-graph.js";
import { loadDecisionRecords } from "../runtime/decision-runtime-store.js";

export interface BuildGraphResult {
  readonly graph: ProjectGraph;
}

const CODE_LANGUAGES = new Set(["typescript", "javascript"]);

export async function buildGraph(
  workspaceRoot: string,
  builderVersion: string,
  now: string,
): Promise<BuildGraphResult> {
  const files = await scanFileTree(workspaceRoot);
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const diagnostics: GraphDiagnostic[] = [];
  const indexedFiles = new Set<string>();
  const importAdjacency = new Map<string, string[]>();
  const sourceImports = new Map<string, { specifiers: readonly string[]; uncertain: boolean }>();
  const testContents = new Map<string, string>();
  const docContents = new Map<string, string>();
  const sourceContents = new Map<string, string>();

  for (const file of files) {
    const language = languageForPath(file.relativePath);
    let content = "";
    try {
      content = await fs.readFile(file.absolutePath, "utf8");
    } catch {
      diagnostics.push({
        analyzer: "file-tree-scanner",
        severity: "warning",
        message: `unreadable file skipped`,
        path: file.relativePath,
      });
      continue;
    }
    const hash = sha256ContentHash(content);
    if (isTestPath(file.relativePath)) {
      nodes.push({
        kind: "test",
        id: `test:${file.relativePath}`,
        label: file.relativePath,
        path: file.relativePath,
        tags: [],
      });
      testContents.set(file.relativePath, content);
    } else if (isDocPath(file.relativePath)) {
      nodes.push({
        kind: "doc",
        id: `doc:${file.relativePath}`,
        label: file.relativePath,
        path: file.relativePath,
        tags: [],
      });
      docContents.set(file.relativePath, content);
    } else {
      nodes.push({
        kind: "file",
        id: `file:${file.relativePath}`,
        label: file.relativePath,
        path: file.relativePath,
        language,
        sizeBytes: file.sizeBytes,
        hash,
        layer: layerForPath(file.relativePath),
        exports: [],
        imports: [],
        cyclic: false,
        tags: [],
      });
      indexedFiles.add(file.relativePath);
      sourceContents.set(file.relativePath, content);
    }
    if (language !== undefined && CODE_LANGUAGES.has(language)) {
      const extracted = extractImportSpecifiers(content);
      sourceImports.set(file.relativePath, {
        specifiers: extracted.specifiers,
        uncertain: extracted.hasDynamicUncertainty,
      });
    }
  }

  for (const [fromPath, info] of sourceImports) {
    const resolvedTargets: string[] = [];
    const seenTargets = new Set<string>();
    for (const specifier of info.specifiers) {
      const target = resolveRelativeImport(fromPath, specifier, indexedFiles);
      if (target === null || seenTargets.has(target) || !indexedFiles.has(target)) {
        continue;
      }
      seenTargets.add(target);
      resolvedTargets.push(target);
      edges.push({
        id: edgeId(`file:${fromPath}`, `file:${target}`, "imports"),
        from: `file:${fromPath}`,
        to: `file:${target}`,
        kind: "imports",
        confidence: 0.95,
        evidence: [{ kind: "file", ref: fromPath, excerpt: specifier }],
      });
    }
    importAdjacency.set(fromPath, resolvedTargets);
    if (info.uncertain) {
      diagnostics.push({
        analyzer: "ts-import-extractor",
        severity: "info",
        message: "dynamic import with non-literal specifier; downstream edges uncertain",
        path: fromPath,
      });
    }
  }

  const cyclic = collapseCycles(importAdjacency);
  for (const node of nodes) {
    if (node.kind === "file" && cyclic.get(node.path) === true) {
      node.cyclic = true;
    }
  }

  const commands = await scanPackageScripts(workspaceRoot);
  for (const command of commands) {
    nodes.push({
      kind: "command",
      id: `command:${command.name}`,
      label: command.name,
      name: command.name,
      command: command.command,
      source: "package-json",
      cost: command.cost,
      tags: [],
    });
  }

  const resolveTestImports = (fromPath: string, content: string): readonly string[] => {
    const extracted = extractImportSpecifiers(content);
    const targets: string[] = [];
    for (const specifier of extracted.specifiers) {
      const target = resolveRelativeImport(fromPath, specifier, indexedFiles);
      if (target !== null) {
        targets.push(target);
      }
    }
    return targets;
  };

  const scriptBodies = new Map<string, string>();
  try {
    const pkgRaw = await fs.readFile(`${workspaceRoot}/package.json`, "utf8");
    const pkg = JSON.parse(pkgRaw) as { scripts?: Record<string, string> };
    for (const [name, body] of Object.entries(pkg.scripts ?? {})) {
      scriptBodies.set(name, body);
    }
  } catch {
    diagnostics.push({
      analyzer: "edge-enrichment",
      severity: "info",
      message: "package.json scripts unreadable; uses-command/verifies edges skipped",
    });
  }

  const exportNames = collectExportNames(sourceContents);
  edges.push(...deriveTestEdges(testContents, resolveTestImports, indexedFiles));
  edges.push(...deriveDocumentEdges(docContents, indexedFiles));
  edges.push(...deriveCommandEdges(scriptBodies, indexedFiles));
  edges.push(...deriveImplementsEdges(sourceContents, exportNames));

  let decisionRecords: Awaited<ReturnType<typeof loadDecisionRecords>> = [];
  try {
    decisionRecords = await loadDecisionRecords(workspaceRoot);
  } catch {
    decisionRecords = [];
  }
  const REPO_PATH_RE = /(?:^|[\s"'(`])((?:src|tests?|scripts|docs|lib)\/[A-Za-z0-9._/-]+\.[A-Za-z0-9]+)/g;
  const seenDecisionEdges = new Set<string>();
  for (const record of decisionRecords) {
    if (record.status === "rejected" || record.status === "superseded") {
      continue;
    }
    const decisionNodeId = `decision:${record.id}`;
    const explicitFiles =
      record.recordType === "asr" ? record.affectedFiles.map((p) => p.replace(/\\/g, "/")) : [];
    const proseFields =
      record.recordType === "asr"
        ? [
            record.summary,
            record.problemStatement,
            ...record.drivers,
            ...record.constraints,
            ...record.risks,
            ...record.openQuestions,
            ...record.optionsToEvaluate,
          ]
        : [
            record.decisionSummary,
            record.context,
            record.decision,
            ...record.consequences,
            ...record.validationPlan,
            ...record.rolloutPlan,
            ...record.risksAndMitigations,
            ...record.followUps,
          ];
    const haystack = proseFields.join("\n");
    const scanned = new Set<string>();
    REPO_PATH_RE.lastIndex = 0;
    let pathMatch: RegExpExecArray | null = REPO_PATH_RE.exec(haystack);
    while (pathMatch !== null) {
      if (pathMatch[1] !== undefined) {
        scanned.add(pathMatch[1]);
      }
      pathMatch = REPO_PATH_RE.exec(haystack);
    }
    const targets = new Map<string, number>();
    for (const explicit of explicitFiles) {
      if (indexedFiles.has(explicit)) {
        targets.set(explicit, 0.85);
      }
    }
    for (const guessed of scanned) {
      if (indexedFiles.has(guessed) && !targets.has(guessed)) {
        targets.set(guessed, 0.6);
      }
    }
    if (targets.size === 0) {
      continue;
    }
    nodes.push({
      kind: "decision",
      id: decisionNodeId,
      label: record.title,
      title: record.title,
      status: record.status,
      sourcePath: `.hforge/runtime/decisions/${record.id}.json`,
      recordType: record.recordType,
      tags: [],
    });
    for (const [target, confidence] of targets) {
      const key = `decides:${decisionNodeId}->file:${target}`;
      if (seenDecisionEdges.has(key)) {
        continue;
      }
      seenDecisionEdges.add(key);
      edges.push({
        id: edgeId(decisionNodeId, `file:${target}`, "decides"),
        from: decisionNodeId,
        to: `file:${target}`,
        kind: "decides",
        confidence,
        evidence: [{ kind: "decision", ref: record.id, excerpt: record.title }],
      });
    }
  }

  const graph: ProjectGraph = {
    schemaVersion: 1,
    version: `graph-${now}`,
    root: workspaceRoot,
    createdAt: now,
    builderVersion,
    nodes,
    edges,
    diagnostics,
  };
  return { graph };
}
