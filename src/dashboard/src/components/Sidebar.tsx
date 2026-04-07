import { useState, type CSSProperties } from 'react';
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

const linkBaseStyle: CSSProperties = {
  display: 'block',
  fontSize: 13,
  color: colors.text.secondary,
  padding: `${spacing.xs}px ${spacing.sm}px`,
  borderRadius: 6,
  cursor: 'pointer',
  textDecoration: 'none',
  transition: 'background 0.15s, color 0.15s',
};

interface SidebarItem {
  readonly label: string;
  readonly panelId: string;
}

interface SidebarSection {
  readonly label: string;
  readonly items: readonly SidebarItem[];
}

const sections: readonly SidebarSection[] = [
  {
    label: 'Living Loop',
    items: [
      { label: 'Loop Health', panelId: 'panel-loop-health' },
      { label: 'Effectiveness', panelId: 'panel-effectiveness' },
      { label: 'Insights', panelId: 'panel-insights' },
      { label: 'Tuning Log', panelId: 'panel-tuning' },
    ],
  },
  {
    label: 'Overview',
    items: [
      { label: 'Session', panelId: 'panel-session-hero' },
      { label: 'KPIs', panelId: 'panel-kpi' },
      { label: 'Commands', panelId: 'panel-commands' },
      { label: 'Timeline', panelId: 'panel-timeline' },
      { label: 'Heatmap', panelId: 'panel-heatmap' },
    ],
  },
  {
    label: 'Memory',
    items: [
      { label: 'Pressure', panelId: 'panel-pressure' },
      { label: 'Compaction', panelId: 'panel-compaction' },
      { label: 'Policy', panelId: 'panel-policy' },
      { label: 'Budget', panelId: 'panel-budget' },
    ],
  },
  {
    label: 'Events',
    items: [
      { label: 'Live Feed', panelId: 'panel-live-feed' },
      { label: 'Distribution', panelId: 'panel-distribution' },
      { label: 'Rate', panelId: 'panel-rate' },
    ],
  },
  {
    label: 'Agents',
    items: [
      { label: 'Briefs', panelId: 'panel-briefs' },
      { label: 'Metrics', panelId: 'panel-brief-metrics' },
      { label: 'Profiles', panelId: 'panel-profiles' },
    ],
  },
  {
    label: 'Misc',
    items: [
      { label: 'Suppression', panelId: 'panel-suppression' },
      { label: 'Expansion', panelId: 'panel-expansion' },
      { label: 'Tokens Saved', panelId: 'panel-tokens-saved' },
      { label: 'Config', panelId: 'panel-config' },
      { label: 'Session Info', panelId: 'panel-session-info' },
    ],
  },
];

function scrollToPanel(panelId: string) {
  document.getElementById(panelId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function SidebarLink({ item, isActive, onSelect }: {
  readonly item: SidebarItem;
  readonly isActive: boolean;
  readonly onSelect: (panelId: string) => void;
}) {
  const [hovered, setHovered] = useState(false);

  const style: CSSProperties = {
    ...linkBaseStyle,
    ...(isActive
      ? { background: colors.bg.cardHover, color: colors.accent.mint }
      : hovered
        ? { background: colors.bg.card, color: colors.text.primary }
        : {}),
  };

  return (
    <div
      style={style}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onSelect(item.panelId)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(item.panelId);
        }
      }}
    >
      {item.label}
    </div>
  );
}

export function Sidebar() {
  const [activePanel, setActivePanel] = useState<string | null>(null);

  const handleSelect = (panelId: string) => {
    setActivePanel(panelId);
    scrollToPanel(panelId);
  };

  return (
    <nav style={sidebarStyle}>
      <div style={logoStyle}>Harness Forge</div>
      {sections.map((section) => (
        <div key={section.label} style={sectionStyle}>
          <div style={labelStyle}>{section.label}</div>
          {section.items.map((item) => (
            <SidebarLink
              key={item.panelId}
              item={item}
              isActive={activePanel === item.panelId}
              onSelect={handleSelect}
            />
          ))}
        </div>
      ))}
    </nav>
  );
}
