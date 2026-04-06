# Dashboard P1-P4: Pipeline Fix + UX Enhancements Design

*Date: 2026-04-06*

## Problem

1. The signal pipeline is broken at 3 points — events fire into the void
2. The dashboard lacks key UX patterns that research shows users value most

## P1: Pipeline Fix (Backend)

### Architecture: File-Watch Bridge

```
CLI Process                          Dashboard Process
─────────────                        ─────────────────
Subsystem
  └─ emitter.emit*()
       └─ persistenceListener
            └─ append to events.json ──► fs.watch() detects change
                                           └─ read new events
                                                └─ aggregator.handleEvent()
                                                     └─ broadcaster.send()
                                                          └─ WebSocket → Browser
```

### New Files

**`src/application/behavior/event-persistence-listener.ts`**
- `createPersistenceListener(eventsJsonPath)` → returns `BehaviorEventListener`
- Reads JSON array, appends event immutably, writes back
- Uses async write queue to prevent concurrent file corruption

### Modified Files

**`src/application/dashboard/dashboard-server.ts`**
- `start()` → after existing setup, call `startFileWatcher()`
- `startFileWatcher()` → `fs.watch()` on events.json, debounced 200ms
- On change: read file, compare length to `lastKnownEventCount`, feed new events to `aggregator.handleEvent()`
- `ingestEvent(event)` → direct push method for same-process usage

**`src/cli/index.ts`**
- Register persistence listener on `cliEmitter` at startup
- `cliEmitter.onEvent(createPersistenceListener(eventsJsonPath))`

**CLI command files that instantiate subsystems**
- Pass `cliEmitter` (or `undefined` when no dashboard) to subsystem constructors
- Key files: `install.ts`, `compact.ts`, `init.ts` (the commands that create services)

## P2: High-Value UX (Frontend)

### New: `DashboardContext.tsx`

Shared React Context providing:
- `timeRange: { start: number; end: number } | null` — null = full session
- `hoveredTimestamp: number | null` — for cross-chart sync
- `setHoveredTimestamp(ts: number | null)` — called by any chart on mousemove
- `selectedCategory: string | null` — for click-to-filter drill-down

### New Panel: `SessionHeroCard.tsx`

Full-width hero at the very top. 4 metric columns:

| Total Events | Session Duration | Errors | Events/Min |
|---|---|---|---|
| 842 | 12m 34s | 0 ✓ | 4.2/min ~~~~ |
| +12% ▲ | live counter | red if >0 | sparkline |

### New Component: `TimeRangeSelector.tsx`

Dropdown in the dashboard header. Options:
- Last 5m, 15m, 1h, 6h, Full Session
- Stored in DashboardContext, consumed by all panels

### Modified: All 7 ECharts Panels

**Rich tooltips** (all charts):
- `trigger: 'axis'`, `confine: true`, `transitionDuration: 0.1`
- Custom formatter: timestamp header → colored dot + name + bold value + delta

**Synchronized crosshairs** (time-series charts):
- On `mousemove`: set `hoveredTimestamp` in context
- On render: if `hoveredTimestamp` is set by another chart, dispatch `showTip` action
- Charts: EventTimeline, MemoryPressure, EventRate

**Event annotations** (time-series charts):
- `markLine` with vertical dashed lines for: compaction events, memory rotation, errors
- Icon at top of line, hover shows event detail
- Charts: MemoryPressure, EventRate

**Time range filtering**:
- All panels consume `timeRange` from context
- Filter event arrays before computing chart data

## P3: Polish (Frontend)

### Brush-to-Zoom on EventTimeline

- ECharts `dataZoom` with `type: 'inside'` for scroll-wheel zoom
- Brush selection updates global `timeRange` in context
- All other panels re-filter to the brushed range

### Click-to-Filter on EventDistribution

- Clicking a bar sets `selectedCategory` in context
- LiveEventFeed auto-filters to that category
- Click again to deselect

### "Now" Indicator

- Pulsing dot SVG at right edge of MemoryPressure and EventRate
- Auto-scroll keeps "now" in view
- "Pause" toggle freezes scroll, "Jump to Now" resumes

## P4: Power User (Frontend)

### New Panel: `EventHeatmap.tsx`

- ECharts heatmap: X = time (10s buckets), Y = event category, intensity = count
- 160px tall, full-width below EventTimeline
- `visualMap` with green gradient from theme

### New Panel: `CommandWaterfall.tsx`

- Horizontal bars: `command.started` → `command.completed` as time ranges
- Color by outcome (green success, red failed)
- Shows command name, duration label
- New section "Command Activity" in the grid

### Period-Over-Period Toggle

- "Compare Previous" button in header
- Loads previous session's events.json (if exists)
- Overlays as 40% opacity dashed lines on MemoryPressure + EventRate
- Legend distinguishes "Current" vs "Previous"

## File Summary

### New Files (6)
- `src/application/behavior/event-persistence-listener.ts`
- `src/dashboard/src/state/DashboardContext.tsx`
- `src/dashboard/src/panels/SessionHeroCard.tsx`
- `src/dashboard/src/panels/EventHeatmap.tsx`
- `src/dashboard/src/panels/CommandWaterfall.tsx`
- `src/dashboard/src/components/TimeRangeSelector.tsx`

### Modified Files (~15)
- `src/application/dashboard/dashboard-server.ts` (file watcher)
- `src/cli/index.ts` (persistence listener wiring)
- `src/cli/commands/install.ts` (pass emitter)
- `src/cli/commands/compact.ts` (pass emitter)
- `src/dashboard/src/App.tsx` (context provider, new panels, layout)
- `src/dashboard/src/state/types.ts` (timeRange, hoveredTimestamp)
- `src/dashboard/src/state/reducer.ts` (timeRange action)
- `src/dashboard/src/panels/EventTimeline.tsx` (crosshair, brush-to-zoom)
- `src/dashboard/src/panels/MemoryPressure.tsx` (crosshair, annotations, now dot)
- `src/dashboard/src/panels/EventRate.tsx` (crosshair, annotations, now dot)
- `src/dashboard/src/panels/CompactionHistory.tsx` (rich tooltip)
- `src/dashboard/src/panels/BudgetBreakdown.tsx` (rich tooltip)
- `src/dashboard/src/panels/EventDistribution.tsx` (rich tooltip, click-to-filter)
- `src/dashboard/src/panels/ProfileDistribution.tsx` (rich tooltip)
- `src/dashboard/src/panels/LiveEventFeed.tsx` (consume selectedCategory from context)

## Implementation Order

1. P1: event-persistence-listener.ts → dashboard-server.ts file watcher → CLI wiring
2. P2: DashboardContext → TimeRangeSelector → SessionHeroCard → rich tooltips → crosshairs → annotations
3. P3: brush-to-zoom → click-to-filter → now indicator
4. P4: EventHeatmap → CommandWaterfall → period comparison
5. Build + verify
