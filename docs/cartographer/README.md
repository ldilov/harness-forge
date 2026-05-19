# Cartographer+ — what it is, in plain English

Cartographer+ is the part of Harness Forge that **draws a map of your project
and keeps it current**. It answers four everyday questions for you and for AI
agents:

1. What exists in this repository?
2. What is connected to what?
3. What context does this task actually need?
4. Which commands should run before, during, and after the work?

It does **not** make decisions for you, change your code on its own, or call an
LLM by itself. Where Sentinel watches and warns, Cartographer+ **explains**:
what a change touches, and what an agent needs to read to act safely.

## Five things to remember

1. **Local and inspectable.** Everything lives under `.hforge/cartographer/`
   as plain JSON and JSONL you can open and read. No database, no daemon, no
   background process.
2. **Reuses what you already have.** It does not create a second ADR system —
   it links your existing decision records. It builds on the existing impact
   and repo-intelligence types instead of duplicating them.
3. **Evidence first.** Every connection it draws carries a confidence score and
   the evidence behind it. Impact is never a flat "not affected" — it is always
   confidence-scored and honest about what static analysis can miss.
4. **Safe by default.** The agent command broker only *recommends* by default
   (`diagnostic` mode). It never auto-runs write commands unless you opt in.
5. **Secrets stay home.** Files that look like secrets (`.env`, `*.pem`,
   `*secret*`) are never indexed, and bundles are redacted before anything
   leaves the process.

## What works right now (early preview)

| Capability | Status |
|---|---|
| Project knowledge graph: file / test / doc / command nodes | Working |
| Import edges for TypeScript/JavaScript (relative resolution) | Working |
| Barrel/`.js`→`.ts` resolution + circular-import (SCC) collapse | Working |
| Dynamic-import uncertainty recorded as a diagnostic (no crash) | Working |
| Secret-like file exclusion during scan | Working |
| Architecture-layer tagging from `src/<layer>/` convention | Working |
| `package.json` script discovery as command nodes with cost tags | Working |
| JSONL store (`nodes.jsonl`/`edges.jsonl`) + atomic `graph.json` + indexes | Working |
| Concurrent-safe graph writes (path-mutex writer lock) | Working |
| `hforge graph build [--if-stale\|--full] [--json]` | Working |
| `hforge graph status [--json]` | Working |
| `hforge graph inspect <path> [--json]` | Working |
| `validate:cartographer` gate (schemas + no-inline-comment scan) wired into `validate:runtime-gates` | Working |
| **Task Context Compiler**: `hforge context compile --goal` → ranked Markdown + JSON bundle | **Working** |
| Goal-keyword + import-proximity ranking, token-budget tiers (small/medium/large), at-least-one guarantee | Working |
| Decision links via a `DecisionProvider` adapter over the existing ASR/ADR index (no second ADR system) | Working |
| Graph-freshness markers (`contextTruncated`, modified-since-index list) + stale diagnostics | Working |
| Secret redaction (sk-/sk-ant-/sk-proj-/gh_/AKIA/JWT) + path-traversal-hardened bundle ids | Working |
| `hforge context compile \| show \| list \| delete` | Working |
| **Change Impact Simulator**: `hforge impact <file> \| --files \| --changed \| --diff \| --goal` | **Working** |
| Reverse-edge BFS (imports + implements), risk tiers low/medium/high/architectural | Working |
| `--goal` is honestly labelled *predicted* (speculative) and capped below architectural | Working |
| Git working-tree changes via NUL-safe `git status -z` (rename/space-safe), diff parsing, suggested split | Working |
| `hforge impact show <id>` + MD/JSON reports under `.hforge/cartographer/impact/` | Working |
| **Agent Command Broker**: `hforge agent hook --event <e>` — one call, the broker picks the right Harness Forge commands | **Working** |
| **Autonomous (opt-in) execution**: `--execute` runs auto-executable *diagnostic* commands in-process (graph/context/impact) — never spawns a shell, gated by `autonomyLevel` | **Working** |
| Triage-only by default (`autonomyLevel: diagnostic`); `manual` disables execution entirely | Working |
| Loop prevention: identical event+goal+files+graph fingerprint within a cooldown returns the cached run | Working |
| `.hforge/agent-triggers.yaml` config (Zod-validated) + append-only `agent-hooks/runs.jsonl` audit | Working |
| `hforge agent hooks status \| list \| test` + cross-platform helper scripts (py/sh/ps1/mjs, dry-run default) | Working |
| **Enriched graph edges**: `tests` (import-confirmed 0.92 / basename-mirror 0.8), `documents` (resolvable markdown links 0.9), `decides` (decision-record file refs 0.85/0.6, skips rejected/superseded), `uses-command` + `verifies` (non-glob script paths), `implements` (class→interface-owning file 0.7) | **Working** |
| Every enriched edge is ghost-free (target must be an existing node), confidence + evidence stamped, ambiguous matches skipped | Working |
| `decision` nodes materialized from the existing ASR/ADR store (no second ADR system) | Working |
| **Dashboard (Milestone 6)**: `/api/cartographer/{graph,bundles,impact,hooks}` REST + a Cartographer panel with a 5s page-visibility-gated poll, mirroring the Sentinel dashboard precedent | **Working** |
| **Explain / PR narrative (Milestone 7)**: `hforge explain impact \| context \| diff`, `hforge pr narrative [--draft] \| checklist` — human-readable Markdown/JSON synthesized from the graph + impact + bundles (no LLM) | **Working** |
| Explanations stored under `.hforge/cartographer/explanations/` (MD+JSON, secret-redacted, single-line/size-bounded, path-traversal-guarded) | Working |

## Where to find things

| If you want to… | Read… |
|---|---|
| Try it in 60 seconds | [getting-started.md](getting-started.md) |
| Understand the design | [specs/018-cartographer/spec.md](../../specs/018-cartographer/spec.md) |
| See the build plan | [specs/018-cartographer/plan.md](../../specs/018-cartographer/plan.md) |
| See the CLI contract | [specs/018-cartographer/contracts/cli.md](../../specs/018-cartographer/contracts/cli.md) |
| Follow the architecture decision | [docs/adrs/0002-cartographer.md](../adrs/0002-cartographer.md) |

## What Cartographer+ is *not*

- Not a second ADR system — it links your existing decisions, never replaces them.
- Not a monitor or security tool — that is Sentinel.
- Not a networked service — all state is local.
- Not a runtime tracer — v1 impact analysis is static and says so honestly.
