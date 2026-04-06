# Dashboard UX & Signal Pipeline Audit — Research Report

*Generated: 2026-04-06 | Sources: 30+ | Confidence: High*

---

## Executive Summary

Two critical findings:

1. **The signal pipeline is broken at 3 points.** The 37 `BehaviorEventEmitter` methods fire into the void — no listener is ever registered, no events are persisted to `events.json`, and no live events reach the `SignalAggregator`. The dashboard currently only works with pre-seeded demo data from the `seed-demo-events.mjs` script. This is the #1 blocker before any UX improvements matter.

2. **The dashboard lacks the 5 interaction patterns that research shows users value most:** synchronized crosshairs across panels, rich structured tooltips, event annotations on time-series, time range selection, and a global "session health" hero card. All are implementable with the existing React + ECharts stack.

---

## Part 1: Signal Pipeline Audit

### The 3 Breaks in the Chain

```
Subsystem ──emit*()──> BehaviorEventEmitter ──(BREAK 1)──> [no listeners]
                                                              │
                                                    [BREAK 2: no persistence to events.json]
                                                              │
DashboardServer.aggregator ──(BREAK 3)──> [handleEvent() never called with live events]
                    │
                    ├── replayEvent() works ── reads stale events.json on WS connect
                    └── broadcaster.send() works ── pushes to WS clients
```

#### Break 1: No listener is ever registered on any BehaviorEventEmitter

`emitter.onEvent(listener)` is never called anywhere in the codebase. When subsystems call `this.emitter?.emitCompaction(...)`, the event is built, `notifyListeners()` runs, iterates an empty array, and the event is silently discarded.

**Grep result:** `.onEvent(` — zero matches outside the class definition itself.

#### Break 2: No code writes BehaviorEvents to events.json

The file `.hforge/observability/events.json` is only populated by:
- `scripts/dashboard/seed-demo-events.mjs` (hardcoded demo data via `fs.writeFileSync`)
- `scripts/runtime/record-event.mjs` (manual CLI append)

Neither the `BehaviorEventEmitter` nor any listener ever writes to this file. The separate `appendEffectivenessSignal()` writes to `effectiveness-signals.json`, not `events.json`.

#### Break 3: SignalAggregator.handleEvent() is never called with live events

The `aggregator.handleEvent(event)` method is only called from `replayEvent()` during WebSocket connection setup. That replay reads the stale `events.json` from disk. Nobody calls `handleEvent()` with a freshly emitted event.

**Also missing:** There is no file watcher (`fs.watch`, `chokidar`, `FSWatcher`) on `events.json`. The dashboard does not detect changes.

### The Fix (3 pieces of code needed)

#### Fix 1: Event Persistence Listener

Create a listener that registers via `emitter.onEvent()` and appends each `BehaviorEvent` to `.hforge/observability/events.json`.

```
// Pseudo-code
const persistenceListener = (event: BehaviorEvent) => {
  appendToJsonArrayFile(eventsJsonPath, event);
};
emitter.onEvent(persistenceListener);
```

**Location:** New file `src/application/behavior/event-persistence-listener.ts`

#### Fix 2: Live Signal Bridge

Create a bridge that connects `BehaviorEventEmitter.onEvent()` → `SignalAggregator.handleEvent()` for real-time push to WebSocket clients.

```
// Pseudo-code
const liveBridge = (event: BehaviorEvent) => {
  aggregator.handleEvent(event);
};
emitter.onEvent(liveBridge);
```

**Location:** Inside `DashboardServer.start()` or a new wiring module.

#### Fix 3: CLI ↔ Dashboard Emitter Wiring

The `hforge dashboard` command needs to:
1. Create or accept a `BehaviorEventEmitter`
2. Register both the persistence listener and the live signal bridge on it
3. Pass the emitter to all subsystems that need it

The `cliEmitter` in `src/cli/index.ts` is created but never exported to the dashboard command and never has listeners attached.

**Two architectural options:**

**Option A (recommended): File-watch bridge.** The dashboard server watches `events.json` for changes. When new events are appended by any CLI command (running in a separate process), the dashboard detects the change and calls `aggregator.handleEvent()` for each new event. This decouples the CLI process from the dashboard process.

