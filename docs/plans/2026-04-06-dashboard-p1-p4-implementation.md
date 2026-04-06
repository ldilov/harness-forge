# Dashboard P1-P4 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix the broken signal pipeline so events flow live to the dashboard, then add session hero card, rich tooltips, synchronized crosshairs, time range selector, event annotations, brush-to-zoom, click-to-filter, event heatmap, command waterfall, and period comparison.

**Architecture:** File-watch bridge pattern — CLI processes append events to `events.json`, the dashboard server watches the file and pushes new events through the existing aggregator → broadcaster → WebSocket pipeline. Frontend uses a shared React Context for cross-panel communication (time range, hovered timestamp, selected category).

**Tech Stack:** Node.js fs.watch, React 19 Context, ECharts 5.6, inline CSSProperties

---

## Task 1: Event Persistence Listener

**Files:**
- Create: `src/application/behavior/event-persistence-listener.ts`
- Test: `tests/unit/event-persistence-listener.spec.ts`

**Step 1: Create the persistence listener**

```typescript
// src/application/behavior/event-persistence-listener.ts
import fs from 'node:fs/promises';
import path from 'node:path';
import type { BehaviorEvent, BehaviorEventListener } from './behavior-event-emitter.js';

/**
 * Creates a listener that appends each BehaviorEvent to a JSON array file.
 * Uses a serial write queue to prevent concurrent file corruption.
 */
export function createPersistenceListener(eventsJsonPath: string): BehaviorEventListener {
  let writeQueue: Promise<void> = Promise.resolve();

  return (event: BehaviorEvent): void => {
    writeQueue = writeQueue.then(async () => {
      await fs.mkdir(path.dirname(eventsJsonPath), { recursive: true });
      let events: unknown[] = [];
      try {
        const content = await fs.readFile(eventsJsonPath, 'utf8');
        events = JSON.parse(content) as unknown[];
      } catch {
        // File doesn't exist or is empty — start fresh
      }
      const updated = [...events, event];
      await fs.writeFile(eventsJsonPath, JSON.stringify(updated, null, 2), 'utf8');
    }).catch(() => {
      // Best-effort persistence — don't crash the CLI on write failure
    });
  };
}
```

**Step 2: Write the test**

```typescript
// tests/unit/event-persistence-listener.spec.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { createPersistenceListener } from '@app/behavior/event-persistence-listener.js';
import { BehaviorEventEmitter } from '@app/behavior/behavior-event-emitter.js';

describe('createPersistenceListener', () => {
  let tmpDir: string;
  let eventsPath: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'hforge-test-'));
    eventsPath = path.join(tmpDir, '.hforge', 'observability', 'events.json');
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('creates file and appends first event', async () => {
    const listener = createPersistenceListener(eventsPath);
    const emitter = new BehaviorEventEmitter('test-session');
    emitter.onEvent(listener);

    emitter.emitCommandStarted({ command: 'install' });

    // Wait for async write queue to flush
    await new Promise((r) => setTimeout(r, 100));

    const content = await fs.readFile(eventsPath, 'utf8');
    const events = JSON.parse(content) as unknown[];
    expect(events).toHaveLength(1);
    expect((events[0] as Record<string, unknown>).eventType).toBe('command.started');
  });

  it('appends multiple events to existing array', async () => {
    const listener = createPersistenceListener(eventsPath);
    const emitter = new BehaviorEventEmitter('test-session');
    emitter.onEvent(listener);

    emitter.emitCommandStarted({ command: 'install' });
    emitter.emitCommandCompleted({ command: 'install', durationMs: 100 });

    await new Promise((r) => setTimeout(r, 200));

    const content = await fs.readFile(eventsPath, 'utf8');
    const events = JSON.parse(content) as unknown[];
    expect(events).toHaveLength(2);
  });

  it('appends to pre-existing events file', async () => {
    await fs.mkdir(path.dirname(eventsPath), { recursive: true });
    await fs.writeFile(eventsPath, JSON.stringify([{ existing: true }]), 'utf8');

    const listener = createPersistenceListener(eventsPath);
    const emitter = new BehaviorEventEmitter('test-session');
    emitter.onEvent(listener);

    emitter.emitSessionStarted({ version: '1.0.0' });

    await new Promise((r) => setTimeout(r, 100));

    const content = await fs.readFile(eventsPath, 'utf8');
    const events = JSON.parse(content) as unknown[];
    expect(events).toHaveLength(2);
    expect((events[0] as Record<string, unknown>).existing).toBe(true);
  });
});
```

