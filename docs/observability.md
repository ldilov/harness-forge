# Observability

Harness Forge keeps track of what it does — locally, on your machine, with no data sent anywhere. This helps you understand whether the harness is actually helping and spot issues early.

> [!NOTE]
> Everything stays in `.hforge/observability/` inside your project. You can inspect, delete, or back up these files anytime.

---

## Quick Start

```bash
# See a summary of what the harness has been doing
hforge observability summarize --json

# Open the real-time dashboard in your browser
hforge dashboard
```

---

## What Gets Tracked

### Behavior Events (23 types)

Every decision the harness makes — compaction, budget warnings, subagent briefs, memory rotation — is recorded as a structured event.

See the full list: **[Event Taxonomy](./observability/event-taxonomy.md)**

### Effectiveness Signals

Higher-level signals about whether recommendations were accepted, how often maintenance commands run, and whether the setup is healthy.

---

## How to See What's Happening

### Option 1: Real-Time Dashboard

```bash
hforge dashboard
```

Opens a browser with live charts, event feed, and status indicators. See **[Dashboard Guide](./dashboard.md)** for details.

### Option 2: Command Line

```bash
# Summary of effectiveness signals
hforge observability summarize --json

# Full report
hforge observability report . --json

# Effectiveness signal report (report-effectiveness)
hforge observability report-effectiveness --json

# Compare signals over time
hforge observability summarize --compare-since 2026-04-01T00:00:00Z --json
```

### Option 3: Read the Files Directly

```bash
# Raw event stream
cat .hforge/observability/events.json | python -m json.tool

# Effectiveness summary
cat .hforge/observability/summary.json | python -m json.tool
```

---

## Files

| File | What's in it |
|------|-------------|
| `.hforge/observability/events.json` | All behavior events (append-only JSON array) |
| `.hforge/observability/summary.json` | Aggregated effectiveness metrics |
| `.hforge/state/install-state.json` | What was installed and when |
| `.hforge/runtime/context-budget.json` | Current token budget state |

---

## Design Principles

- **No external services** — everything stays on your machine
- **No opt-in required** — tracking happens automatically
- **Inspectable** — all data is plain JSON you can read
- **Deletable** — remove any file and the harness keeps working
- **Streamable** — the dashboard consumes events via WebSocket for real-time visibility

---

## Related Docs

- [Dashboard Guide](./dashboard.md) — real-time browser dashboard
- [Event Taxonomy](./observability/event-taxonomy.md) — all 23 event types with payloads
- [Benchmark Authoring](./observability/benchmark-authoring.md) — writing benchmark expectations
- [Eval Model](./observability/eval-model.md) — evaluation framework
