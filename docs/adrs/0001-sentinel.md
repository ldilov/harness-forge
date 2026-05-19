# ADR 0001 — Add Sentinel: governed autonomous monitoring layer

**Status**: Accepted
**Date**: 2026-05-05
**Deciders**: Lazar Dilov
**Spec**: [specs/017-sentinel/spec.md](../../specs/017-sentinel/spec.md)
**Plan**: [specs/017-sentinel/plan.md](../../specs/017-sentinel/plan.md)
**Constitution**: [.specify/memory/constitution.md](../../.specify/memory/constitution.md) v1.0.0

## Context

Harness Forge today is reactive — it equips agents and learns from
sessions, but it does not watch the project on its own. Operators
have to remember to refresh runtime, check for stale generated
artifacts, notice CI regressions, and audit dependency drift. As
projects grow this becomes the bottleneck.

A growing class of tools attempt full autonomy without guardrails
and lose user trust the first time they make a costly mistake. We
need something between "off" and "do whatever it wants".

## Decision

We introduce **Sentinel**, a continuously-running, governed
autonomy layer with the following non-negotiables:

- **Always on by default** in installed workspaces (cautious profile).
- **Deterministic-only by default** — `llmTokens.dailyBudget = 0`.
- **Configurable cadence per monitor** plus a global ceiling.
- **Approval-gated actions** with explicit authority levels
  (A0..A5), denied paths, and denied commands.
- **Sandboxed execution** in isolated git worktrees only.
- **Mandatory verification** before an action is marked completed.
- **Side-effect ledger** for every mutation, with rollback for
  reversible local changes.
- **One canonical source of state** under `.hforge/`, no parallel
  runtime.

## Consequences

Positive:

- Operators get an audit trail of every change, decision, and budget
  spend without paying token cost they did not approve.
- The Living Loop now has a reliable signal source for adaptations.
- Agents can be paused or rolled back when their behavior degrades.
- Six constitution principles are mechanically enforced (see
  [plan.md §2](../../specs/017-sentinel/plan.md)).

Negative / costs:

- New surface area: 7 new CLI groups, 8 new dashboard panels, 9
  new JSON schemas.
- New runtime gate (`validate:sentinel`) extends release validation.
- A no-inline-comment scanner is added for Sentinel paths — first
  mechanical enforcement of Constitution Principle IV.

## Alternatives considered

- **External monitoring product (e.g., Datadog, Sentry)**. Rejected:
  Harness Forge is local-first and an external SaaS dependency
  contradicts the canonical-layer principle.
- **Plain cron jobs invoking existing CLI commands**. Rejected: no
  budget bookkeeping, no panic stop, no shared dedup.
- **A separate CLI binary**. Rejected: doubles install surface and
  duplicates command-discovery logic.

## Implementation notes

Phased delivery (P1..P7) per spec §13. The first slice — Repo Drift
Monitor + observation engine + dedupe + `monitor`/`observe` CLI +
deterministic budget — is implemented and shipped behind the
existing CLI in this commit. Remaining phases tracked in
[tasks.md](../../specs/017-sentinel/tasks.md).

### Cross-cutting decisions made during the first slice

- **In-process file-keyed mutex.** `src/shared/path-mutex.ts` exposes
  `withPathLock(filePath, fn)`. `AtomicJsonStore` uses it for `write` and
  `update`; `ObservationStore.ingest` wraps the read-modify-write of
  `fingerprints.json` with it. A `writeWithinLock` escape hatch exists for
  callers that already hold the lock. Cross-process advisory locking is not
  in this slice and is a prerequisite for daemon mode.
- **Hardened PID file.** `acquirePidFile` writes a structured record
  `{pid, startedAt, hostname, workspaceRoot}`. `classifyPidLiveness` returns
  `alive | dead | foreign-host | indeterminate`; foreign-host and
  indeterminate are treated as busy. First concrete mitigation for the
  Windows PID-recycling concern raised in code review.
- **Cadence enforcement.** `BudgetGuard` exposes `decideMonitorRun` and
  `decideExternalRequest` in addition to `decideTokens` and `decideAction`.
  `MonitorRunner.runOnce` consults `decideMonitorRun` against the rolling
  per-hour count from `cadence-ledger.jsonl` and skips with reason
  `monitor_runs_per_hour_exhausted` when the ceiling is hit.
- **Classify rules in YAML are honored.** `MonitorClassifySchema` declares
  `severity: { default?: Severity, [key: string]: Severity }`. The runner
  applies `applyClassifyRule(monitor.classify, draft.classifyKey,
  draft.severity)` before persistence. Repo-Drift uses
  `classifyKey: "manifest_changed"` to pick up `warning` from the bundled
  template.
- **NFR-020 honesty.** JSONL append paths (observations, monitor-runs,
  cadence-ledger) are append-only but not `fsync`'d on every record. Read
  NFR-020 as "atomic for snapshot files; durable on flush for log files".
- **Test discipline.** 73 vitest cases (14 files) ship with the slice,
  covering primitives, registry, runner, dedup, classify rules, panic stop,
  cadence enforcement, PID lifecycle, and the baseline-then-drift integration
  cycle. The full repo suite still passes (1154 / 1154 of pre-existing tests
  + 73 new = 1227 green; one unrelated pre-existing target-support snapshot
  failure remains and is not introduced by this work).