**Step 3: Run tests**

```bash
npx vitest run tests/unit/event-persistence-listener.spec.ts
```

**Step 4: Commit**

```bash
git add src/application/behavior/event-persistence-listener.ts tests/unit/event-persistence-listener.spec.ts
git commit -m "feat(pipeline): add event persistence listener for writing BehaviorEvents to events.json"
```

---

## Task 2: Wire CLI Emitter to Persistence Listener

**Files:**
- Modify: `src/cli/index.ts`

**Step 1: Import and register the persistence listener on cliEmitter**

In `src/cli/index.ts`, add after the `cliEmitter` creation (around line 129):

```typescript
import { createPersistenceListener } from "../application/behavior/event-persistence-listener.js";
import { OBSERVABILITY_DIR, OBSERVABILITY_EVENTS_FILE } from "../shared/index.js";

// ... after cliEmitter is created:
const eventsJsonPath = path.join(process.cwd(), OBSERVABILITY_DIR, OBSERVABILITY_EVENTS_FILE);
cliEmitter.onEvent(createPersistenceListener(eventsJsonPath));
```

**Step 2: Pass cliEmitter to compact command's CompactionService**

In `src/cli/commands/compact.ts`, change the CompactionService instantiation from:
```typescript
const service = new CompactionService(
  path.join(workspaceRoot, ".hforge/runtime/context"),
);
```
to:
```typescript
import { cliEmitter } from '../index.js';
// ...
const service = new CompactionService(
  path.join(workspaceRoot, ".hforge/runtime/context"),
  cliEmitter,
);
```

**Step 3: Pass cliEmitter to applyInstall in install command**

In `src/cli/commands/install.ts`, find the `applyInstall(...)` call and add `cliEmitter` as the 4th argument:
```typescript
import { cliEmitter } from '../index.js';
// ...
const result = await applyInstall(workspaceRoot, plan, PACKAGE_ROOT, cliEmitter);
```

**Step 4: Run type check and tests**

```bash
npx tsc --noEmit
npx vitest run tests/contract/behavior-event-types.contract.test.ts tests/unit/event-persistence-listener.spec.ts
```

**Step 5: Commit**

```bash
git commit -m "feat(pipeline): wire CLI emitter to persistence listener and pass to subsystems"
```

---

## Task 3: Dashboard File Watcher for Live Events

**Files:**
- Modify: `src/application/dashboard/dashboard-server.ts`
- Test: `tests/unit/dashboard-server.spec.ts` (add test)

**Step 1: Add file watcher to DashboardServer**

Add these members and methods to `DashboardServer`:

```typescript
// New private members
private fileWatcher: fs.FSWatcher | null = null;
private lastKnownEventCount = 0;
private fileWatchDebounce: ReturnType<typeof setTimeout> | null = null;

// New method: start watching events.json for changes
private startFileWatcher(): void {
  const eventsPath = path.join(this.workspaceRoot, OBSERVABILITY_DIR, OBSERVABILITY_EVENTS_FILE);

  // Track how many events we've already processed
  void this.loadEvents().then((events) => {
    this.lastKnownEventCount = events.length;
  });

  const dirPath = path.join(this.workspaceRoot, OBSERVABILITY_DIR);
  try {
    this.fileWatcher = fsSync.watch(dirPath, (eventType, filename) => {
      if (filename !== OBSERVABILITY_EVENTS_FILE) return;

      // Debounce: wait 200ms for rapid writes to settle
      if (this.fileWatchDebounce) clearTimeout(this.fileWatchDebounce);
      this.fileWatchDebounce = setTimeout(() => {
        void this.processNewEvents();
      }, 200);
    });
  } catch {
    // Directory may not exist yet — that's fine, events will replay from file on connect
  }
}

private async processNewEvents(): Promise<void> {
  try {
    const allEvents = await this.loadEvents();
    const newCount = allEvents.length;
    if (newCount <= this.lastKnownEventCount) return;

    const newEvents = allEvents.slice(this.lastKnownEventCount);
    this.lastKnownEventCount = newCount;

    for (const event of newEvents) {
      this.aggregator.handleEvent(event as unknown as BehaviorEvent);
    }
  } catch {
    // File read error — ignore, will retry on next change
  }
}
```

