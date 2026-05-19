# ADR 0002 — Add Cartographer+: local project-intelligence layer

**Status**: Accepted
**Date**: 2026-05-18
**Deciders**: Lazar Dilov
**Spec**: [specs/018-cartographer/spec.md](../../specs/018-cartographer/spec.md)
**Plan**: [specs/018-cartographer/plan.md](../../specs/018-cartographer/plan.md)
**Constitution**: [.specify/memory/constitution.md](../../.specify/memory/constitution.md) v1.0.0
**Method**: Double Diamond (Discover → Define → Develop → Deliver)

## Context

Harness Forge needs a local engineering-intelligence layer that answers: what
exists, what is connected, what context a task needs, and which commands should
run around agent work. The requirement bundle
(`harness-forge-cartographer-agentic-requirements/01..14`) specifies four
capabilities: a project knowledge graph, a task context compiler, a change
impact simulator, and an agent auto-trigger command broker.

The Discover phase (multi-LLM: Codex ×2, Copilot ×2, Claude ×2) produced a
strong codebase-agnostic failure-mode catalog (barrel-export false negatives,
circular-import SCC, DI/interface edge invisibility, stale-graph context
poison, agent-loop risk, secret exfiltration) and a graph-model option space.
However, the provider agents executed with their working directory in the
Octopus orchestration plugin, not the Harness Forge repository, so their
**integration recommendations targeted the wrong codebase** and one recommended
an embedded **SQLite + TreeSitter + chokidar daemon** stack.

## Decision

