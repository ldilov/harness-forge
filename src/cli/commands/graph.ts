import { Command } from "commander";
import { DEFAULT_WORKSPACE_ROOT } from "../../shared/index.js";
import { toJson } from "../../infrastructure/diagnostics/reporter.js";
import { buildGraph } from "../../application/cartographer/build-graph.js";
import { GraphStore } from "../../infrastructure/cartographer/graph-store.js";
import { neighbors, findNode } from "../../domain/cartographer/graph/project-graph.js";

const BUILDER_VERSION = "cartographer-1.0.0";

interface RootOption {
  readonly root: string;
}

function nodeIdFor(target: string): string[] {
  const normalized = target.replace(/\\/g, "/");
  return [
    normalized,
    `file:${normalized}`,
    `test:${normalized}`,
    `doc:${normalized}`,
    `command:${normalized}`,
  ];
}

export function registerGraphCommands(program: Command): void {
  const graph = program.command("graph").description("Cartographer+ project knowledge graph");

  graph
    .command("build")
    .description("Build or refresh the project knowledge graph")
    .option("--root <path>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--if-stale", "rebuild only when graph is missing or stale")
    .option("--full", "force a full rebuild")
    .option("--json", "machine-readable output")
    .action(async (options: RootOption & { ifStale?: boolean; json?: boolean }) => {
      const store = new GraphStore(options.root);
      if (options.ifStale === true && (await store.exists())) {
        if (options.json === true) {
          process.stdout.write(toJson({ status: "skipped", reason: "graph present and --if-stale set" }) + "\n");
        } else {
          process.stdout.write("Graph already present; --if-stale skipped rebuild.\n");
        }
        return;
      }
      const now = new Date().toISOString();
      const { graph: built } = await buildGraph(options.root, BUILDER_VERSION, now);
      await store.write(built);
      const summary = {
        status: "built",
        version: built.version,
        nodeCount: built.nodes.length,
        edgeCount: built.edges.length,
        diagnosticCount: built.diagnostics.length,
      };
      if (options.json === true) {
        process.stdout.write(toJson(summary) + "\n");
        return;
      }
      process.stdout.write(
        `Built ${summary.nodeCount} nodes, ${summary.edgeCount} edges (${summary.diagnosticCount} diagnostics).\n`,
      );
    });

  graph
    .command("status")
    .description("Show graph build status")
    .option("--root <path>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--json", "machine-readable output")
    .action(async (options: RootOption & { json?: boolean }) => {
      const store = new GraphStore(options.root);
      const current = await store.read();
      if (current === null) {
        const message = { status: "absent", hint: "run: hforge graph build" };
        process.stdout.write(options.json === true ? toJson(message) + "\n" : "No graph. Run: hforge graph build\n");
        process.exitCode = 4;
        return;
      }
      const status = {
        status: "present",
        version: current.version,
        createdAt: current.createdAt,
        nodeCount: current.nodes.length,
        edgeCount: current.edges.length,
        diagnosticCount: current.diagnostics.length,
        diagnostics: current.diagnostics,
      };
      process.stdout.write(
        options.json === true
          ? toJson(status) + "\n"
          : `Graph ${current.version}: ${status.nodeCount} nodes, ${status.edgeCount} edges.\n`,
      );
    });

  graph
    .command("inspect <target>")
    .description("Inspect a file or node and its relationships")
    .option("--root <path>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--json", "machine-readable output")
    .action(async (target: string, options: RootOption & { json?: boolean }) => {
      const store = new GraphStore(options.root);
      const current = await store.read();
      if (current === null) {
        process.stdout.write(options.json === true ? toJson({ status: "absent" }) + "\n" : "No graph.\n");
        process.exitCode = 4;
        return;
      }
      const candidateIds = nodeIdFor(target);
      const node = candidateIds.map((id) => findNode(current, id)).find((found) => found !== null) ?? null;
      if (node === null) {
        process.stdout.write(
          options.json === true ? toJson({ status: "not-found", target }) + "\n" : `Not in graph: ${target}\n`,
        );
        process.exitCode = 1;
        return;
      }
      const related = neighbors(current, node.id);
      const projection = {
        node,
        relations: related.map((edge) => ({
          kind: edge.kind,
          from: edge.from,
          to: edge.to,
          confidence: edge.confidence,
        })),
      };
      process.stdout.write(
        options.json === true
          ? toJson(projection) + "\n"
          : `${node.id} (${node.kind}) — ${related.length} relations.\n`,
      );
    });
}
