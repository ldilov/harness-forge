import type { CSSProperties } from 'react';
import { Panel } from '../components/Panel';
import { Gauge } from '../components/Gauge';
import { colors, spacing, radius } from '../styles/theme';

interface LoopHealthRingProps {
  readonly loopHealth: {
    readonly observeCount: number;
    readonly learnCount: number;
    readonly adaptCount: number;
    readonly shareCount: number;
    readonly importCount: number;
    readonly healthScore: number;
    readonly lastCycleAt: string | null;
  };
}

interface StageInfo {
  readonly key: string;
  readonly emoji: string;
  readonly label: string;
  readonly count: number;
}

const containerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: spacing.sm,
  flexWrap: 'wrap',
};

const stageBoxStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  background: colors.bg.secondary,
  borderRadius: radius.md,
  border: `1px solid ${colors.border.subtle}`,
  padding: `${spacing.sm}px ${spacing.md}px`,
  minWidth: 80,
  textAlign: 'center',
};

const badgeStyle: CSSProperties = {
  fontSize: 16,
  fontWeight: 700,
  marginBottom: 2,
};

const stageLabelStyle: CSSProperties = {
  fontSize: 9,
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase' as const,
  marginTop: 2,
};

const arrowStyle: CSSProperties = {
  fontSize: 16,
  color: colors.text.muted,
  flexShrink: 0,
};

const gaugeWrapperStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  margin: `0 ${spacing.md}px`,
};

const lastCycleStyle: CSSProperties = {
  fontSize: 10,
  color: colors.text.muted,
  textAlign: 'center',
  marginTop: spacing.sm,
};

function getStageColor(count: number): string {
  if (count > 0) return colors.accent.mint;
  return colors.text.muted;
}

function getBorderColor(count: number): string {
  if (count > 0) return colors.accent.mint;
  return colors.border.subtle;
}

function StageBox({ emoji, label, count }: Omit<StageInfo, 'key'>) {
  const stageColor = getStageColor(count);
  const borderColor = getBorderColor(count);

  return (
    <div style={{ ...stageBoxStyle, borderColor }}>
      <div style={{ fontSize: 18 }}>{emoji}</div>
      <div style={{ ...badgeStyle, color: stageColor }}>{count}</div>
      <div style={{ ...stageLabelStyle, color: stageColor }}>{label}</div>
    </div>
  );
}

function Arrow() {
  return <span style={arrowStyle}>{'\u2192'}</span>;
}

export function LoopHealthRing({ loopHealth }: LoopHealthRingProps) {
  const stages: readonly StageInfo[] = [
    { key: 'observe', emoji: '\uD83D\uDD0D', label: 'Observe', count: loopHealth.observeCount },
    { key: 'learn', emoji: '\uD83E\uDDE0', label: 'Learn', count: loopHealth.learnCount },
    { key: 'adapt', emoji: '\u26A1', label: 'Adapt', count: loopHealth.adaptCount },
    { key: 'share', emoji: '\uD83D\uDCE4', label: 'Share', count: loopHealth.shareCount },
    { key: 'import', emoji: '\uD83D\uDCE5', label: 'Import', count: loopHealth.importCount },
  ];

  const healthThresholds = [
    { at: 0, color: colors.text.muted },
    { at: 30, color: colors.accent.peach },
    { at: 60, color: colors.accent.amber },
    { at: 80, color: colors.accent.mint },
  ] as const;

  return (
    <Panel title={'\uD83D\uDD04 The Living Loop'} subtitle="Observe \u2192 Learn \u2192 Adapt \u2192 Share \u2192 Import">
      <div style={containerStyle}>
        {stages.map((stage, i) => (
          <span key={stage.key} style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
            <StageBox emoji={stage.emoji} label={stage.label} count={stage.count} />
            {i < stages.length - 1 && <Arrow />}
          </span>
        ))}

        <div style={gaugeWrapperStyle}>
          <Gauge
            value={loopHealth.healthScore}
            max={100}
            label="Health"
            thresholds={[...healthThresholds]}
            size={80}
          />
        </div>
      </div>

      {loopHealth.lastCycleAt && (
        <div style={lastCycleStyle}>
          Last cycle: {new Date(loopHealth.lastCycleAt).toLocaleTimeString()}
        </div>
      )}
    </Panel>
  );
}