1. **Storage: JSONL + atomic JSON under `.hforge/cartographer/`, not SQLite,
   no daemon, no native file-watcher dependency.** This is mandated by the
   authoritative requirements doc (`docs/10-data-storage-and-schemas.md`
   specifies the exact `graph/{graph.json,nodes.jsonl,edges.jsonl,indexes,
   versions}` layout), by Constitution Operating Constraints ("any new
   dependency MUST be justified; speculative dependencies are prohibited"), and
   by the existing Sentinel store conventions (`AtomicJsonStore`, `path-mutex`,
   `sha256`, `ulid`, `canonical-json` in `src/shared/`). The provider's SQLite
   recommendation is **rejected**: it analyzed the wrong codebase and adds a
   native dependency the requirements explicitly avoid.

2. **Reuse the existing decision system, do not duplicate it.** The existing
   `src/domain/runtime/decision-record.ts` (`DecisionIndex`, ASR + ADR) plus
   `decision-coverage.ts` / `architecture-significance.ts` remain the single
   source of truth. Cartographer+ reads them through a `DecisionProvider`
   adapter port and emits `decision` nodes + `decides` edges only.

3. **Reuse existing intelligence/impact vocabulary.** The new impact schema
   imports the existing `architectureSignificanceLevelSchema` and
   `file-interest.ts` confidence enums rather than inventing a parallel set;
   the graph builder seeds from `repo-map.ts` / `repo-intelligence.ts`.

4. **Triage-only by default.** The broker's default `autonomyLevel` is
   `diagnostic` (analysis/read-only), mirroring Sentinel's never-auto-fire
   principle. Loop prevention via an event fingerprint
   `sha256(event+goal+files+graphVersion+recentCommandSet)` with a cooldown.

5. **Clean Architecture placement** under
   `src/{domain,application,infrastructure}/cartographer/` + `src/cli/commands/`
   registered via `src/cli/index.ts`, following the Sentinel command precedent.

## Debate-gate resolution

A material provider disagreement was detected (SQLite/daemon vs JSONL).
Per the workflow's "debate only if disagreement detected" policy this would
normally trigger an adversarial debate. The disagreement is instead resolved
**by authority**: the requirements document is normative and explicitly
specifies the JSONL layout; the provider that recommended SQLite demonstrably
analyzed the wrong repository. A debate would not change the outcome, so the
gate's purpose (surface and resolve architectural risk) is satisfied by this
record without spending external debate credits.

## Broker autonomy safety (Milestone 4)

The Agent Command Broker (`hforge agent hook`) is the surface that lets an AI
agent (Codex/Claude) trigger Harness Forge work autonomously. Its safety model:

- **Triage-only default.** `autonomyLevel: diagnostic` in
  `.hforge/agent-triggers.yaml`. The broker *recommends* commands and returns
  JSON; it executes nothing unless the caller passes `--execute` AND the
  configured autonomy level permits it. `manual` disables execution entirely.
- **No shell.** `--execute` never spawns a process or shells out. It maps each
  auto-executable recommendation to an **in-process** Cartographer use-case
  (`buildGraph` / `compileContext` / `simulateImpact`) by prefix match. A
  recommendation with no in-process executor is recorded as `skipped`, never
  executed. This makes command-string injection through `goal`/`files`
  non-exploitable: the worst case is a no-op `skipped` result.
- **Loop prevention.** A `sha256(event+goal+sortedFiles+graphVersion+
  recentCommandSet)` fingerprint with a cooldown window returns the cached run
  on repeats, so an agent cannot drive the broker in a tight loop.
- **Auditable.** Every dispatch is appended to
  `.hforge/cartographer/agent-hooks/runs.jsonl` with secrets redacted; the
  fingerprint cache is an atomic JSON write.

`developer` and `autonomous-local` levels are declared but intentionally inert
in v1 (they fall back to diagnostic-equivalent behavior) — honest scoping per
Constitution Principle III; in-process write execution is a later milestone.

## Graph enrichment + dashboard (hardening)

The v1 builder emitted only `imports` edges; the remaining schema-registered
edge types are now derived in `edge-enrichment.ts` + `build-graph.ts` under a
strict ghost-free contract (an edge is emitted only when its target resolves
to an existing graph node; ambiguous heuristic matches are skipped, never
guessed):

- `tests`: import-confirmation (0.92) preferred; basename-mirror fallback
  (0.8) only on a unique match; helper/fixture/mock files excluded.
- `documents`: only resolvable Markdown link targets (0.9); bare symbol
  mentions and broken links produce nothing.
- `decides`: `decision` nodes are materialized from the existing
  `loadDecisionRecords` store (not a new ADR system); rejected/superseded
  records are skipped to avoid inverted impact; explicit `affectedFiles`
  score 0.85, body-scanned paths 0.6.
- `uses-command`/`verifies`: explicit non-glob script-path tokens only.
- `implements`: `class X implements Y` linked to the unique file exporting
  `Y` (0.7); ambiguous owners skipped.

The dashboard follows the Sentinel precedent exactly: a read-only
`CartographerSnapshotProvider`, `/api/cartographer/{graph,bundles,impact,
hooks}` GET routes with bounded `?limit`, and a 5s page-visibility-gated
React poll hook + panel. No new telemetry system is introduced; it reuses the
existing dashboard server and poll pattern.

## Explain / PR narrative (Milestone 7)

`hforge explain {impact,context,diff}` and `hforge pr {narrative,checklist}`
synthesize human-readable Markdown/JSON deterministically from the existing
impact reports, context bundles, and graph — **no LLM call**, consistent with
the zero-token default. Explanations persist to
`.hforge/cartographer/explanations/` via an `ExplanationStore` reusing the
hardened `store-safety` helpers (redaction, `assertSafeArtifactId`,
`isSafeArtifactId`, atomic writes, path-mutex). The `Explanation` Zod schema
enforces single-line, length-bounded fields and capped section/body arrays so
crafted file paths or command strings cannot inject Markdown structure or
exhaust disk; the renderer additionally collapses any residual newlines and
escapes backticks in command spans as defense-in-depth. `validate:cartographer`
now round-trips the explanation schema in addition to the graph schema.

This completes the seven planned Cartographer+ milestones.

## Consequences

- No new runtime dependency; storage is hand-inspectable and consistent with
  Sentinel, lowering operational and review surface.
- Static-only impact analysis in v1 is honest about behavioral-coupling limits
  (confidence-scored, never binary "NOT AFFECTED").
- The Discover failure-mode catalog is carried forward as the spec risk
  register and is mitigated in design (barrel-chain resolution, SCC collapse,
  `implements` edges, `graphFreshness`, fingerprint cooldown, secret redaction,
  writer lock).
- `validate:cartographer` joins `validate:runtime-gates` to machine-enforce
  Constitution Principle IV across the new paths.