Add `import fsSync from 'node:fs';` at the top (next to the existing `fs from 'node:fs/promises'`).

Call `this.startFileWatcher()` at the end of the `start()` method, after the server is listening.

In `stop()`, add cleanup:
```typescript
if (this.fileWatcher) {
  this.fileWatcher.close();
  this.fileWatcher = null;
}
if (this.fileWatchDebounce) {
  clearTimeout(this.fileWatchDebounce);
  this.fileWatchDebounce = null;
}
```

**Step 2: Run type check**

```bash
npx tsc --noEmit
```

**Step 3: Commit**

```bash
git commit -m "feat(pipeline): add file watcher to dashboard server for live event push"
```

---

## Task 4: DashboardContext for Cross-Panel Communication

**Files:**
- Create: `src/dashboard/src/state/DashboardContext.tsx`
- Modify: `src/dashboard/src/state/types.ts`
- Modify: `src/dashboard/src/App.tsx`

**Step 1: Add time range type to types.ts**

```typescript
// Add to src/dashboard/src/state/types.ts
export interface TimeRange {
  readonly start: number;  // epoch ms
  readonly end: number;    // epoch ms
}
```

**Step 2: Create DashboardContext.tsx**

```typescript
// src/dashboard/src/state/DashboardContext.tsx
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { TimeRange } from './types';

interface DashboardContextValue {
  readonly timeRange: TimeRange | null;       // null = full session
  readonly setTimeRange: (range: TimeRange | null) => void;
  readonly hoveredTimestamp: number | null;
  readonly setHoveredTimestamp: (ts: number | null) => void;
  readonly selectedCategory: string | null;
  readonly setSelectedCategory: (cat: string | null) => void;
}

const Context = createContext<DashboardContextValue | null>(null);

export function DashboardProvider({ children }: { readonly children: ReactNode }) {
  const [timeRange, setTimeRange] = useState<TimeRange | null>(null);
  const [hoveredTimestamp, setHoveredTimestamp] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const stableSetTimeRange = useCallback((r: TimeRange | null) => setTimeRange(r), []);
  const stableSetHoveredTimestamp = useCallback((ts: number | null) => setHoveredTimestamp(ts), []);
  const stableSetSelectedCategory = useCallback((c: string | null) => setSelectedCategory(c), []);

  return (
    <Context.Provider value={{
      timeRange,
      setTimeRange: stableSetTimeRange,
      hoveredTimestamp,
      setHoveredTimestamp: stableSetHoveredTimestamp,
      selectedCategory,
      setSelectedCategory: stableSetSelectedCategory,
    }}>
      {children}
    </Context.Provider>
  );
}

export function useDashboardContext(): DashboardContextValue {
  const ctx = useContext(Context);
  if (!ctx) throw new Error('useDashboardContext must be used within DashboardProvider');
  return ctx;
}
```

**Step 3: Wrap App.tsx in DashboardProvider**

In `App.tsx`, wrap the dashboard layout in `<DashboardProvider>`:

```tsx
import { DashboardProvider } from './state/DashboardContext';

// In the return, wrap everything after the project-selector check:
return (
  <DashboardProvider>
    <div style={layoutStyle}>
      {/* ... existing layout ... */}
    </div>
  </DashboardProvider>
);
```

**Step 4: Run type check**

```bash
cd src/dashboard && npx tsc --noEmit
```

**Step 5: Commit**

```bash
git commit -m "feat(dashboard): add DashboardContext for cross-panel time range, crosshair, and filter state"
```

---

## Task 5: Time Range Selector Component

**Files:**
- Create: `src/dashboard/src/components/TimeRangeSelector.tsx`
- Modify: `src/dashboard/src/App.tsx` (add to header)

**Step 1: Create TimeRangeSelector**

A dropdown with preset options: Last 5m, 15m, 1h, 6h, Full Session. Sets `timeRange` in context.

