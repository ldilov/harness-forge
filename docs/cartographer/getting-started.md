# Cartographer+ in 60 seconds

This walks through the working part of Cartographer+: building the project
knowledge graph and inspecting it. No setup, no services, no tokens.

## 1. Build the graph

From your repository root:

```bash
hforge graph build
```

You will see something like:

```text
Built 412 nodes, 388 edges (2 diagnostics).
```

What just happened:

- Every source file became a **file node** (tests became **test nodes**,
  Markdown became **doc nodes**).
- Each `package.json` script became a **command node** with a rough cost tag
  (`cheap` / `medium` / `expensive`).
- Relative `import` / `export ... from` / `require` statements became
  **import edges** (a `.js` specifier resolves to its `.ts` source; a
  directory resolves to its `index.ts`).
- Files caught in an import cycle were marked `cyclic` instead of looping
  forever.
- A dynamic `import(variable)` did not crash the build — it was recorded as a
  diagnostic so you know that edge is uncertain.
- Files that look like secrets (`.env`, `*.pem`, anything matching `*secret*`)
  were skipped entirely and never written to the graph.

Want machine-readable output for an agent?

```bash
hforge graph build --json
```

```json
{
  "status": "built",
  "version": "graph-2026-05-18T16:52:42.676Z",
  "nodeCount": 412,
  "edgeCount": 388,
  "diagnostics": 2
}
```

Only rebuild when needed:

```bash
hforge graph build --if-stale   # skips if a graph already exists
hforge graph build --full       # force a full rebuild
```

## 2. Check status

```bash
hforge graph status
```

```text
Graph graph-2026-05-18T16:52:42.676Z: 412 nodes, 388 edges.
```

`--json` gives you the full diagnostics list. If no graph exists yet the
command exits with code `4` and tells you to run `hforge graph build`.

## 3. Inspect a file

```bash
hforge graph inspect src/cli/index.ts --json
```

```json
{
  "node": {
    "kind": "file",
    "id": "file:src/cli/index.ts",
    "path": "src/cli/index.ts",
    "language": "typescript",
    "layer": "cli",
    "cyclic": false
  },
  "relations": [
    { "kind": "imports", "from": "file:src/cli/index.ts", "to": "file:src/cli/commands/graph.ts", "confidence": 0.95 }
  ]
}
```

You can pass either a path (`src/cli/index.ts`) or a node id
(`file:src/cli/index.ts`). Tests, docs, and commands resolve too.

## Where the data lives

```text
.hforge/cartographer/graph/
  graph.json              full graph (validated on every read)
  nodes.jsonl             one node per line
  edges.jsonl             one edge per line
  indexes/
    by-file.json  by-command.json  by-decision.json  by-feature.json
```

All plain text. Open them, grep them, diff them — they are yours.

## 4. Compile a task context bundle (Milestone 2)

```bash
hforge context compile --goal "add an impact panel to the dashboard" --json
```

You get a bundle written to `.hforge/cartographer/context-bundles/` as both a
human-readable `.md` and a machine `.json` sidecar:

- **relevantFiles** — ranked by goal-keyword match + import proximity to any
  `--files` seeds, capped to a token budget (`--budget small|medium|large`,
  default medium). The top-ranked file is always included even if large.
- **relevantDocs / relevantDecisions** — docs whose path matches the goal, and
  decisions pulled from your **existing** ASR/ADR index through an adapter
  (Cartographer never creates a second ADR system).
- **recommendedCommands** — the project's test/build scripts as graph commands.
- **graphFreshness** — `indexedAt` plus the list of files changed since the
  last `graph build`; if anything changed you get a `stale` diagnostic and
  `contextTruncated` tells you honestly when lower-ranked files were dropped.

Secrets are redacted before anything is written, and bundle ids are validated
to prevent path traversal.

```bash
hforge context list
hforge context show <bundle-id> --json
hforge context delete <bundle-id>
```

## 5. Predict change impact (Milestone 3)

```bash
hforge impact src/shared/constants.ts --json   # one file
hforge impact --changed --json                 # git working-tree changes
hforge impact --goal "rename the runtime event schema" --json
```

You get a report (`.hforge/cartographer/impact/`) with a `risk` of
`low | medium | high | architectural`, the transitively impacted files and
modules (reverse import + `implements` BFS), recommended verification commands
(tests before build), and a suggested split for very broad changes. `--changed`
uses NUL-safe `git status -z` so renames and spaces are handled correctly.
`--goal` is **honestly labelled "predicted"** — it never claims files actually
changed and is capped below `architectural`.

## 6. Let the agent drive — the Command Broker (Milestone 4)

