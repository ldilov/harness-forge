import type { CSSProperties } from 'react';
import { Panel } from '../components/Panel';
import { colors, spacing, radius } from '../styles/theme';
import type {
  SentinelAgentRunState,
  SentinelWatchdogIntervention,
  SentinelWatchdogSnapshot,
} from '../hooks/useSentinelData';

interface SentinelAgentWatchdogProps {
  readonly snapshot: SentinelWatchdogSnapshot;
}

const containerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.md,
};

const sectionLabelStyle: CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  textTransform: 'uppercase',
  color: colors.text.muted,
  letterSpacing: 0.5,
};

const runRowStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  padding: spacing.sm,
  borderRadius: radius.md,
  background: colors.bg.cardHover,
  border: `1px solid ${colors.border.subtle}`,
};

const runHeaderStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: 12,
  fontWeight: 600,
  color: colors.text.primary,
};

const interventionRowStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'auto auto 1fr',
  gap: spacing.sm,
  padding: spacing.xs,
  borderRadius: radius.sm,
  background: colors.bg.cardHover,
  border: `1px solid ${colors.border.subtle}`,
  alignItems: 'center',
  fontSize: 11,
  fontFamily: 'monospace',
};

const emptyStyle: CSSProperties = {
  fontSize: 12,
  color: colors.text.muted,
  padding: spacing.sm,
  textAlign: 'center',
};

const cliHintStyle: CSSProperties = {
  fontSize: 10,
  color: colors.text.muted,
  marginTop: 4,
  fontFamily: 'monospace',
};

function statusColor(status: SentinelAgentRunState['status']): string {
  switch (status) {
    case 'paused':
      return colors.accent.peach;
    case 'terminated':
      return colors.accent.coral;
    default:
      return colors.threshold.safe;
  }
}

function statusBadge(status: SentinelAgentRunState['status']): CSSProperties {
  return {
    display: 'inline-block',
    padding: '2px 6px',
    borderRadius: 3,
    fontSize: 9,
    fontWeight: 700,
    textTransform: 'uppercase',
    background: statusColor(status),
    color: '#0B0E11',
    marginRight: 6,
  };
}

function shortTime(iso: string): string {
  try {
    const date = new Date(iso);
    return date.toLocaleTimeString(undefined, { hour12: false });
  } catch {
    return iso;
  }
}

export function SentinelAgentWatchdog({ snapshot }: SentinelAgentWatchdogProps): JSX.Element {
  return (
    <Panel
      id="sentinel-agent-watchdog"
      title="Sentinel Agent Watchdog"
      subtitle={`${snapshot.runs.length} agent run(s) tracked · ${snapshot.interventions.length} intervention(s) recorded`}
      tooltip="Per-agent-run intervention history and current status. The intervention ladder is observe → warn → constrain → pause → require_approval → terminate → rollback. Pause/resume from the CLI: 'hforge watchdog pause <run-id>' / 'hforge watchdog resume <run-id>'."
    >
      <div style={containerStyle}>
        <div>
          <span style={sectionLabelStyle}>Active Runs</span>
          {snapshot.runs.length === 0 ? (
            <div style={emptyStyle}>
              No agent runs are being observed yet. The watchdog activates when the spec's
              agent step types (invoke_agent / write_file / apply_patch / open_pr) start landing.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm, marginTop: 4 }}>
              {snapshot.runs.map((run) => (
                <div key={run.runId} style={runRowStyle}>
                  <div style={runHeaderStyle}>
                    <div>
                      <span style={statusBadge(run.status)}>{run.status}</span>
                      <span>{run.runId}</span>
                    </div>
                    <span style={{ fontSize: 10, color: colors.text.muted }}>
                      step={run.interventionStep} · interventions={run.interventionCount}
                    </span>
                  </div>
                  {run.pausedReason !== null ? (
                    <div style={{ fontSize: 11, color: colors.text.secondary }}>
                      paused: {run.pausedReason} (by {run.pausedBy ?? '?'})
                    </div>
                  ) : null}
                  <div style={cliHintStyle}>
                    {run.status === 'paused'
                      ? `hforge watchdog resume ${run.runId}`
                      : `hforge watchdog pause ${run.runId}`}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <span style={sectionLabelStyle}>Recent Interventions</span>
          {snapshot.interventions.length === 0 ? (
            <div style={emptyStyle}>No interventions recorded.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
              {snapshot.interventions
                .slice()
                .reverse()
                .map((entry) => (
                  <InterventionRow key={entry.id} entry={entry} />
                ))}
            </div>
          )}
        </div>
      </div>
    </Panel>
  );
}

function InterventionRow({ entry }: { readonly entry: SentinelWatchdogIntervention }): JSX.Element {
  return (
    <div style={interventionRowStyle}>
      <span style={{ color: colors.text.muted }}>{shortTime(entry.createdAt)}</span>
      <span style={{ fontWeight: 600, color: colors.text.primary }}>{entry.step}</span>
      <span style={{ color: colors.text.secondary }}>
        {entry.signal} · {entry.reason} <span style={{ color: colors.text.muted }}>(by {entry.actor})</span>
      </span>
    </div>
  );
}
