import type { CSSProperties } from 'react';
import { Panel } from '../components/Panel';
import { colors, spacing, radius } from '../styles/theme';

interface Pattern {
  readonly id: string;
  readonly type: string;
  readonly confidence: number;
  readonly finding: string;
  readonly isNew: boolean;
}

interface InsightsPanelProps {
  readonly patterns: readonly Pattern[];
}

const listStyle: CSSProperties = {
  maxHeight: 300,
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.sm,
};

const rowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: spacing.sm,
  padding: spacing.sm,
  background: colors.bg.secondary,
  borderRadius: radius.sm,
  border: `1px solid ${colors.border.subtle}`,
};

const typeEmojiStyle: CSSProperties = {
  fontSize: 16,
  flexShrink: 0,
};

const findingStyle: CSSProperties = {
  flex: 1,
  fontSize: 12,
  color: colors.text.primary,
  lineHeight: 1.4,
};

const barContainerStyle: CSSProperties = {
  width: 60,
  height: 6,
  background: colors.bg.primary,
  borderRadius: 3,
  overflow: 'hidden',
  flexShrink: 0,
};

const confidenceLabelStyle: CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  flexShrink: 0,
  minWidth: 32,
  textAlign: 'right',
};

const newBadgeStyle: CSSProperties = {
  fontSize: 9,
  fontWeight: 700,
  color: colors.bg.primary,
  background: colors.accent.mint,
  borderRadius: 3,
  padding: '1px 4px',
  letterSpacing: '0.05em',
  flexShrink: 0,
};

const emptyStyle: CSSProperties = {
  textAlign: 'center',
  color: colors.text.muted,
  fontSize: 12,
  padding: spacing.lg,
};

const typeEmojiMap: Readonly<Record<string, string>> = {
  pattern: '\uD83D\uDD0D',
  anomaly: '\u26A0\uFE0F',
  trend: '\uD83D\uDCC8',
  correlation: '\uD83D\uDD17',
  regression: '\uD83D\uDCC9',
};

function getConfidenceColor(confidence: number): string {
  if (confidence > 0.7) return colors.accent.mint;
  if (confidence > 0.5) return colors.accent.peach;
  return colors.text.muted;
}

function getTypeEmoji(type: string): string {
  return typeEmojiMap[type] ?? '\uD83D\uDCA1';
}

function PatternRow({ pattern }: { readonly pattern: Pattern }) {
  const barColor = getConfidenceColor(pattern.confidence);
  const barWidth = `${Math.round(pattern.confidence * 100)}%`;

  return (
    <div style={rowStyle}>
      <span style={typeEmojiStyle}>{getTypeEmoji(pattern.type)}</span>
      <span style={findingStyle}>{pattern.finding}</span>
      {pattern.isNew && <span style={newBadgeStyle}>NEW</span>}
      <div style={barContainerStyle}>
        <div style={{ width: barWidth, height: '100%', background: barColor, borderRadius: 3 }} />
      </div>
      <span style={{ ...confidenceLabelStyle, color: barColor }}>
        {Math.round(pattern.confidence * 100)}%
      </span>
    </div>
  );
}

export function InsightsPanel({ patterns }: InsightsPanelProps) {
  return (
    <Panel title={'\uD83D\uDCA1 Insights'} subtitle="Discovered patterns and findings" tooltip="Patterns the harness discovered from your sessions. Higher confidence = more data supporting the finding. 'NEW' badges mean recently discovered. These drive auto-tuning decisions.">
      {patterns.length === 0 ? (
        <div style={emptyStyle}>No patterns discovered yet</div>
      ) : (
        <div style={listStyle}>
          {patterns.map((pattern) => (
            <PatternRow key={pattern.id} pattern={pattern} />
          ))}
        </div>
      )}
    </Panel>
  );
}
