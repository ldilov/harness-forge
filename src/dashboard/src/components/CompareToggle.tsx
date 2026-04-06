import { type CSSProperties } from 'react';
import { colors, radius } from '../styles/theme';
import { useDashboardContext } from '../state/DashboardContext';

const btnStyle: CSSProperties = {
  background: 'transparent',
  border: `1px solid ${colors.border.subtle}`,
  borderRadius: radius.sm,
  padding: '4px 8px',
  fontSize: 10,
  color: colors.text.muted,
  cursor: 'pointer',
  transition: 'all 0.15s ease',
};

const activeStyle: CSSProperties = {
  ...btnStyle,
  background: `${colors.accent.mint}15`,
  borderColor: colors.accent.mint,
  color: colors.accent.mint,
};

export function CompareToggle() {
  const { compareMode, setCompareMode } = useDashboardContext();

  return (
    <button
      style={compareMode ? activeStyle : btnStyle}
      onClick={() => setCompareMode(!compareMode)}
      title="Overlay previous time window for comparison"
    >
      {compareMode ? 'Compare: ON' : 'Compare'}
    </button>
  );
}
