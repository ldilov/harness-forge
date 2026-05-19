import type { CSSProperties } from 'react';
import { Panel } from '../components/Panel';
import { colors, spacing, radius } from '../styles/theme';
import type {
  SentinelVerificationCheck,
  SentinelVerificationRow,
} from '../hooks/useSentinelData';

interface SentinelVerificationProps {
  readonly verifications: readonly SentinelVerificationRow[];
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

const checksStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  fontSize: 10,
  fontFamily: 'monospace',
};

const checkLineStyle: CSSProperties = {
  display: 'flex',
  gap: 8,
  alignItems: 'center',
};

const metaStyle: CSSProperties = {
  fontSize: 10,
  color: colors.text.muted,
};

const emptyStyle: CSSProperties = {
  fontSize: 12,
  color: colors.text.muted,
  padding: spacing.md,
  textAlign: 'center',
};

function statusColor(status: SentinelVerificationRow['status'] | SentinelVerificationCheck['status']): string {
  switch (status) {
    case 'passed':
      return colors.threshold.safe;
    case 'failed':
      return colors.accent.coral;
    case 'partial':
      return colors.accent.peach;
    case 'skipped':
      return colors.text.muted;
    default:
      return colors.text.secondary;
  }
}

function statusBadge(status: SentinelVerificationRow['status']): CSSProperties {
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

function checkPrefix(status: SentinelVerificationCheck['status']): string {
  switch (status) {
    case 'passed':
      return '✓';
    case 'failed':
      return '✗';
    case 'skipped':
      return '∼';
    default:
      return '•';
  }
}

export function SentinelVerification({ verifications }: SentinelVerificationProps): JSX.Element {
  return (
    <Panel
      id="sentinel-verification"
      title="Sentinel Verification Results"
      subtitle={`${verifications.length} action(s) with verification reports — newest first`}
      tooltip="Aggregate verification status per executed action. Read the per-check evidence with 'hforge actions logs <id>'."
    >
      <div style={listStyle}>
        {verifications.length === 0 ? (
          <div style={emptyStyle}>No verification reports yet. Run 'hforge actions run &lt;id&gt;' to create one.</div>
        ) : (
          verifications.map((row) => (
            <div key={row.actionId} style={rowStyle}>
              <div style={headerStyle}>
                <div>
                  <span style={statusBadge(row.status)}>{row.status}</span>
                  <span>{row.actionTitle ?? row.actionId}</span>
                </div>
                <span style={metaStyle}>{row.checks.length} check(s)</span>
              </div>
              <div style={checksStyle}>
                {row.checks.map((check, idx) => (
                  <div key={idx} style={checkLineStyle}>
                    <span style={{ color: statusColor(check.status), fontWeight: 700, width: 12 }}>
                      {checkPrefix(check.status)}
                    </span>
                    <span style={{ color: colors.text.secondary }}>
                      {check.type}
                      {check.command !== undefined ? `: ${check.command}` : ''}
                    </span>
                    {check.summary !== undefined ? (
                      <span style={{ color: colors.text.muted }}>— {check.summary}</span>
                    ) : null}
                  </div>
                ))}
              </div>
              <div style={metaStyle}>completed {row.completedAt} · id={row.actionId}</div>
            </div>
          ))
        )}
      </div>
    </Panel>
  );
}
