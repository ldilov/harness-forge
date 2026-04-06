import type { CSSProperties } from 'react';
import { colors, spacing } from '../styles/theme';

const sidebarStyle: CSSProperties = {
  width: 220,
  minHeight: '100vh',
  background: colors.bg.sidebar,
  borderRight: `1px solid ${colors.border.subtle}`,
  padding: `${spacing.lg}px ${spacing.md}px`,
  flexShrink: 0,
};

const logoStyle: CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
  color: colors.accent.magenta,
  marginBottom: spacing.xl,
  letterSpacing: '0.05em',
};

const sectionStyle: CSSProperties = {
  marginBottom: spacing.lg,
};

const labelStyle: CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.15em',
  textTransform: 'uppercase' as const,
  color: colors.text.muted,
  marginBottom: spacing.sm,
};

const linkStyle: CSSProperties = {
  display: 'block',
  fontSize: 13,
  color: colors.text.secondary,
  padding: `${spacing.xs}px ${spacing.sm}px`,
  borderRadius: 6,
  cursor: 'pointer',
  textDecoration: 'none',
};

const sections = [
  { label: 'Overview', items: ['KPIs', 'Timeline'] },
  { label: 'Memory', items: ['Pressure', 'Compaction', 'Policy', 'Budget'] },
  { label: 'Events', items: ['Live Feed', 'Distribution', 'Rate'] },
  { label: 'Agents', items: ['Briefs', 'Metrics', 'Profiles'] },
  { label: 'Misc', items: ['Suppression', 'Expansion', 'Artifacts'] },
];

export function Sidebar() {
  return (
    <nav style={sidebarStyle}>
      <div style={logoStyle}>Harness Forge</div>
      {sections.map((section) => (
        <div key={section.label} style={sectionStyle}>
          <div style={labelStyle}>{section.label}</div>
          {section.items.map((item) => (
            <div key={item} style={linkStyle}>{item}</div>
          ))}
        </div>
      ))}
    </nav>
  );
}