**Option B: Shared-emitter via IPC.** The CLI process and dashboard server share a single emitter instance or communicate via IPC. This requires both to run in the same process or use inter-process messaging.

Option A is simpler and more robust — it works even when the CLI and dashboard are separate processes (which they are: `hforge dashboard` runs in one terminal, `hforge install` runs in another).

---

## Part 2: Dashboard UX Enhancements

### Priority 1 — CRITICAL (fix the pipeline first)

| # | Enhancement | Effort | Impact |
|---|---|---|---|
| P1.1 | Event persistence listener (Fix 1) | Small | Required |
| P1.2 | File-watch bridge for live events (Fix 2) | Medium | Required |
| P1.3 | CLI emitter wiring (Fix 3) | Small | Required |

### Priority 2 — HIGH (most user value)

| # | Enhancement | What It Does | Effort | Sources |
|---|---|---|---|---|
| P2.1 | **Session Health Hero Card** | Top-of-page card: total events (big number), session duration, error count, events/min sparkline, 1-line status ("Healthy" / "3 warnings") | Small | Vercel, Nx Cloud |
| P2.2 | **Synchronized Crosshairs** | Hovering one time-series chart shows a vertical line + tooltip on ALL time-series charts at the same timestamp | Medium | Grafana, Datadog, New Relic |
| P2.3 | **Rich Structured Tooltips** | ECharts tooltips with: timestamp header, colored series dots, bold values, delta from previous point in green/red | Small | Datadog, PatternFly |
| P2.4 | **Event Annotations on Charts** | Vertical dashed lines on time-series for key events (compaction, rotation, errors) with hover detail | Small | Datadog Annotations |
| P2.5 | **Time Range Selector** | Dropdown in header: "Last 5m", "15m", "1h", "6h", "Full Session", "Custom" — filters ALL panels | Medium | Chronosphere, Grafana, New Relic |

### Priority 3 — MEDIUM (polish)

| # | Enhancement | What It Does | Effort | Sources |
|---|---|---|---|---|
| P3.1 | **Brush-to-Zoom** | Drag on any chart to select a time range → all charts zoom to that range | Medium | New Relic, Chronosphere |
| P3.2 | **Click-to-Filter Drill-Down** | Clicking a bar in EventDistribution filters LiveEventFeed to that event type | Small | Datadog Correlations |
| P3.3 | **Token Budget ECharts Gauge** | Replace SVG gauge with an ECharts semi-circular gauge with green/yellow/red bands | Small | Dashboard best practices |
| P3.4 | **Event Density Heatmap** | Compact heatmap: X = time, Y = event category, color intensity = event count per bucket | Medium | Brendan Gregg heatmaps |
| P3.5 | **"Now" Indicator + Auto-Scroll** | Pulsing dot at chart right edge for live sessions, auto-scroll with "Pause"/"Jump to Now" | Small | Real-time dashboard patterns |
| P3.6 | **Period-Over-Period Overlay** | "Compare Previous Session" toggle overlays faded historical data on all charts | Medium | Chronosphere, Elastic |

### Priority 4 — LOW (nice-to-have)

| # | Enhancement | What It Does | Effort |
|---|---|---|---|
| P4.1 | **Persistent Click Tooltip** | Click to pin a tooltip with a close button and "Copy" action | Small |
| P4.2 | **Task Waterfall / Gantt Timeline** | Horizontal bars showing each module's execution time range | Medium |
| P4.3 | **Mini Duration Sparklines in KPI Cards** | Each KPI card gets an inline sparkline showing its trend over time | Small |
| P4.4 | **Configurable Dashboard Layout** | Let users drag and resize panels (grid layout editor) | Large |

---

## Part 3: Tooltip Design Recommendations

### ECharts Tooltip Template (for all charts)