```tsx
// src/dashboard/src/components/TimeRangeSelector.tsx
import { type CSSProperties } from 'react';
import { colors, radius } from '../styles/theme';
import { useDashboardContext } from '../state/DashboardContext';

const presets = [
  { label: 'Last 5m', ms: 5 * 60_000 },
  { label: 'Last 15m', ms: 15 * 60_000 },
  { label: 'Last 1h', ms: 60 * 60_000 },
  { label: 'Last 6h', ms: 6 * 60 * 60_000 },
  { label: 'Full Session', ms: 0 },
] as const;

const selectStyle: CSSProperties = {
  background: colors.bg.card,
  color: colors.text.primary,
  border: `1px solid ${colors.border.subtle}`,
  borderRadius: radius.sm,
  padding: '4px 8px',
  fontSize: 11,
  cursor: 'pointer',
  outline: 'none',
};

export function TimeRangeSelector() {
  const { timeRange, setTimeRange } = useDashboardContext();

  const currentLabel = timeRange === null
    ? 'Full Session'
    : presets.find((p) => p.ms > 0 && Math.abs(Date.now() - p.ms - timeRange.start) < 60_000)?.label ?? 'Custom';

  return (
    <select
      style={selectStyle}
      value={currentLabel}
      onChange={(e) => {
        const preset = presets.find((p) => p.label === e.target.value);
        if (!preset || preset.ms === 0) {
          setTimeRange(null);
        } else {
          const now = Date.now();
          setTimeRange({ start: now - preset.ms, end: now });
        }
      }}
    >
      {presets.map((p) => (
        <option key={p.label} value={p.label}>{p.label}</option>
      ))}
    </select>
  );
}
```

**Step 2: Add to App.tsx header**

Import and place in the `headerRightStyle` div:
```tsx
import { TimeRangeSelector } from './components/TimeRangeSelector';
// ...
<div style={headerRightStyle}>
  <TimeRangeSelector />
  <ConnectionStatus state={state.connectionState} />
</div>
```

**Step 3: Commit**

```bash
git commit -m "feat(dashboard): add time range selector to header"
```

---

## Task 6: Session Hero Card

**Files:**
- Create: `src/dashboard/src/panels/SessionHeroCard.tsx`
- Modify: `src/dashboard/src/App.tsx` (add above KPI cards)

**Step 1: Create SessionHeroCard**

Full-width hero with: Total Events (big number + sparkline), Session Duration (live counter), Errors (red if >0), Events/Min (sparkline).

Key design: 4-column flex, each column is a metric with label + large value + optional trend indicator. Uses the existing `Sparkline` component.

**Step 2: Add to App.tsx before KPI Cards section**

```tsx
import { SessionHeroCard } from './panels/SessionHeroCard';
// ...
{/* Section 0: Hero Card */}
<div style={fullWidthStyle}>
  <SessionHeroCard state={state} />
</div>
```

**Step 3: Build and verify**

```bash
cd src/dashboard && npm run build
```

**Step 4: Commit**

```bash
git commit -m "feat(dashboard): add session hero card with big numbers, sparklines, and live duration"
```

---

## Task 7: Rich Tooltips on All ECharts Panels

**Files:**
- Modify: `src/dashboard/src/panels/MemoryPressure.tsx`
- Modify: `src/dashboard/src/panels/EventRate.tsx`
- Modify: `src/dashboard/src/panels/CompactionHistory.tsx`
- Modify: `src/dashboard/src/panels/BudgetBreakdown.tsx`
- Modify: `src/dashboard/src/panels/EventDistribution.tsx`
- Modify: `src/dashboard/src/panels/EventTimeline.tsx`
- Modify: `src/dashboard/src/panels/ProfileDistribution.tsx`

**Step 1: Add rich tooltip formatter to all time-series charts**

Replace the simple tooltip in each chart with a custom HTML formatter:

