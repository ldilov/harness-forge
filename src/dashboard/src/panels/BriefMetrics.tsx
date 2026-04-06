import { useMemo, type CSSProperties } from 'react';
import { Panel } from '../components/Panel';
import type { DashboardEvent } from '../state/types';
import { colors, radius, spacing } from '../styles/theme';

interface BriefMetricsProps {
  readonly events: readonly DashboardEvent[];
}

const rowStyle: CSSProperties = {
  display: 'flex',
  gap: spacing.sm,
};

const counterStyle: CSSProperties = {
  flex: 1,
  background: colors.bg.primary,
  borderRadius: radius.md,
  border: `1px solid ${colors.border.subtle}`,
  padding: spacing.md,
  textAlign: 'center',
};

const valueStyle: CSSProperties = {
  fontSize: 24,
  fontWeight: 700,
};

const labelStyle: CSSProperties = {
  fontSize: 10,
  color: colors.text.muted,
  marginTop: 4,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
};

export function BriefMetrics({ events }: BriefMetricsProps) {
  const counts = useMemo(() => {
    let generated = 0, rewritten = 0, rejected = 0;
    for (const e of events) {
      if (e.eventType === 'subagent.brief.generated') generated++;
      if (e.eventType === 'subagent.brief.rewritten') rewritten++;
      if (e.eventType === 'subagent.brief.rejected') rejected++;
    }
    return { generated, rewritten, rejected };
  }, [events]);

  return (
    <Panel title="Brief Metrics" subtitle="Subagent brief lifecycle counts">
      <div style={rowStyle}>
        <div style={counterStyle}>
          <div style={{ ...valueStyle, color: colors.accent.mint }}>{counts.generated}</div>
          <div style={labelStyle}>Generated</div>
        </div>
        <div style={counterStyle}>
          <div style={{ ...valueStyle, color: colors.accent.amber }}>{counts.rewritten}</div>
          <div style={labelStyle}>Rewritten</div>
        </div>
        <div style={counterStyle}>
          <div style={{ ...valueStyle, color: colors.accent.coral }}>{counts.rejected}</div>
          <div style={labelStyle}>Rejected</div>
        </div>
      </div>
    </Panel>
  );
}
