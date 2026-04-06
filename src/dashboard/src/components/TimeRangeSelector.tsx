import { type CSSProperties } from 'react';
import { colors, radius } from '../styles/theme';
import { useDashboardContext } from '../state/DashboardContext';

const presets = [
  { label: 'Full Session', ms: 0 },
  { label: 'Last 5m', ms: 5 * 60_000 },
  { label: 'Last 15m', ms: 15 * 60_000 },
  { label: 'Last 1h', ms: 60 * 60_000 },
  { label: 'Last 6h', ms: 6 * 60 * 60_000 },
] as const;

const selectStyle: CSSProperties = {
  background: colors.bg.card,
  color: colors.text.primary,
  border: `1px solid ${colors.border.subtle}`,
  borderRadius: radius.sm,
  padding: '4px 8px',
  fontSize: 11,
  cursor: 'pointer',
  outline: 'none',
};

export function TimeRangeSelector() {
  const { timeRange, setTimeRange } = useDashboardContext();

  const currentLabel = timeRange === null
    ? 'Full Session'
    : presets.find((p) => p.ms > 0 && Math.abs(Date.now() - p.ms - timeRange.start) < 60_000)?.label ?? 'Custom';

  return (
    <select
      style={selectStyle}
      value={currentLabel}
      onChange={(e) => {
        const preset = presets.find((p) => p.label === e.target.value);
        if (!preset || preset.ms === 0) {
          setTimeRange(null);
        } else {
          const now = Date.now();
          setTimeRange({ start: now - preset.ms, end: now });
        }
      }}
    >
      {presets.map((p) => (
        <option key={p.label} value={p.label}>{p.label}</option>
      ))}
    </select>
  );
}