```typescript
tooltip: {
  trigger: 'axis',
  confine: true,
  transitionDuration: 0.1,
  backgroundColor: colors.bg.card,
  borderColor: colors.border.subtle,
  textStyle: { color: colors.text.primary, fontSize: 11 },
  formatter: (params: unknown) => {
    const items = Array.isArray(params) ? params : [params];
    const p = items[0] as { axisValueLabel?: string; data?: unknown[] };
    const time = p.axisValueLabel ?? '';
    const lines = items.map((item: any) => {
      const val = Array.isArray(item.data) ? item.data[1] : item.data;
      const colorDot = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${item.color};margin-right:4px"></span>`;
      return `<div>${colorDot}<b>${typeof val === 'number' ? val.toLocaleString() : val}</b></div>`;
    });
    return `<div style="font-size:10px;color:${colors.text.muted};margin-bottom:4px">${time}</div>${lines.join('')}`;
  },
},
```

Apply this pattern to: MemoryPressure, EventRate, CompactionHistory (with before/after), EventTimeline (with event type), EventDistribution (with count), BudgetBreakdown (with %), ProfileDistribution (with %).

**Step 2: Build and verify**

```bash
cd src/dashboard && npm run build
```

**Step 3: Commit**

```bash
git commit -m "feat(dashboard): add rich structured tooltips with content hierarchy to all ECharts panels"
```

---

## Task 8: Synchronized Crosshairs

**Files:**
- Modify: `src/dashboard/src/panels/MemoryPressure.tsx`
- Modify: `src/dashboard/src/panels/EventRate.tsx`
- Modify: `src/dashboard/src/panels/EventTimeline.tsx`

**Step 1: Add crosshair sync to time-series charts**

Each chart gets:
1. A `ref` to get the ECharts instance
2. An `onEvents` handler for `mousemove` that calls `setHoveredTimestamp`
3. A `useEffect` that dispatches `showTip` when `hoveredTimestamp` changes from another chart

Pattern for each chart:
```tsx
import { useDashboardContext } from '../state/DashboardContext';

// Inside the component:
const chartRef = useRef<ReactEChartsCore>(null);
const { hoveredTimestamp, setHoveredTimestamp } = useDashboardContext();

const onChartMouseMove = useCallback((params: any) => {
  if (params.data) {
    const ts = Array.isArray(params.data) ? params.data[0] : params.value?.[0];
    if (typeof ts === 'number') setHoveredTimestamp(ts);
  }
}, [setHoveredTimestamp]);

const onChartMouseOut = useCallback(() => {
  setHoveredTimestamp(null);
}, [setHoveredTimestamp]);

// useEffect to receive crosshair from other charts
useEffect(() => {
  const chart = chartRef.current?.getEchartsInstance();
  if (!chart || hoveredTimestamp === null) return;
  chart.dispatchAction({ type: 'showTip', seriesIndex: 0, x: /* computed */, y: 0 });
}, [hoveredTimestamp]);

// In JSX:
<ReactEChartsCore
  ref={chartRef}
  onEvents={{ mousemove: onChartMouseMove, mouseout: onChartMouseOut }}
  // ...
/>
```

**Step 2: Commit**

```bash
git commit -m "feat(dashboard): add synchronized crosshairs across time-series panels"
```

---

## Task 9: Event Annotations on Time-Series

**Files:**
- Modify: `src/dashboard/src/panels/MemoryPressure.tsx`
- Modify: `src/dashboard/src/panels/EventRate.tsx`

**Step 1: Add event annotation markLines**

Filter events for key types (compaction, rotation, errors) and add them as additional `markLine.data` entries alongside the existing threshold lines.

```typescript
// Compute annotation lines from events
const annotations = events
  .filter((e) =>
    e.eventType.includes('compaction.completed') ||
    e.eventType.includes('rotation.completed') ||
    e.eventType.endsWith('.failed') ||
    e.eventType.endsWith('.exceeded')
  )
  .slice(-10)
  .map((e) => ({
    xAxis: new Date(e.occurredAt).getTime(),
    label: {
      formatter: getCategoryEmoji(e.eventType),
      position: 'start' as const,
      fontSize: 12,
    },
    lineStyle: {
      color: e.eventType.endsWith('.failed') || e.eventType.endsWith('.exceeded')
        ? colors.accent.coral
        : colors.accent.mint,
      type: 'dashed' as const,
      opacity: 0.5,
    },
  }));

// Add to series markLine.data alongside existing threshold lines
```

**Step 2: Commit**

```bash
git commit -m "feat(dashboard): add event annotation markers on MemoryPressure and EventRate charts"
```

---

## Task 10: Click-to-Filter on EventDistribution

**Files:**
- Modify: `src/dashboard/src/panels/EventDistribution.tsx`
- Modify: `src/dashboard/src/panels/LiveEventFeed.tsx`

**Step 1: Add click handler to EventDistribution**

```tsx
const { selectedCategory, setSelectedCategory } = useDashboardContext();

const onChartClick = useCallback((params: any) => {
  const eventType = params.name as string;
  const category = getCategoryFromEventType(eventType);
  setSelectedCategory(selectedCategory === category ? null : category);
}, [selectedCategory, setSelectedCategory]);

