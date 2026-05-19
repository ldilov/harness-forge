import type { CSSProperties } from 'react';
import { Panel } from '../components/Panel';
import { colors, spacing, radius } from '../styles/theme';
import type { SentinelSignal } from '../hooks/useSentinelData';

interface SentinelSignalsProps {
  readonly signals: readonly SentinelSignal[];
  readonly suppressedIds: readonly string[];
}

const listStyle: CSSProperties = {
  maxHeight: 320,
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.sm,
};

const rowStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  padding: spacing.sm,
  borderRadius: radius.md,
  background: colors.bg.cardHover,
  border: `1px solid ${colors.border.subtle}`,
};

const headerStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: 12,
  fontWeight: 600,
  color: colors.text.primary,
};

const summaryStyle: CSSProperties = {
  fontSize: 11,
  color: colors.text.secondary,
};

const metaStyle: CSSProperties = {
  fontSize: 10,
  color: colors.text.muted,
  fontFamily: 'monospace',
};

const emptyStyle: CSSProperties = {
  fontSize: 12,
  color: colors.text.muted,
  padding: spacing.md,
  textAlign: 'center',
};

function severityColor(severity: SentinelSignal['severity']): string {
  switch (severity) {
    case 'critical':
      return colors.accent.coral;
    case 'warning':
      return colors.accent.peach;
    case 'notice':
      return colors.accent.amber;
    default:
      return colors.text.muted;
  }
}

function severityBadge(severity: SentinelSignal['severity']): CSSProperties {
  return {
    display: 'inline-block',
    padding: '2px 6px',
    borderRadius: 3,
    fontSize: 9,
    fontWeight: 700,
    textTransform: 'uppercase',
    background: severityColor(severity),
    color: '#0B0E11',
    marginRight: 6,
  };
}

export function SentinelSignals({ signals, suppressedIds }: SentinelSignalsProps): JSX.Element {
  const suppressed = new Set(suppressedIds);
  return (
    <Panel
      id="sentinel-signals"
      title="Sentinel Signals"
      subtitle={`${signals.length} signal(s) — sorted by priority`}
      tooltip="Observations correlated into prioritized signals. Suppressed signals stay visible with a strikethrough."
    >
      <div style={listStyle}>
        {signals.length === 0 ? (
          <div style={emptyStyle}>No signals yet. Run `hforge monitor once` to collect observations.</div>
        ) : (
          signals.map((signal) => (
            <div
              key={signal.id}
              style={{
                ...rowStyle,
                opacity: suppressed.has(signal.id) ? 0.5 : 1,
                textDecoration: suppressed.has(signal.id) ? 'line-through' : 'none',
              }}
            >
              <div style={headerStyle}>
                <div>
                  <span style={severityBadge(signal.severity)}>{signal.severity}</span>
                  <span>p={signal.priority} · {signal.title}</span>
                </div>
                <span style={{ fontSize: 10, color: colors.text.muted }}>{signal.category}</span>
              </div>
              <div style={summaryStyle}>{signal.summary}</div>
              <div style={metaStyle}>
                intent={signal.recommendedIntent ?? 'none'} · status={signal.status} · id={signal.id}
              </div>
            </div>
          ))
        )}
      </div>
    </Panel>
  );
}
