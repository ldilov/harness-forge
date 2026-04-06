# Event Flow, State Editing, and History — Research Report

*Generated: 2026-04-06 | Sources: 20+ | Confidence: High*

---

## Executive Summary

The P1 pipeline fix (persistence listener + file watcher) works for the **happy path** (same directory, single process), but the audit found **6 remaining gaps** including a critical path mismatch when using `--root`, missing emitter wiring in `bootstrap` and `init` commands, and a broken file watcher after project switch. State file editing via the dashboard UI is **viable and valuable** if done through a validate-then-write API (never direct file I/O). Historical event recording is **essential** and should use session-indexed NDJSON files with a lightweight session index for fast startup prefill.

---

## Part 1: Event Flow Audit — 6 Remaining Gaps

### The Happy Path Works

When both the CLI and dashboard run from the **same directory** with no `--root` override:

```
hforge install --target codex    →  writes events to {CWD}/.hforge/observability/events.json
hforge dashboard                  →  watches {CWD}/.hforge/observability/events.json
```

Events flow: subsystem → emitter → persistence listener → events.json → fs.watch → aggregator → broadcaster → WebSocket → browser. ✅

### Gap 1 (P1 CRITICAL): `eventsJsonPath` ignores `--root`

In `cli/index.ts` line 134:
```typescript
const eventsJsonPath = path.join(process.cwd(), OBSERVABILITY_DIR, OBSERVABILITY_EVENTS_FILE);
```

This is computed at **module load time** from `process.cwd()`, NOT from the `--root` option. If a user runs:
```bash
cd ~
hforge install --root /projects/my-app --target codex
```

Events are written to `~/.hforge/observability/events.json` — but the dashboard watching `/projects/my-app/.hforge/observability/events.json` never sees them.

**Fix:** Defer the persistence listener creation until after `--root` is resolved. Or compute the path from the resolved workspace root in each command handler.

### Gap 2 (P2): `bootstrap` command drops ALL events

`bootstrapWorkspace()` at `src/application/install/bootstrap-workspace.ts` calls:
- `discoverWorkspaceTargets(root)` — no emitter (line 86)
- `applyInstall(root, plan)` — no emitter (line 159)

Bootstrap is a major user workflow (interactive setup) and is completely invisible to the dashboard.

**Fix:** Pass `cliEmitter` into `bootstrapWorkspace()` and forward to both calls.

### Gap 3 (P2): `init` command drops ALL events

`init.ts` does not import `cliEmitter` and does not pass it to `applySetupIntent()` or `initializeWorkspace()`.

**Fix:** Import and pass `cliEmitter` in `init.ts`.

### Gap 4 (P3): No cross-process file locking

Two simultaneous CLI processes doing read-modify-write on `events.json` will race. One write can overwrite the other's appended event.

**Fix:** Either use an append-only NDJSON format (no read-modify-write cycle), or use `fs.appendFile` with `O_APPEND` flag for atomic appends.

### Gap 5 (P3): Effectiveness signals are invisible

Commands like `doctor`, `audit`, `refresh`, `flow`, `sync` write to `effectiveness-signals.json` — a completely separate file the dashboard never reads.

**Fix:** Either merge these into `events.json` as BehaviorEvents, or add a second file watcher for effectiveness signals.

### Gap 6 (P4): File watcher breaks on project switch

When the dashboard handles `/api/switch`, it updates `this.workspaceRoot` but does NOT restart `startFileWatcher()`. The old watcher keeps watching the **previous** project's directory.

**Fix:** In `handleProjectSwitch()`, close the old watcher and call `startFileWatcher()` again.

---

## Part 2: State File Editing via Dashboard UI — VIABLE

### Which Files Are Editable?

From the `.hforge/` directory audit, these config files are user-editable and would benefit from dashboard editing:

| File | Purpose | Why Edit? |
|---|---|---|
| `memory-policy.json` | Memory rotation thresholds | Tune when rotation triggers |
| `context-budget.json` | Token budget allocation | Adjust budget limits |
| `output-policy.json` | Output formatting rules | Change verbosity |
| `selected-profile.json` | Active install profile | Switch profiles |
| `load-order.json` | Context file load priority | Reorder sources |

### Recommended Architecture: Validate-Then-Write API

Based on research across Grafana, VS Code, Airbnb's Sitar, and AWS AppConfig:

**NEVER** expose direct file I/O from the web UI. Instead:

1. **REST API endpoints** on the dashboard server:
   - `GET /api/config/:name` — read a config file (from allow-list)
   - `PUT /api/config/:name` — validate against JSON Schema, diff against current, write atomically
   - `GET /api/config/:name/schema` — return the Zod/JSON Schema for the editor

2. **Allow-list of editable files** — hard-coded server-side, never accept arbitrary paths from the client

3. **Validate-preview-write-rollback pipeline:**
   - Parse the incoming JSON
   - Validate against the existing Zod schema (e.g., `MemoryPolicySchema`, `ContextBudgetSchema`)
   - Diff against current file and return preview
   - Write atomically (temp file → rename)
   - Keep previous version as `.bak` for rollback