// In JSX:
<ReactEChartsCore onEvents={{ click: onChartClick }} ... />
```

**Step 2: Consume selectedCategory in LiveEventFeed**

Import `useDashboardContext` and use `selectedCategory` as an additional filter (alongside the existing `activeCategories` chip state).

**Step 3: Commit**

```bash
git commit -m "feat(dashboard): click bar in EventDistribution to filter LiveEventFeed"
```

---

## Task 11: Event Heatmap Panel (P4)

**Files:**
- Create: `src/dashboard/src/panels/EventHeatmap.tsx`
- Modify: `src/dashboard/src/App.tsx` (add below EventTimeline)

**Step 1: Create EventHeatmap**

ECharts heatmap: X = time (10-second buckets), Y = event category, color intensity = count per bucket. Import `HeatmapChart` and `VisualMapComponent` from ECharts.

160px tall, full-width. Uses `visualMap` with continuous mapping from 0 to max, colored with the theme's green gradient.

**Step 2: Add to App.tsx below EventTimeline**

```tsx
import { EventHeatmap } from './panels/EventHeatmap';
// After EventTimeline:
<div style={fullWidthStyle}>
  <EventHeatmap events={state.events} />
</div>
```

**Step 3: Commit**

```bash
git commit -m "feat(dashboard): add event density heatmap panel"
```

---

## Task 12: Command Waterfall Panel (P4)

**Files:**
- Create: `src/dashboard/src/panels/CommandWaterfall.tsx`
- Modify: `src/dashboard/src/App.tsx` (add new section)

**Step 1: Create CommandWaterfall**

Horizontal bars showing `command.started` → `command.completed`/`command.failed` as time ranges. Uses ECharts custom series or bar chart with time-based positioning.

Color by outcome: green for `.completed`, red for `.failed`.

**Step 2: Add to App.tsx as new "Command Activity" section**

Place between KPI Cards and EventTimeline.

**Step 3: Commit**

```bash
git commit -m "feat(dashboard): add command waterfall timeline panel"
```

---

## Task 13: Time Range Filtering on All Panels

**Files:**
- Modify: All panel components that accept `events` prop

**Step 1: Create a shared filter utility**

```typescript
// In DashboardContext.tsx or a shared util:
export function filterEventsByTimeRange(
  events: readonly DashboardEvent[],
  timeRange: TimeRange | null,
): readonly DashboardEvent[] {
  if (!timeRange) return events;
  return events.filter((e) => {
    const t = new Date(e.occurredAt).getTime();
    return t >= timeRange.start && t <= timeRange.end;
  });
}
```

**Step 2: Apply in App.tsx**

Filter events once in App.tsx using the context's `timeRange`, then pass the filtered events to all panels:

```tsx
const { timeRange } = useDashboardContext();
const filteredEvents = filterEventsByTimeRange(state.events, timeRange);
// Pass filteredEvents to all panel components instead of state.events
```

**Step 3: Commit**

```bash
git commit -m "feat(dashboard): apply time range filter to all panels"
```

---

## Task 14: Period-Over-Period Comparison (P4)

**Files:**
- Create: `src/dashboard/src/components/CompareToggle.tsx`
- Modify: `src/dashboard/src/panels/MemoryPressure.tsx`
- Modify: `src/dashboard/src/panels/EventRate.tsx`

**Step 1: Add compare toggle button to header**

When toggled on, the dashboard loads the previous session's events (from a file or API endpoint) and overlays them as a faded dashed series on MemoryPressure and EventRate.

**Step 2: Add overlay series to charts**

```typescript
// Additional series for comparison:
{
  type: 'line',
  data: previousSessionData,
  lineStyle: { color: colors.text.muted, width: 1.5, type: 'dashed', opacity: 0.4 },
  areaStyle: { color: 'transparent' },
  showSymbol: false,
  silent: true,
}
```

**Step 3: Commit**

```bash
git commit -m "feat(dashboard): add period-over-period comparison overlay on time-series charts"
```

---

## Task 15: Final Build and Verify

**Step 1: Type check everything**

```bash
npx tsc --noEmit
cd src/dashboard && npx tsc --noEmit
```

**Step 2: Build dashboard**

```bash
cd src/dashboard && npm run build
```

**Step 3: Run all tests**

```bash
npx vitest run
```

**Step 4: Commit the build output**

```bash
git add src/dashboard/embedded/dashboard.html
git commit -m "chore: rebuild dashboard SPA with P1-P4 features"
```
