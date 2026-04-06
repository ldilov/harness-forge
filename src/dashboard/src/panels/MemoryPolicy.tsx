import type { CSSProperties } from 'react';
import { Panel } from '../components/Panel';
import { colors } from '../styles/theme';

interface MemoryPolicyProps {
  readonly budget: Record<string, unknown> | null;
}

const tableStyle: CSSProperties = {
  width: '100%',
  fontSize: 12,
  borderCollapse: 'collapse' as const,
};

const cellStyle: CSSProperties = {
  padding: '6px 8px',
  borderBottom: `1px solid ${colors.border.subtle}`,
};

const labelCellStyle: CSSProperties = {
  ...cellStyle,
  color: colors.text.secondary,
  fontWeight: 500,
};

const valueCellStyle: CSSProperties = {
  ...cellStyle,
  color: colors.text.primary,
  textAlign: 'right' as const,
};

export function MemoryPolicy({ budget }: MemoryPolicyProps) {
  const budgets = (budget?.budgets ?? {}) as Record<string, number>;
  const thresholds = (budget?.thresholds ?? {}) as Record<string, number>;
  const model = (budget?.model ?? {}) as Record<string, unknown>;

  const rows = [
    ['Model', model.name ?? 'Unknown'],
    ['Context Window', `${(model.contextWindowTokens as number ?? 200000).toLocaleString()} tokens`],
    ['Max Hot Path', `${(budgets.maxHotPathInputTokens ?? 120000).toLocaleString()} tokens`],
    ['Hard Cap', `${(budgets.reservedSafetyMargin ?? 10000).toLocaleString()} tokens`],
    ['Evaluate At', `${((thresholds.evaluateAt ?? 0.7) * 100).toFixed(0)}%`],
    ['Trim At', `${((thresholds.trimAt ?? 0.8) * 100).toFixed(0)}%`],
    ['Summarize At', `${((thresholds.summarizeAt ?? 0.88) * 100).toFixed(0)}%`],
    ['Rollup At', `${((thresholds.rollupAt ?? 0.93) * 100).toFixed(0)}%`],
    ['Rollover At', `${((thresholds.rolloverAt ?? 0.96) * 100).toFixed(0)}%`],
  ];

  return (
    <Panel title="Memory Policy" subtitle="Current policy values and thresholds">
      <table style={tableStyle}>
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label}>
              <td style={labelCellStyle}>{label}</td>
              <td style={valueCellStyle}>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}
