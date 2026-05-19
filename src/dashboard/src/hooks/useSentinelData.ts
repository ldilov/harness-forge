import { useEffect, useState } from 'react';

export interface SentinelStatus {
  readonly daemon: {
    readonly running: boolean;
    readonly pid: number | null;
    readonly hostname: string | null;
    readonly startedAt: string | null;
    readonly workspaceRoot: string | null;
  };
  readonly profile: {
    readonly name: string;
    readonly defaultLevel: string;
  };
  readonly cadence: {
    readonly panicStop: boolean;
    readonly maxMonitorRunsPerHour: number;
    readonly maxActionsPerHour: number;
  };
  readonly budget: {
    readonly llmTokensDaily: number;
    readonly npmRequestsPerHour: number;
    readonly githubRequestsPerHour: number;
  };
  readonly usage: {
    readonly monitorRunsLastHour: number;
    readonly actionsProposedLastHour: number;
    readonly panicTogglesLastHour: number;
  };
  readonly counts: {
    readonly observations: number;
    readonly signals: number;
    readonly actions: number;
    readonly ledgerEntries: number;
  };
}

export interface SentinelSignal {
  readonly id: string;
  readonly observationIds: readonly string[];
  readonly category: string;
  readonly title: string;
  readonly summary: string;
  readonly priority: number;
  readonly severity: 'info' | 'notice' | 'warning' | 'critical';
  readonly recommendedIntent?: string;
  readonly confidence: number;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly status: 'open' | 'suppressed' | 'actioned' | 'resolved';
  readonly fingerprint: string;
}