This is the autonomous surface. Instead of memorising every Harness Forge
command, an AI agent (Codex or Claude) calls **one** command with a lifecycle
event and the broker decides what should run:

```bash
hforge agent hook --event task.started --goal "add an impact panel" --json
hforge agent hook --event files.changed --files src/cli/index.ts --json
hforge agent hook --event task.completed --json
```

By default this is **triage-only**: the broker *recommends* commands and
returns JSON; it executes nothing. Recommendations map events to the right
Cartographer commands (graph build + context compile on `task.started`,
impact analysis on `files.changed`, etc.).

Opt the agent into autonomy with `--execute`:

```bash
hforge agent hook --event task.started --goal "add an impact panel" --execute --json
```

With `--execute` the broker runs the **auto-executable diagnostic** commands
**in-process** (graph build / context compile / impact) — it never spawns a
shell and never runs arbitrary commands. What it may do is governed by
`.hforge/agent-triggers.yaml`:

```yaml
agentTriggers:
  enabled: true
  autonomyLevel: diagnostic   # manual | diagnostic | developer | autonomous-local
  defaultJson: true
```

- `manual` — recommend only, never execute (even with `--execute`).
- `diagnostic` (default) — execute read-only/analysis commands only.
- `developer` / `autonomous-local` — reserved for later milestones.

**Loop prevention:** an identical `event + goal + files + graphVersion`
fingerprint within a cooldown window returns the cached run instead of
re-dispatching, so an agent can't spin the broker in a loop. Every dispatch is
appended to `.hforge/cartographer/agent-hooks/runs.jsonl` for audit, and
secrets are redacted before anything is written.

Cross-platform helper scripts that emit the same command plan (dry-run by
default) ship in `scripts/cartographer/hforge-agent-hook.{py,sh,ps1,mjs}` for
agents that can't call the CLI directly yet.

```bash
hforge agent hooks status   # show autonomy posture
hforge agent hooks list     # recent broker runs
hforge agent hooks test --event task.started --goal "..."
```

## 7. Richer graph edges (hardening)

`hforge graph build` now also derives, beyond `imports`:

- `tests` — a test file → the source it covers. Highest confidence (0.92)
  when the test actually imports the source; a conservative basename-mirror
  fallback (0.8) only when there's exactly one match (ambiguous and
  helper/fixture/mock files are skipped, never guessed).
- `documents` — a Markdown doc → a source file, but only from a link whose
  path actually resolves to an indexed file (0.9). Bare symbol mentions and
  broken links are ignored — no ghost edges.
- `decides` — an existing ASR/ADR decision record → the files it references
  (0.85 for explicit `affectedFiles`, 0.6 for paths found in the record body).
  Rejected/superseded decisions are skipped so impact is never inverted.
- `uses-command` / `verifies` — a source file ↔ a `package.json` script that
  names it explicitly (globs like `src/**/*.ts` are deliberately skipped).
- `implements` — a class → the file exporting the interface it implements,
  only when that owner is unambiguous (0.7).

Every derived edge carries `confidence` + `evidence` and points only at nodes
that exist. This makes context bundles and impact analysis materially sharper:
impact now follows `implements` (domain interface → infra adapter) and the
context compiler can surface the decisions and docs that bind a file.

## 8. See it in the dashboard (Milestone 6)

```bash
hforge dashboard
```

A **Cartographer+** panel shows graph node/edge counts and the edge-kind
breakdown, recent context bundles, recent impact reports, and recent
agent-hook runs. It is read-only, backed by
`/api/cartographer/{graph,bundles,impact,hooks}`, and polls every 5 seconds
only while the tab is visible (same pattern as the Sentinel panels).

## 9. Explain & PR narrative (Milestone 7)

Turn the graph + impact data into prose a human (or reviewer) can read:

```bash
hforge explain impact <impact-id>      # why these files are affected
hforge explain context <bundle-id>     # why this context bundle chose what it did
hforge explain diff                    # what the working-tree changes touch
hforge pr narrative --changed [--draft]   # PR summary / why / verification
hforge pr checklist --changed             # a verification + review checklist
```

Each command writes a Markdown + JSON pair to
`.hforge/cartographer/explanations/` and prints Markdown (or JSON with
`--json`). There is **no LLM call** — it is deterministic synthesis over the
impact report, context bundle, and graph. Output is secret-redacted,
single-line-and-size-bounded (no Markdown-structure injection from crafted
paths/commands), and the store is path-traversal-guarded like the others.

## What's next

- Deeper language analyzers (Python/Go/Rust) remain open per
  `specs/018-cartographer/plan.md`; the seven planned milestones are complete.

See [specs/018-cartographer/plan.md](../../specs/018-cartographer/plan.md) for
the full milestone order.
