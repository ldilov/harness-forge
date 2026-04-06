import type { CSSProperties, ReactNode } from 'react';
import { colors, radius, spacing } from '../styles/theme';

interface PanelProps {
  readonly title: string;
  readonly subtitle?: string;
  readonly children: ReactNode;
  readonly style?: CSSProperties;
}

const panelStyle: CSSProperties = {
  background: colors.bg.card,
  borderRadius: radius.lg,
  border: `1px solid ${colors.border.subtle}`,
  padding: spacing.lg,
  overflow: 'hidden',
};

const titleStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase' as const,
  color: colors.text.secondary,
  marginBottom: 4,
};

const subtitleStyle: CSSProperties = {
  fontSize: 12,
  color: colors.text.muted,
  marginBottom: spacing.md,
};

export function Panel({ title, subtitle, children, style }: PanelProps) {
  return (
    <div style={{ ...panelStyle, ...style }}>
      <div style={titleStyle}>{title}</div>
      {subtitle && <div style={subtitleStyle}>{subtitle}</div>}
      {children}
    </div>
  );
}