export interface SentinelAction {
  readonly id: string;
  readonly title: string;
  readonly reason: string;
  readonly sourceSignalIds: readonly string[];
  readonly proposedBy: string;
  readonly authorityRequired: string;
  readonly status: string;
  readonly dryRun: boolean;
  readonly risk: {
    readonly level: 'low' | 'medium' | 'high' | 'critical';
    readonly reasons: readonly string[];
    readonly touchedTargets: readonly string[];
    readonly reversible: boolean;
    readonly requiresHumanApproval: boolean;
  };
  readonly steps: readonly { readonly type: string }[];
  readonly verification: {
    readonly required: readonly { readonly type: string }[];
  };
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface SentinelLedgerEntry {
  readonly id: string;
  readonly actionPlanId: string;
  readonly kind: string;
  readonly target: string;
  readonly reversible: boolean;
  readonly rollbackCommand?: string | null;
  readonly createdAt: string;
}

export interface SentinelObservation {
  readonly id: string;
  readonly source: string;
  readonly kind: string;
  readonly severity: 'info' | 'notice' | 'warning' | 'critical';
  readonly subject: string;
  readonly summary: string;
  readonly fingerprint: string;
  readonly confidence: number;
  readonly occurrenceCount?: number;
  readonly firstSeenAt?: string;
  readonly lastSeenAt?: string;
  readonly detectedAt: string;
}

export interface SentinelApprovalEntry {
  readonly id: string;
  readonly actionPlanId: string;
  readonly approvedBy: string;
  readonly approvedAt: string;
  readonly authorityGranted: string;
  readonly expiresAt: string | null;
  readonly scope: readonly string[];
  readonly revokedAt: string | null;
}

export interface SentinelVerificationCheck {
  readonly type: string;
  readonly status: 'passed' | 'failed' | 'skipped';
  readonly command?: string;
  readonly summary?: string;
  readonly evidenceRef?: string;
  readonly durationMs?: number;
}

export interface SentinelVerificationRow {
  readonly actionId: string;
  readonly actionTitle: string | null;
  readonly status: 'passed' | 'failed' | 'partial';
  readonly checks: readonly SentinelVerificationCheck[];
  readonly completedAt: string;
}

export interface SentinelPolicy {
  readonly activeProfile: {
    readonly name: string;
    readonly defaultLevel: string;
    readonly requireApproval: readonly string[];
    readonly deny: readonly string[];
  };
  readonly cadence: {
    readonly globalMinIntervalSeconds: number;
    readonly perMonitorJitterPercent: number;
    readonly maxMonitorRunsPerHour: number;
    readonly maxActionsPerHour: number;
    readonly panicStop: boolean;
  };
  readonly budget: {
    readonly llmTokensDaily: number;
    readonly perActionBudget: number;
    readonly npmRequestsPerHour: number;
    readonly githubRequestsPerHour: number;
  };
  readonly deniedPaths: readonly string[];
  readonly deniedCommands: readonly string[];
}

export interface SentinelAgentRunState {
  readonly runId: string;
  readonly status: 'active' | 'paused' | 'terminated';
  readonly interventionStep: string;
  readonly interventionCount: number;
  readonly pausedAt: string | null;
  readonly pausedReason: string | null;
  readonly pausedBy: string | null;
  readonly lastInterventionAt: string | null;
  readonly lastSignal: string | null;
  readonly updatedAt: string;
}

export interface SentinelWatchdogIntervention {
  readonly id: string;
  readonly runId: string;
  readonly signal: string;
  readonly step: string;
  readonly reason: string;
  readonly actor: string;
  readonly createdAt: string;
}

export interface SentinelWatchdogSnapshot {
  readonly runs: readonly SentinelAgentRunState[];
  readonly interventions: readonly SentinelWatchdogIntervention[];
}

export interface SentinelData {
  readonly status: SentinelStatus | null;
  readonly observations: readonly SentinelObservation[];
  readonly signals: readonly SentinelSignal[];
  readonly suppressedIds: readonly string[];
  readonly actions: readonly SentinelAction[];
  readonly approvals: readonly SentinelApprovalEntry[];
  readonly ledger: readonly SentinelLedgerEntry[];
  readonly verifications: readonly SentinelVerificationRow[];
  readonly policy: SentinelPolicy | null;
  readonly watchdog: SentinelWatchdogSnapshot;
  readonly loading: boolean;
  readonly error: string | null;
  readonly lastUpdated: string | null;
}

const DEFAULT_STATE: SentinelData = {
  status: null,
  observations: [],
  signals: [],
  suppressedIds: [],
  actions: [],
  approvals: [],
  ledger: [],
  verifications: [],
  policy: null,
  watchdog: { runs: [], interventions: [] },
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

export function useSentinelData(): SentinelData {
  const [state, setState] = useState<SentinelData>(DEFAULT_STATE);

  useEffect(() => {
    let cancelled = false;
    const poll = async (): Promise<void> => {
      if (typeof document !== 'undefined' && document.hidden) {
        return;
      }
      try {
        const [
          status,
          obsResp,
          signalsResp,
          actionsResp,
          approvalsResp,
          ledgerResp,
          verificationResp,
          policy,
          watchdog,
        ] = await Promise.all([
          fetchJson<SentinelStatus>('/api/sentinel/status'),
          fetchJson<{ observations: readonly SentinelObservation[] }>(
            '/api/sentinel/observations?limit=50',
          ),
          fetchJson<{ signals: readonly SentinelSignal[]; suppressedIds: readonly string[] }>(
            '/api/sentinel/signals',
          ),
          fetchJson<{ actions: readonly SentinelAction[] }>('/api/sentinel/actions'),
          fetchJson<{ approvals: readonly SentinelApprovalEntry[] }>('/api/sentinel/approvals'),
          fetchJson<{ entries: readonly SentinelLedgerEntry[] }>('/api/sentinel/ledger?limit=50'),
          fetchJson<{ rows: readonly SentinelVerificationRow[] }>(
            '/api/sentinel/verification?limit=20',
          ),
          fetchJson<SentinelPolicy>('/api/sentinel/policy'),
          fetchJson<SentinelWatchdogSnapshot>('/api/sentinel/watchdog?limit=50'),
        ]);
        if (!cancelled) {
          setState({
            status,
            observations: obsResp.observations,
            signals: signalsResp.signals,
            suppressedIds: signalsResp.suppressedIds,
            actions: actionsResp.actions,
            approvals: approvalsResp.approvals,
            ledger: ledgerResp.entries,
            verifications: verificationResp.rows,
            policy,
            watchdog,
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