4. **Frontend editor options:**
   - **Structured form** (VS Code Settings Editor pattern) — labeled fields, sliders for thresholds, dropdowns for enums
   - **Raw JSON fallback** — Monaco-style editor with schema validation (but Monaco is too heavy for single-file SPA; a simple `<textarea>` with syntax highlighting via Prism.js or hand-rolled is better)

### Security: Minimal Risk for Localhost Dashboard

Since the dashboard binds to `127.0.0.1` only and is a developer tool:
- No remote attack surface
- The allow-list prevents path traversal
- Schema validation prevents malformed config
- Atomic write prevents corruption

---

## Part 3: Historical Event Recording + Dashboard Prefill — ESSENTIAL

### Current State

Events are stored in a **single JSON array file** (`events.json`). This has problems:
- Each write does a full read-parse-append-serialize-write cycle (O(n) per event)
- No session boundaries — all events from all sessions are in one flat array
- No rotation — the file grows forever
- No index — dashboard must read the entire file on connect

### Recommended Architecture

Based on Langfuse, NXLog, and structured logging best practices:

#### 1. Switch to NDJSON (Newline-Delimited JSON)

Instead of a JSON array, use append-only NDJSON:
```
{"eventId":"bevt_abc","eventType":"command.started",...}\n
{"eventId":"bevt_def","eventType":"command.completed",...}\n
```

Benefits:
- **O(1) append** — `fs.appendFile()`, no read-modify-write
- **No cross-process race** — `O_APPEND` is atomic on most filesystems
- **Streaming read** — read line by line, don't parse entire file
- The NDJSON `EventEmitter` at `src/infrastructure/events/event-emitter.ts` already uses this format!

#### 2. Organize by Session

Each session writes to its own file:
```
.hforge/observability/
  sessions/
    session-2026-04-06T10-42-00-cli_abc123.ndjson
    session-2026-04-06T11-15-00-cli_def456.ndjson
  session-index.json    ← lightweight index
```

The **session-index.json** contains metadata only:
```json
[
  { "sessionId": "cli_abc123", "startedAt": "...", "eventCount": 47, "commands": ["install"], "status": "completed" },
  { "sessionId": "cli_def456", "startedAt": "...", "eventCount": 12, "commands": ["compact"], "status": "completed" }
]
```

#### 3. Dashboard Startup Prefill

On connect:
1. Read `session-index.json` (lightweight, <1KB typically)
2. Show session list in dashboard sidebar or hero card
3. Read the **current session's** NDJSON file and replay events
4. Optionally load previous sessions on demand ("Load Previous Session")

#### 4. Retention: 7 Days Default

- On startup, scan session files and delete those older than 7 days
- Configurable via `memory-policy.json` or a new `observability-policy.json`
- Follows NXLog's severity-tiered model and Langfuse's minimum 3-day retention

#### 5. Backward Compatibility

Keep reading `events.json` (JSON array format) if it exists, for backward compatibility with the current system. New events go to NDJSON files. Migrate fully in a future version.

### Implementation Impact

| Change | Effort | Files |
|---|---|---|
| NDJSON persistence listener (replace JSON array) | Small | `event-persistence-listener.ts` |
| Session-scoped file naming | Small | `event-persistence-listener.ts`, `cli/index.ts` |
| Session index writer | Medium | New `session-index.ts` |
| Dashboard reads NDJSON on connect | Medium | `dashboard-server.ts` |
| File watcher for NDJSON directory | Small | `dashboard-server.ts` |
| Retention cleanup on startup | Small | `dashboard-server.ts` or new `event-cleanup.ts` |
| Dashboard session list UI | Medium | New `SessionList.tsx` panel |

---

## Key Takeaways

1. **Fix the `--root` path mismatch FIRST** — this is a real bug that will confuse users who don't run commands from the project root

2. **Wire `cliEmitter` into `bootstrap` and `init` commands** — these are the most common user workflows and currently emit zero events

3. **State file editing is viable** via a validate-then-write REST API with an allow-list of editable files; use the existing Zod schemas for validation

4. **Switch event storage to NDJSON** — eliminates the read-modify-write race condition, enables O(1) appends, and matches the existing `EventEmitter` infrastructure

5. **Add a session index** for fast dashboard prefill without reading all historical events

6. **Restart the file watcher on project switch** — current implementation breaks live streaming after switching

---

## Sources

### Codebase Audit
- `src/cli/index.ts` lines 128-134 — persistence listener path computation
- `src/application/install/bootstrap-workspace.ts` lines 86, 159 — missing emitter in bootstrap
- `src/cli/commands/init.ts` — missing cliEmitter import
- `src/application/dashboard/dashboard-server.ts` lines 139-169 — file watcher and project switch
- `src/shared/constants.ts` — all .hforge/ path constants

### External Research
- Grafana Provisioning & Git Sync — config-as-code patterns
- VS Code Settings Editor — dual-mode JSON editing
- Airbnb Sitar — validate-preview-write-rollback pipeline
- AWS AppConfig — dynamic config management
- OWASP Path Traversal — security mitigations
- Langfuse Sessions & Data Model — session-organized event storage
- NXLog Log Rotation — retention and rotation patterns
- SigNoz Log Retention Best Practices — tiered retention
