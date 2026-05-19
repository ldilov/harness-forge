import type { CSSProperties } from 'react';
import { Panel } from '../components/Panel';
import { colors, spacing, radius } from '../styles/theme';
import type { SentinelObservation } from '../hooks/useSentinelData';

interface SentinelWorldFeedProps {
  readonly observations: readonly SentinelObservation[];
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

function severityColor(severity: SentinelObservation['severity']): string {
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

function severityBadge(severity: SentinelObservation['severity']): CSSProperties {
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

export function SentinelWorldFeed({ observations }: SentinelWorldFeedProps): JSX.Element {
  return (
    <Panel
      id="sentinel-world-feed"
      title="Sentinel World Feed"
      subtitle={`${observations.length} observation(s) — newest first`}
      tooltip="Raw observations Sentinel collected from monitors. Run 'hforge monitor once' to refresh, or 'hforge monitor run' for the always-on daemon."
    >
      <div style={listStyle}>
        {observations.length === 0 ? (
          <div style={emptyStyle}>No observations yet.</div>
        ) : (
          observations.map((obs) => (
            <div key={obs.id} style={rowStyle}>
              <div style={headerStyle}>
                <div>
                  <span style={severityBadge(obs.severity)}>{obs.severity}</span>
                  <span>{obs.subject}</span>
                </div>
                <span style={{ fontSize: 10, color: colors.text.muted }}>{obs.kind}</span>
              </div>
              <div style={summaryStyle}>{obs.summary}</div>
              <div style={metaStyle}>
                source={obs.source} · seen×{obs.occurrenceCount ?? 1} · confidence={obs.confidence.toFixed(2)} · id={obs.id.slice(0, 16)}…
              </div>
            </div>
          ))
        )}
      </div>
    </Panel>
  );
}
