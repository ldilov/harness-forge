import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { TimeRange } from './types';

interface DashboardContextValue {
  readonly timeRange: TimeRange | null;
  readonly setTimeRange: (range: TimeRange | null) => void;
  readonly hoveredTimestamp: number | null;
  readonly setHoveredTimestamp: (ts: number | null) => void;
  readonly selectedCategory: string | null;
  readonly setSelectedCategory: (cat: string | null) => void;
  readonly compareMode: boolean;
  readonly setCompareMode: (on: boolean) => void;
}

const Context = createContext<DashboardContextValue | null>(null);

export function DashboardProvider({ children }: { readonly children: ReactNode }) {
  const [timeRange, setTimeRange] = useState<TimeRange | null>(null);
  const [hoveredTimestamp, setHoveredTimestamp] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState(false);

  const stableSetTimeRange = useCallback((r: TimeRange | null) => setTimeRange(r), []);
  const stableSetHoveredTimestamp = useCallback((ts: number | null) => setHoveredTimestamp(ts), []);
  const stableSetSelectedCategory = useCallback((c: string | null) => setSelectedCategory(c), []);
  const stableSetCompareMode = useCallback((on: boolean) => setCompareMode(on), []);

  return (
    <Context.Provider value={{
      timeRange,
      setTimeRange: stableSetTimeRange,
      hoveredTimestamp,
      setHoveredTimestamp: stableSetHoveredTimestamp,
      selectedCategory,
      setSelectedCategory: stableSetSelectedCategory,
      compareMode,
      setCompareMode: stableSetCompareMode,
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

export function filterEventsByTimeRange<T extends { readonly occurredAt: string }>(
  events: readonly T[],
  timeRange: TimeRange | null,
): readonly T[] {
  if (!timeRange) return events;
  return events.filter((e) => {
    const t = new Date(e.occurredAt).getTime();
    return t >= timeRange.start && t <= timeRange.end;
  });
}