```typescript
tooltip: {
  trigger: 'axis',
  confine: true,
  transitionDuration: 0.1,        // snappy, not sluggish
  backgroundColor: colors.bg.card,
  borderColor: colors.border.subtle,
  textStyle: { color: colors.text.primary, fontSize: 11 },
  formatter: (params) => {
    // 1. Timestamp header (muted, small)
    // 2. Each series: colored dot + name + BOLD value
    // 3. Delta from previous point in green/red
    // Example:
    // ┌──────────────────────────────┐
    // │  10:42:15 AM                 │
    // │  ● Memory Tokens  3,200      │
    // │    ▲ +200 from previous      │
    // │  ● Budget Usage   78%        │
    // │    ▲ +3% from previous       │
    // └──────────────────────────────┘
  },
}
```

### Key Principles
- **Content hierarchy:** Timestamp → series name → value → delta
- **Positioning:** Use `tooltip.position` callback to keep above cursor in bottom half, below in top half
- **Speed:** `transitionDuration: 0.1` (100ms) — tooltips must feel instant
- **Confine:** `tooltip.confine: true` prevents overflow
- **Maximum 1-2 seconds to read** — if tooltip requires scrolling, it's too complex

---

## Part 4: Visual Encoding Recommendations

### Token Budget Gauge

Replace the current custom SVG `<Gauge>` with an ECharts gauge that imports only `GaugeChart`:

- Semi-circular (`startAngle: 200, endAngle: -20`)
- Three color bands: green (0-60%), yellow (60-85%), red (85-100%)
- Large center text with current percentage
- Subtitle: "X / Y tokens"
- Pointer shows exact position

### Severity Encoding (Triple-Channel)

Every status indicator should use **color + icon + text** simultaneously:

| Severity | Color | Icon | Example |
|---|---|---|---|
| Error/Critical | `#EF4444` (red) | Filled circle with × | ● Error: Budget exceeded |
| Warning | `#F59E0B` (amber) | Triangle with ! | ▲ Warning: Approaching limit |
| Success | `#22C55E` (green) | Checkmark | ✓ Compaction completed |
| Info | `#6B7280` (gray) | Info circle | ⓘ Context loaded |

### Event Rate Display (Big Number + Sparkline)

The pattern all sources recommend:

```
┌─────────────────────────────┐
│  42.3  events/min  ~~~╱~╲~  │
│  ▲ 12%                      │
└─────────────────────────────┘
```

Large number (32px) + direction arrow + inline sparkline (48px tall, last 60 data points) + trend delta.

---

## Sources

### Pipeline Audit (Codebase)
- `src/application/behavior/behavior-event-emitter.ts` — emitter with zero registered listeners
- `src/application/dashboard/dashboard-server.ts` — replay-only aggregator wiring
- `src/application/dashboard/signal-aggregator.ts` — handleEvent() only called via replayEvent()
- `src/application/dashboard/signal-broadcaster.ts` — WebSocket broadcast (works)
- `src/cli/index.ts` — cliEmitter created but never connected
- `src/cli/commands/dashboard.ts` — no emitter wiring
- `scripts/dashboard/seed-demo-events.mjs` — only source of events.json data

### UX Research (External)
- Grafana Tooltip Docs — tooltip modes, shared crosshairs
- Datadog Correlations, Annotations, Change Overlays — interactive dashboard patterns
- New Relic Dashboard Customization — brush-to-zoom, correlation needle
- Nx Cloud Enterprise Task Analytics — build tool dashboard gold standard
- Vercel Dashboard UX Analysis — developer-centric dashboard design
- Chronosphere Time Ranges — time range selection, click-drag zoom
- PatternFly Status & Severity — triple-encoded status indicators
- Brendan Gregg Latency Heatmaps — event density visualization
- ECharts Tooltip System (DeepWiki) — axis trigger, custom formatters, positioning
- UXPin Dashboard Design Principles — layout and information hierarchy

### Methodology
- Explored 15+ codebase files tracing the complete event pipeline
- Searched 20+ web queries across dashboard UX, tooltip design, visual encoding, time-based features
- Cross-referenced patterns across Grafana, Datadog, New Relic, Nx Cloud, Vercel, Chronosphere
- Prioritized recommendations by user impact and implementation effort
