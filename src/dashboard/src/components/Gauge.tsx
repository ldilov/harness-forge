import type { CSSProperties } from 'react';
import { colors } from '../styles/theme';

interface GaugeProps {
  readonly value: number;
  readonly max: number;
  readonly label: string;
  readonly unit?: string;
  readonly thresholds?: readonly { at: number; color: string }[];
  readonly size?: number;
}

const defaultThresholds = [
  { at: 0, color: colors.threshold.safe },
  { at: 70, color: colors.threshold.trim },
  { at: 88, color: colors.threshold.summarize },
  { at: 93, color: colors.threshold.rollup },
];

export function Gauge({ value, max, label, unit = '%', thresholds = defaultThresholds, size = 120 }: GaugeProps) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const r = (size - 16) / 2;
  const circ = 2 * Math.PI * r;
  const arcLen = circ * 0.75;
  const offset = arcLen - (pct / 100) * arcLen;

  let color = thresholds[0]?.color ?? colors.accent.mint;
  for (const t of thresholds) {
    if (pct >= t.at) color = t.color;
  }

  const center = size / 2;

  return (
    <div style={{ textAlign: 'center' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={center} cy={center} r={r}
          fill="none"
          stroke={colors.border.subtle}
          strokeWidth={8}
          strokeDasharray={`${arcLen} ${circ}`}
          strokeDashoffset={0}
          transform={`rotate(135 ${center} ${center})`}
          strokeLinecap="round"
        />
        <circle
          cx={center} cy={center} r={r}
          fill="none"
          stroke={color}
          strokeWidth={8}
          strokeDasharray={`${arcLen} ${circ}`}
          strokeDashoffset={offset}
          transform={`rotate(135 ${center} ${center})`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.3s, stroke 0.3s' }}
        />
        <text x={center} y={center - 4} textAnchor="middle" fill={colors.text.primary} fontSize={20} fontWeight={700}>
          {Math.round(pct)}
        </text>
        <text x={center} y={center + 14} textAnchor="middle" fill={colors.text.muted} fontSize={11}>
          {unit}
        </text>
      </svg>
      <div style={{ fontSize: 11, color: colors.text.secondary, marginTop: 4 }}>{label}</div>
    </div>
  );
}
