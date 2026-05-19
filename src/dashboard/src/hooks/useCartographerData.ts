import { useEffect, useState } from 'react';

export interface CartographerGraph {
  readonly present: boolean;
  readonly version: string | null;
  readonly createdAt: string | null;
  readonly nodeCount: number;
  readonly edgeCount: number;
  readonly nodeKinds: Readonly<Record<string, number>>;
  readonly edgeKinds: Readonly<Record<string, number>>;
  readonly diagnosticCount: number;
}

export interface CartographerBundleRow {
  readonly id: string;
  readonly goal: string;
  readonly createdAt: string;
  readonly budget: string;
  readonly fileCount: number;
  readonly decisionCount: number;
  readonly contextTruncated: boolean;
}

export interface CartographerImpactRow {
  readonly id: string;
  readonly createdAt: string;
  readonly risk: string;
  readonly changedFileCount: number;
  readonly impactedFileCount: number;
}

export interface CartographerHookRow {
  readonly id: string;
  readonly createdAt: string;
  readonly event: string;
  readonly mode: string;
  readonly status: string;
  readonly cached: boolean;
  readonly recommendedCount: number;
  readonly executedCount: number;
}

export interface CartographerData {
  readonly graph: CartographerGraph;
  readonly bundles: readonly CartographerBundleRow[];
  readonly impact: readonly CartographerImpactRow[];
  readonly hooks: readonly CartographerHookRow[];
  readonly loading: boolean;
  readonly error: string | null;
  readonly lastUpdated: string | null;
}

const EMPTY_GRAPH: CartographerGraph = {
  present: false,
  version: null,
  createdAt: null,
  nodeCount: 0,
  edgeCount: 0,
  nodeKinds: {},
  edgeKinds: {},
  diagnosticCount: 0,
};

const DEFAULT_STATE: CartographerData = {
  graph: EMPTY_GRAPH,
  bundles: [],
  impact: [],
  hooks: [],
  loading: true,
  error: null,
  lastUpdated: null,
};

const POLL_INTERVAL_MS = 5_000;

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${url} returned ${response.status}`);
  }
  return (await response.json()) as T;
}

export function useCartographerData(): CartographerData {
  const [state, setState] = useState<CartographerData>(DEFAULT_STATE);

  useEffect(() => {
    let cancelled = false;
    const poll = async (): Promise<void> => {
      if (typeof document !== 'undefined' && document.hidden) {
        return;
      }
      try {
        const [graph, bundlesResp, impactResp, hooksResp] = await Promise.all([
          fetchJson<CartographerGraph>('/api/cartographer/graph'),
          fetchJson<{ bundles: readonly CartographerBundleRow[] }>('/api/cartographer/bundles?limit=50'),
          fetchJson<{ impact: readonly CartographerImpactRow[] }>('/api/cartographer/impact?limit=50'),
          fetchJson<{ hooks: readonly CartographerHookRow[] }>('/api/cartographer/hooks?limit=50'),
        ]);
        if (!cancelled) {
          setState({
            graph,
            bundles: bundlesResp.bundles,
            impact: impactResp.impact,
            hooks: hooksResp.hooks,
            loading: false,
            error: null,
            lastUpdated: new Date().toISOString(),
          });
        }
      } catch (error: unknown) {
        if (!cancelled) {
          setState((prev) => ({
            ...prev,
            loading: false,
            error: error instanceof Error ? error.message : 'fetch failed',
          }));
        }
      }
    };
    void poll();
    const timer = setInterval(() => void poll(), POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  return state;
}
