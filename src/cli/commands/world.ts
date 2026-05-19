import path from "node:path";
import { Command } from "commander";
import { DEFAULT_WORKSPACE_ROOT } from "../../shared/index.js";
import { toJson } from "../../infrastructure/diagnostics/reporter.js";
import { WorldSourcesStore } from "../../infrastructure/sentinel/stores/world-store.js";
import { WorldOrchestrator } from "../../application/sentinel/world/orchestrator.js";
import { ObservationStore } from "../../infrastructure/sentinel/stores/observation-store.js";
import { SignalCorrelator } from "../../application/sentinel/classifier/correlator.js";
import { SignalStore } from "../../infrastructure/sentinel/stores/signal-store.js";
import { ActionPlanner } from "../../application/sentinel/action-planner/planner.js";
import { ActionStore } from "../../infrastructure/sentinel/stores/action-store.js";
import { parseWatchRef, watchKey } from "../../domain/sentinel/world/world-event.js";
import { isWorldObservationSource } from "../../application/sentinel/classifier/correlator.js";

interface WorldOptions {
  readonly root: string;
  readonly json?: boolean;
}

export function registerWorldCommands(program: Command): void {
  const world = program.command("world").description("Sentinel external world monitoring");

  world
    .command("sources")
    .description("List configured world sources")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--json", "json output", false)
    .action(async (options: WorldOptions) => {
      const workspaceRoot = path.resolve(options.root ?? DEFAULT_WORKSPACE_ROOT);
      const file = await new WorldSourcesStore(workspaceRoot).read();
      if (options.json) {
        console.log(toJson(file));
        return;
      }
      const totalWatches =
        file.watch.npm.length + file.watch.github.length + file.watch.runtime.length;
      console.log(`World monitor: ${file.enabled ? "enabled" : "disabled"}`);
      console.log(`Interval: ${file.intervalSeconds}s`);
      console.log(
        `Watching ${totalWatches} source(s): ` +
          `${file.watch.npm.length} npm, ${file.watch.github.length} github, ${file.watch.runtime.length} runtime`,
      );
      console.log(`Relevance floor: ${file.policies.relevanceFloor}`);
      console.log(`Max signals/run: ${file.policies.maxSignalsPerRun}`);
      if (file.watch.npm.length > 0) {
        console.log("npm:");
        for (const name of file.watch.npm) {
          console.log(`  - ${name}`);
        }
      }
      if (file.watch.runtime.length > 0) {
        console.log("runtime:");
        for (const name of file.watch.runtime) {
          console.log(`  - ${name}`);
        }
      }
      if (file.watch.github.length > 0) {
        console.log("github (adapter pending):");
        for (const name of file.watch.github) {
          console.log(`  - ${name}`);
        }
      }
    });

  const watch = world.command("watch").description("Add or remove watched sources");

  watch
    .command("add <ref>")
    .description("Add a source by ref (e.g. npm:typescript, runtime:nodejs:lts)")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .action(async (ref: string, options: WorldOptions) => {
      const workspaceRoot = path.resolve(options.root ?? DEFAULT_WORKSPACE_ROOT);
      const parsed = parseWatchRef(ref);
      if (parsed === null) {
        console.error(
          `Invalid ref '${ref}'. Use 'kind:name' where kind is one of: npm, github, security, runtime, custom.`,
        );
        process.exitCode = 1;
        return;
      }
      if (parsed.kind === "github" || parsed.kind === "security" || parsed.kind === "custom") {
        console.log(
          `Note: '${parsed.kind}' adapter is pending — the ref will be stored but not fetched until the adapter ships.`,
        );
      }
      const store = new WorldSourcesStore(workspaceRoot);
      const result = await store.addWatch(parsed);
      if (result.added) {
        console.log(`Added ${watchKey(parsed)} to world watchlist.`);
      } else {
        console.log(`${watchKey(parsed)} is already on the watchlist.`);
      }
    });

  watch
    .command("remove <ref>")
    .description("Remove a source from the watchlist")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .action(async (ref: string, options: WorldOptions) => {
      const workspaceRoot = path.resolve(options.root ?? DEFAULT_WORKSPACE_ROOT);
      const parsed = parseWatchRef(ref);
      if (parsed === null) {
        console.error(`Invalid ref '${ref}'.`);
        process.exitCode = 1;
        return;
      }
      const store = new WorldSourcesStore(workspaceRoot);
      const result = await store.removeWatch(parsed);
      if (result.removed) {
        console.log(`Removed ${watchKey(parsed)} from the world watchlist.`);
      } else {
        console.log(`${watchKey(parsed)} was not on the watchlist.`);
      }
    });

  world
    .command("sync")
    .description("Fetch from all enabled world sources once")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--source <id>", "limit to a specific source id or subject")
    .option("--json", "json output", false)
    .action(async (options: WorldOptions & { readonly source?: string }) => {
      const workspaceRoot = path.resolve(options.root ?? DEFAULT_WORKSPACE_ROOT);
      const orchestrator = new WorldOrchestrator();
      const result = await orchestrator.sync({ workspaceRoot, sourceFilter: options.source ?? null });
      const obs = new ObservationStore(workspaceRoot);
      const correlator = new SignalCorrelator(new SignalStore(workspaceRoot));
      const planner = new ActionPlanner(new ActionStore(workspaceRoot));
      const ingestedIds: string[] = [];
      const persistedObservations: import("../../domain/sentinel/observation/observation.js").Observation[] = [];
      for (const draft of result.drafts) {
        const ingest = await obs.ingest(draft);
        ingestedIds.push(ingest.observation.id);
        persistedObservations.push(ingest.observation);
      }
      const correlation = await correlator.correlate(persistedObservations);
      for (const signal of [...correlation.created, ...correlation.updated]) {
        await planner.proposeFromSignal(signal);
      }
      if (options.json) {
        console.log(
          toJson({ outcomes: result.outcomes, drafts: result.drafts.length, ingested: ingestedIds.length }),
        );
        return;
      }
      if (result.outcomes.length === 0) {
        console.log("No world sources are configured. Add one with 'hforge world watch add npm:<package>'.");
        return;
      }
      let totalEmitted = 0;
      let totalErrors = 0;
      for (const outcome of result.outcomes) {
        totalEmitted += outcome.emitted;
        totalErrors += outcome.errors.length;
        const cacheTag = outcome.fromCache ? " (304 Not Modified)" : "";
        console.log(
          `- ${outcome.source}: ${outcome.fetched} fetched, ${outcome.emitted} emitted, ${outcome.skipped} skipped, ${outcome.errors.length} error(s)${cacheTag}`,
        );
        for (const error of outcome.errors) {
          console.log(`    error: ${error}`);
        }
      }
      console.log(
        `Total: ${totalEmitted} new observations, ${ingestedIds.length} ingested, ${totalErrors} error(s).`,
      );
    });

  world
    .command("signals")
    .description("List signals derived from world sources")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--json", "json output", false)
    .option("--limit <n>", "max records", "20")
    .action(async (options: WorldOptions & { readonly limit: string }) => {
      const workspaceRoot = path.resolve(options.root ?? DEFAULT_WORKSPACE_ROOT);
      const signalStore = new SignalStore(workspaceRoot);
      const observationStore = new ObservationStore(workspaceRoot);
      const observations = await observationStore.readAll();
      const worldObservationIds = new Set(
        observations.filter((obs) => isWorldObservationSource(obs.source)).map((obs) => obs.id),
      );
      const all = await signalStore.readAll();
      const worldOnly = all.filter((signal) =>
        signal.observationIds.some((id) => worldObservationIds.has(id)),
      );
      const limit = Math.max(1, Number.parseInt(options.limit, 10));
      const sorted = [...worldOnly].sort((a, b) => b.priority - a.priority).slice(0, limit);
      if (options.json) {
        console.log(toJson({ signals: sorted }));
        return;
      }
      if (sorted.length === 0) {
        console.log("No world signals yet. Run 'hforge world sync' to fetch.");
        return;
      }
      for (const signal of sorted) {
        console.log(`[${signal.severity}] p=${signal.priority} ${signal.title}`);
        console.log(`    ${signal.summary}`);
        console.log(`    category=${signal.category} id=${signal.id}`);
      }
    });
}
