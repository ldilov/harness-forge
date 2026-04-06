import { useMemo, type CSSProperties } from 'react';
import { Panel } from '../components/Panel';
import type { DashboardEvent } from '../state/types';
import { colors, radius, spacing } from '../styles/theme';

interface SubagentBriefsProps {
  readonly events: readonly DashboardEvent[];
}

const cardStyle: CSSProperties = {
  background: colors.bg.primary,
  borderRadius: radius.md,
  border: `1px solid ${colors.border.subtle}`,
  padding: spacing.md,
  marginBottom: spacing.sm,
};

const objectiveStyle: CSSProperties = {
  fontSize: 12,
  color: colors.text.primary,
  marginBottom: 6,
};

const metaStyle: CSSProperties = {
  fontSize: 10,
  color: colors.text.muted,
  display: 'flex',
  gap: 12,
};

const badgeStyle: CSSProperties = {
  fontSize: 10,
  padding: '2px 6px',
  borderRadius: 4,
  background: `${colors.accent.magenta}20`,
  color: colors.accent.magenta,
};

export function SubagentBriefs({ events }: SubagentBriefsProps) {
  const briefs = useMemo(() => {
    return events
      .filter((e) => e.eventType === 'subagent.brief.generated')
      .slice(-5)
      .reverse();
  }, [events]);

  return (
    <Panel title="Subagent Briefs" subtitle={`${briefs.length} recent briefs`} style={{ maxHeight: 400, overflow: 'auto' }}>
      {briefs.length === 0 && (
        <div style={{ color: colors.text.muted, fontSize: 12 }}>No subagent briefs yet</div>
      )}
      {briefs.map((b) => {
        const p = b.payload;
        return (
          <div key={b.eventId} style={cardStyle}>
            <div style={objectiveStyle}>{(p.objective as string) ?? 'Unknown objective'}</div>
            <div style={metaStyle}>
              <span>{(p.estimatedTokens as number) ?? 0} tokens</span>
              <span style={badgeStyle}>{(p.responseProfile as string) ?? 'brief'}</span>
              <span>{(p.sourceStateType as string) ?? 'live'}</span>
            </div>
          </div>
        );
      })}
    </Panel>
  );
}
