import { useState, type CSSProperties, type ReactNode } from 'react';
import { colors, radius, spacing } from '../styles/theme';

interface PanelProps {
  readonly id?: string;
  readonly title: string;
  readonly subtitle?: string;
  readonly tooltip?: string;
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

const titleRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  marginBottom: 4,
};

const titleStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase' as const,
  color: colors.text.secondary,
};

const subtitleStyle: CSSProperties = {
  fontSize: 12,
  color: colors.text.muted,
  marginBottom: spacing.md,
};

const tooltipWrapperStyle: CSSProperties = {
  position: 'relative',
  display: 'inline-flex',
  alignItems: 'center',
};

const infoIconStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 16,
  height: 16,
  borderRadius: '50%',
  border: `1px solid ${colors.text.muted}`,
  fontSize: 10,
  color: colors.text.muted,
  cursor: 'help',
  lineHeight: 1,
  flexShrink: 0,
  userSelect: 'none',
};

const tooltipStyle: CSSProperties = {
  position: 'absolute',
  top: '100%',
  left: 0,
  zIndex: 10,
  background: colors.bg.card,
  border: `1px solid ${colors.border.subtle}`,
  borderRadius: radius.md,
  padding: `${spacing.sm}px ${spacing.md}px`,
  maxWidth: 320,
  fontSize: 13,
  lineHeight: 1.5,
  color: colors.text.secondary,
  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
  marginTop: 4,
  pointerEvents: 'none',
};

function TooltipIcon({ text }: { readonly text: string }) {
  const [show, setShow] = useState(false);

  return (
    <span
      style={tooltipWrapperStyle}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <span style={infoIconStyle}>i</span>
      {show && <div style={tooltipStyle}>{text}</div>}
    </span>
  );
}

export function Panel({ id, title, subtitle, tooltip, children, style }: PanelProps) {
  return (
    <div id={id} style={{ ...panelStyle, ...style }}>
      <div style={titleRowStyle}>
        <span style={titleStyle}>{title}</span>
        {tooltip && <TooltipIcon text={tooltip} />}
      </div>
      {subtitle && <div style={subtitleStyle}>{subtitle}</div>}
      {children}
    </div>
  );
}
