import { useMemo, type CSSProperties } from 'react';
import { Panel } from '../components/Panel';
import type { DashboardEvent } from '../state/types';
import { colors, radius, spacing } from '../styles/theme';

interface ExpansionGateProps {
  readonly events: readonly DashboardEvent[];
}

const counterRow: CSSProperties = {
  display: 'flex',
  gap: spacing.md,
  marginBottom: spacing.md,
};

const counterStyle: CSSProperties = {
  flex: 1,
  background: colors.bg.primary,
  borderRadius: radius.md,
  border: `1px solid ${colors.border.subtle}`,
  padding: spacing.md,
  textAlign: 'center',
};

export function ExpansionGate({ events }: ExpansionGateProps) {
  const { granted, denied, reasons } = useMemo(() => {
    let g = 0, d = 0;
    const r: string[] = [];
    for (const e of events) {
      if (e.eventType === 'history.expansion.requested') g++;
      if (e.eventType === 'history.expansion.denied') {
        d++;
        const reason = (e.payload.reason as string) ?? 'policy default';
        r.push(reason);
      }
    }
    return { granted: g, denied: d, reasons: r.slice(-5) };
  }, [events]);

  return (
    <Panel title="History Expansion Gate" subtitle="Expansion requests granted vs denied">
      <div style={counterRow}>
        <div style={counterStyle}>
          <div style={{ fontSize: 24, fontWeight: 700, color: colors.accent.mint }}>{granted}</div>
          <div style={{ fontSize: 10, color: colors.text.muted, marginTop: 4 }}>GRANTED</div>
        </div>
        <div style={counterStyle}>
          <div style={{ fontSize: 24, fontWeight: 700, color: colors.accent.coral }}>{denied}</div>
          <div style={{ fontSize: 10, color: colors.text.muted, marginTop: 4 }}>DENIED</div>
        </div>
      </div>
      {reasons.length > 0 && (
        <div style={{ fontSize: 11 }}>
          <div style={{ color: colors.text.muted, marginBottom: 4 }}>Recent denial reasons:</div>
          {reasons.map((r, i) => (
            <div key={i} style={{ color: colors.accent.peach, padding: '2px 0' }}>{r}</div>
          ))}
        </div>
      )}
    </Panel>
  );
}
