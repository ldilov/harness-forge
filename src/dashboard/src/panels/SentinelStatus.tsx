import type { CSSProperties } from 'react';
import { Panel } from '../components/Panel';
import { colors, spacing } from '../styles/theme';
import type { SentinelStatus } from '../hooks/useSentinelData';

interface SentinelStatusPanelProps {
  readonly status: SentinelStatus | null;
  readonly lastUpdated: string | null;
}

const gridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: spacing.md,
};

const cellStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
};

const labelStyle: CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  textTransform: 'uppercase',
  color: colors.text.muted,
  letterSpacing: 0.5,
};

const valueStyle: CSSProperties = {
  fontSize: 16,
  fontWeight: 700,
  color: colors.text.primary,
};

const subStyle: CSSProperties = {
  fontSize: 10,
  color: colors.text.secondary,
};

export function SentinelStatusPanel({ status, lastUpdated }: SentinelStatusPanelProps): JSX.Element {
  if (status === null) {
    return (
      <Panel title="Sentinel Status" subtitle="Loading…">
        <div style={{ fontSize: 12, color: colors.text.muted }}>fetching /api/sentinel/status…</div>
      </Panel>
    );
  }

  const daemonValue = status.daemon.running
    ? `running pid ${status.daemon.pid}`
    : 'not running';
  const daemonColor = status.daemon.running ? colors.threshold.safe : colors.text.muted;
  const panicColor = status.cadence.panicStop ? colors.accent.coral : colors.threshold.safe;
  const panicLabel = status.cadence.panicStop ? 'PANIC STOP ON' : 'panic stop off';

  return (
    <Panel
      title="Sentinel Status"
      subtitle={lastUpdated === null ? 'never refreshed' : `last refresh ${new Date(lastUpdated).toLocaleTimeString()}`}
      tooltip="Snapshot from /api/sentinel/status. Polls every 5 seconds."
    >
      <div style={gridStyle}>
        <div style={cellStyle}>
          <span style={labelStyle}>Daemon</span>
          <span style={{ ...valueStyle, color: daemonColor }}>{daemonValue}</span>
          <span style={subStyle}>profile {status.profile.name} · default {status.profile.defaultLevel}</span>
        </div>
        <div style={cellStyle}>
          <span style={labelStyle}>Panic Stop</span>
          <span style={{ ...valueStyle, color: panicColor }}>{panicLabel}</span>
          <span style={subStyle}>tokens/day {status.budget.llmTokensDaily} · actions/h {status.cadence.maxActionsPerHour}</span>
        </div>
        <div style={cellStyle}>
          <span style={labelStyle}>Last Hour</span>
          <span style={valueStyle}>{status.usage.monitorRunsLastHour} runs · {status.usage.actionsProposedLastHour} actions</span>
          <span style={subStyle}>{status.usage.panicTogglesLastHour} panic toggle(s)</span>
        </div>
        <div style={cellStyle}>
          <span style={labelStyle}>Counts</span>
          <span style={valueStyle}>
            {status.counts.observations} obs · {status.counts.signals} sig · {status.counts.actions} act
          </span>
          <span style={subStyle}>{status.counts.ledgerEntries} ledger entries</span>
        </div>
      </div>
    </Panel>
  );
}
