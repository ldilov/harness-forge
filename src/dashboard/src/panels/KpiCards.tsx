import type { CSSProperties } from 'react';
import type { DashboardState } from '../state/types';
import { colors, spacing, radius } from '../styles/theme';
import { Gauge } from '../components/Gauge';
import { Panel } from '../components/Panel';

interface KpiCardsProps {
  readonly state: DashboardState;
}

const rowStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(5, 1fr)',
  gap: spacing.md,
};

const cardStyle: CSSProperties = {
  background: colors.bg.card,
  borderRadius: radius.lg,
  border: `1px solid ${colors.border.subtle}`,
  padding: spacing.lg,
  textAlign: 'center',
};

const valueStyle: CSSProperties = {
  fontSize: 28,
  fontWeight: 700,
  color: colors.text.primary,
};

const labelStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase' as const,
  color: colors.text.secondary,
  marginTop: 8,
};

function KpiCard({ value, label, color }: { value: string | number; label: string; color: string }) {
  return (
    <div style={cardStyle}>
      <div style={{ ...valueStyle, color }}>{value}</div>
      <div style={labelStyle}>{label}</div>
    </div>
  );
}

export function KpiCards({ state }: KpiCardsProps) {
  const budgetPct = state.budgetSnapshot
    ? Math.round(((state.budgetSnapshot.current as Record<string, unknown>)?.estimatedInputTokens as number ?? 0) /
        ((state.budgetSnapshot.budgets as Record<string, unknown>)?.maxHotPathInputTokens as number ?? 120000) * 100)
    : 0;

  return (
    <Panel title="Key Metrics" tooltip="Key metrics at a glance. 'Memory Tokens' shows how much of the context window is used. The gauge shows budget usage — green is safe, yellow means compaction is near, red means the agent is running out of room.">
      <div style={rowStyle}>
        <KpiCard value={state.events.length} label="Total Events" color={colors.accent.mint} />
        <KpiCard value={state.memoryTokens} label="Memory Tokens" color={colors.accent.magenta} />
        <div style={cardStyle}>
          <Gauge value={budgetPct} max={100} label="Budget Usage" size={100} />
        </div>
        <KpiCard value={state.compactionLevel} label="Compaction Level" color={colors.accent.violet} />
        <KpiCard
          value={state.enforcementLevel}
          label="Enforcement"
          color={colors.enforcement[state.enforcementLevel.toLowerCase() as keyof typeof colors.enforcement] ?? colors.text.primary}
        />
      </div>
    </Panel>
  );
}
