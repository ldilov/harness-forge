# Sentinel — what it is, in plain English

Sentinel is the part of Harness Forge that **watches your project for you,
all the time**. It looks for things that change — a new package, a failing
build, a stale config, a stuck agent — and writes them down so you can
decide what to do.

It does *not* push code, send messages, or spend money on AI calls unless
you say so. By default it only **observes**. You can turn on more
autonomy when you trust it.

## Five things to remember

1. **Always on, but cheap.** It runs on a clock you control. The default
   AI-token budget is **zero** — meaning Sentinel will never call an LLM
   on its own unless you raise the limit.
2. **Evidence first.** Every alert points at a real file, command, or
   log. No vague "something looks off".
3. **Nothing happens without permission.** When Sentinel proposes an
   action, it sits in a queue. You approve it. Then it runs in an
   isolated sandbox.
4. **You can stop it instantly.** One command flips a "panic stop" flag
   and Sentinel halts everything.
5. **You can see exactly what it did.** Every action keeps a diff, the
   commands it ran, the verification result, and a side-effect ledger
   so rollback is easy.

## What's available right now (early preview)

This is the first slice. More lands in upcoming phases.

| Feature | Status |
|---|---|
| Repo Drift Monitor (notices when key files change) | Working |
| Deduplicated observations (no duplicate noise) | Working |
| `hforge monitor` and `hforge observe` CLI | Working |
| Cadence + budget config (you control the clock and the cost) | Working |
| Default budget = 0 LLM tokens | Working |
| Hard ceiling on monitor runs per hour (`maxMonitorRunsPerHour`) | Working |
| Severity rules from YAML (`classify.severity.default` + named rules) | Working |
| Concurrent-safe state writes (in-process mutex on hot files) | Working |
| Hardened PID file (structured record, foreign-host detection, stale-PID recovery) | Working |
| **Signal correlation** (`hforge signals` — observations grouped into prioritized signals with category routing) | **Working** |
| **Signal suppression** (`hforge signals suppress <id> --until 7d \| --forever`) and resolution | **Working** |
| **Action queue** (`hforge actions` — proposed plans with risk + verification + rollback declared) | **Working** |
| **Refresh-Harness-Runtime template** (drift signal → proposed `hforge refresh` action) | **Working** |
| **Read-only autonomy** (`hforge autonomy status \| policy \| explain <action-id>`) | **Working** |
| **Full autonomy writes** (`hforge autonomy set-profile \| set-level \| panic-stop on\|off`) | **Working** |
| **5 built-in profiles** (observe, cautious, assisted, active, maintainer) | **Working** |
| **Tamper-evident approval chain** (SHA-256 hash chain on `approvals.json`; tamper detected on read) | **Working** |
| **Approve actions with scoped authority + expiry** (`hforge actions approve <id> --authority A3 --expires 2h --scope ".hforge/**"`) | **Working** |
| **Denied paths + denied commands enforced** in policy gate (defaults: `.env`, `**/secrets/**`, `npm publish`, `git push --force`, …) | **Working** |
| **Approved actions actually execute** in an isolated git worktree at `.hforge/runtime/actions/runs/<id>/worktree/` | **Working** |
| **`hforge actions run [--dry-run]`** with cross-platform command runner (timeout + AbortController + `taskkill /F /T` on Windows + POSIX process-group kill) | **Working** |
| **Sandbox env** redirects `HOME`/`USERPROFILE` to `<worktree>/.sentinel-home`; only PATH and a small allowlist pass through; `SECRET_KEY`, `AWS_ACCESS_KEY_ID`, etc. never leak in | **Working** |
| **Verification** (`hforge actions verify <id>`) — 4 of 5 check types: `command` / `file_exists` / `no_diff_outside` / `schema_valid` (agent_review skipped because LLM budget=0) | **Working** |
| **Side-effect ledger** (`hforge actions ledger`) — append-only global + per-run mirror | **Working** |
| **Rollback** (`hforge actions rollback <id>`) — `delete_worktree` strategy fully wired; manual rollback returns operator notes | **Working** |
| **`hforge actions diff <id>` and `logs <id> --stream stdout\|stderr --step N`** for forensic review | **Working** |
| **World monitor** — `hforge world watch add npm:<package>` / `runtime:nodejs:lts`, `hforge world sync` fetches real npm registry + Node.js Release schedule with ETag caching | **Working** |
| **Relevance scoring** — events for non-installed packages drop below the floor; events for direct dependencies score 1.0; everything in between is downgraded to `info` | **Working** |
| **Network policy** (`none` / `package-registry-only` / `github-only` / `allowlist` / `unrestricted`) baked into `policyFetch` | **Working** |
| **Long-running daemon** (`hforge monitor run` / `monitor stop`) — per-monitor scheduler with jitter, exponential backoff on failure, panic-stop polling each tick, signal-driven graceful drain | **Working** |
| **Crash-recovery checkpoint** — `CheckpointStore` writes phase per action; `recoverInflightRuns` flips orphans to `failed` on daemon boot | **Working** |
| **Panic-stop broadcast** — `autonomy panic-stop on` halts the daemon and aborts every in-flight executor `AbortController` within one cadence tick | **Working** |
| **Dashboard Sentinel section (8 of 8 panels)** — `hforge dashboard` renders Status, World Feed, Signals, Approval Inbox, Action Queue, Verification Results, Autonomy Posture, Agent Watchdog, Side-Effect Ledger; backed by `/api/sentinel/{status,observations,signals,actions,approvals,ledger,verification,policy,watchdog}` with a page-visibility-gated 5-second poll | **Working** |
| **Watchdog primitives** — intervention ladder (`observe → warn → constrain → pause → require_approval → terminate → rollback`), per-run state with monotonic step escalation, persisted JSONL ledger, full `hforge watchdog status / events / pause / resume / explain` CLI | **Working** |
| **`validate:sentinel` runtime gate** wired into `validate:runtime-gates` (now 7 gates) — Zod-validates default monitor + cadence + budget templates, scans for inline comments across 11 sentinel paths | **Working** |
| **Dependency Risk Monitor** — reads `package.json` + `node_modules` + the world-monitor cache; flags deprecated dependencies and major-version-available upgrades with severity tied to direct vs indirect | **Working** |
| **ADR Drift Monitor** — walks `docs/adrs/`, `docs/adr/`, and `.hforge/runtime/decisions/`; emits a signal per ADR with broken file refs, escalates to warning when 3+ refs are broken | **Working** |
| 300 unit + integration tests covering primitives, watch→correlate→propose chain, full policy-gate decision graph, tamper-evident approvals, full safe-execute → verify → rollback chain, world fetch → relevance scoring → ingestion, full daemon lifecycle, dashboard snapshot REST surface, verification + policy snapshots, watchdog state machine, the validate-sentinel gate, **and both new monitors** | Working |
| `invoke_agent` / `write_file` / `apply_patch` / `open_pr` step types, GitHub releases + security advisories adapter, **CI Failure Monitor** (needs the GitHub adapter), click-to-approve UI | Coming next |

See [getting-started.md](getting-started.md) to try the working part.

## Where to find things

| If you want to… | Read… |
|---|---|
| Try Sentinel in 60 seconds | [docs/sentinel/getting-started.md](getting-started.md) |
| Understand the design | [specs/017-sentinel/spec.md](../../specs/017-sentinel/spec.md) |
| See the build plan | [specs/017-sentinel/plan.md](../../specs/017-sentinel/plan.md) |
| See remaining work | [specs/017-sentinel/tasks.md](../../specs/017-sentinel/tasks.md) |
| Follow architecture decisions | [docs/adrs/0001-sentinel.md](../adrs/0001-sentinel.md) |

## What Sentinel is *not*

- It is not a SaaS service. Everything stays on your machine.
- It is not an alerting tool. It exists to inform decisions and
  prepare safe, reviewable actions.
- It will never auto-merge to your protected branches, auto-deploy,
  or do anything that costs real money.
