import type { CSSProperties } from 'react';
import { Panel } from '../components/Panel';
import { colors, spacing, radius } from '../styles/theme';
import type { SentinelAction } from '../hooks/useSentinelData';

interface SentinelActionsProps {
  readonly actions: readonly SentinelAction[];
}

const listStyle: CSSProperties = {
  maxHeight: 360,
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

const reasonStyle: CSSProperties = {
  fontSize: 11,
  color: colors.text.secondary,
};

const metaStyle: CSSProperties = {
  fontSize: 10,
  color: colors.text.muted,
  fontFamily: 'monospace',
};

const stepListStyle: CSSProperties = {
  fontSize: 10,
  color: colors.text.secondary,
  fontFamily: 'monospace',
  marginTop: 2,
};

const emptyStyle: CSSProperties = {
  fontSize: 12,
  color: colors.text.muted,
  padding: spacing.md,
  textAlign: 'center',
};

function statusColor(status: string): string {
  switch (status) {
    case 'completed':
      return colors.threshold.safe;
    case 'failed':
    case 'reverted':
      return colors.accent.coral;
    case 'rejected':
      return colors.text.muted;
    case 'running':
    case 'verifying':
      return colors.accent.peach;
    case 'approved':
      return colors.accent.lavender;
    default:
      return colors.text.secondary;
  }
}

function riskColor(level: SentinelAction['risk']['level']): string {
  switch (level) {
    case 'critical':
      return colors.accent.coral;
    case 'high':
      return colors.accent.peach;
    case 'medium':
      return colors.accent.amber;
    default:
      return colors.threshold.safe;
  }
}

function statusBadge(status: string): CSSProperties {
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

function riskBadge(level: SentinelAction['risk']['level']): CSSProperties {
  return {
    display: 'inline-block',
    padding: '2px 6px',
    borderRadius: 3,
    fontSize: 9,
    fontWeight: 700,
    textTransform: 'uppercase',
    background: 'transparent',
    color: riskColor(level),
    border: `1px solid ${riskColor(level)}`,
  };
}

export function SentinelActions({ actions }: SentinelActionsProps): JSX.Element {
  return (
    <Panel
      id="sentinel-actions"
      title="Sentinel Action Queue"
      subtitle={`${actions.length} proposed/in-flight action(s) — newest first`}
      tooltip="Action plans Sentinel has proposed. Approve via 'hforge actions approve <id>'; run via 'hforge actions run <id>'."
    >
      <div style={listStyle}>
        {actions.length === 0 ? (
          <div style={emptyStyle}>No action plans yet. Sentinel proposes actions when signals carry a known intent.</div>
        ) : (
          actions.map((action) => (
            <div key={action.id} style={rowStyle}>
              <div style={headerStyle}>
                <div>
                  <span style={statusBadge(action.status)}>{action.status}</span>
                  <span>{action.title}</span>
                </div>
                <span style={riskBadge(action.risk.level)}>{action.risk.level}</span>
              </div>
              <div style={reasonStyle}>{action.reason}</div>
              <div style={metaStyle}>
                authority={action.authorityRequired} · proposedBy={action.proposedBy} · steps={action.steps.length} · id={action.id}
              </div>
              {action.steps.length > 0 ? (
                <div style={stepListStyle}>
                  {action.steps.map((step, idx) => (
                    <div key={idx}>· {step.type}</div>
                  ))}
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>
    </Panel>
  );
}
