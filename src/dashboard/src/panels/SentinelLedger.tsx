import type { CSSProperties } from 'react';
import { Panel } from '../components/Panel';
import { colors, spacing, radius } from '../styles/theme';
import type { SentinelLedgerEntry } from '../hooks/useSentinelData';

interface SentinelLedgerProps {
  readonly entries: readonly SentinelLedgerEntry[];
}

const listStyle: CSSProperties = {
  maxHeight: 280,
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
};

const rowStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'auto 1fr auto',
  gap: spacing.sm,
  padding: spacing.xs,
  borderRadius: radius.sm,
  background: colors.bg.cardHover,
  border: `1px solid ${colors.border.subtle}`,
  alignItems: 'center',
  fontSize: 11,
  fontFamily: 'monospace',
};

const kindStyle: CSSProperties = {
  fontWeight: 600,
  color: colors.text.primary,
  whiteSpace: 'nowrap',
};

const targetStyle: CSSProperties = {
  color: colors.text.secondary,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const reversibleStyle: CSSProperties = {
  fontSize: 9,
  fontWeight: 700,
  textTransform: 'uppercase',
  padding: '2px 5px',
  borderRadius: 3,
};

const emptyStyle: CSSProperties = {
  fontSize: 12,
  color: colors.text.muted,
  padding: spacing.md,
  textAlign: 'center',
};

function shortTime(iso: string): string {
  try {
    const date = new Date(iso);
    return `${date.toLocaleTimeString(undefined, { hour12: false })}`;
  } catch {
    return iso;
  }
}

export function SentinelLedger({ entries }: SentinelLedgerProps): JSX.Element {
  return (
    <Panel
      id="sentinel-ledger"
      title="Sentinel Side-Effect Ledger"
      subtitle={`${entries.length} entr${entries.length === 1 ? 'y' : 'ies'} — newest first`}
      tooltip="Append-only record of every mutation Sentinel performed. Reversible entries can be undone via 'hforge actions rollback <id>'."
    >
      <div style={listStyle}>
        {entries.length === 0 ? (
          <div style={emptyStyle}>No side effects recorded yet.</div>
        ) : (
          entries.map((entry) => (
            <div key={entry.id} style={rowStyle}>
              <span style={{ color: colors.text.muted }}>{shortTime(entry.createdAt)}</span>
              <span>
                <span style={kindStyle}>{entry.kind}</span>{' '}
                <span style={targetStyle}>{entry.target}</span>
              </span>
              <span
                style={{
                  ...reversibleStyle,
                  color: entry.reversible ? colors.threshold.safe : colors.accent.peach,
                  border: `1px solid ${entry.reversible ? colors.threshold.safe : colors.accent.peach}`,
                }}
              >
                {entry.reversible ? 'reversible' : 'final'}
              </span>
            </div>
          ))
        )}
      </div>
    </Panel>
  );
}
