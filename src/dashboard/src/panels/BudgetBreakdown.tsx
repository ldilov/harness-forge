import { useMemo } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { PieChart } from 'echarts/charts';
import { TooltipComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { Panel } from '../components/Panel';
import { colors } from '../styles/theme';

echarts.use([PieChart, TooltipComponent, LegendComponent, CanvasRenderer]);

interface BudgetBreakdownProps {
  readonly budget: Record<string, unknown> | null;
}

export function BudgetBreakdown({ budget }: BudgetBreakdownProps) {
  const option = useMemo(() => {
    const budgets = (budget?.budgets ?? {}) as Record<string, number>;
    const data = [
      { value: budgets.maxHotPathInputTokens ?? 120000, name: 'Hot Path Input', itemStyle: { color: colors.accent.coral } },
      { value: budgets.reservedOutputTokens ?? 12000, name: 'Reserved Output', itemStyle: { color: colors.accent.lavender } },
      { value: budgets.reservedToolTokens ?? 8000, name: 'Reserved Tools', itemStyle: { color: colors.accent.amber } },
      { value: budgets.reservedSafetyMargin ?? 10000, name: 'Safety Margin', itemStyle: { color: colors.accent.mint } },
    ];

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item' as const,
        confine: true,
        transitionDuration: 0.1,
        backgroundColor: colors.bg.card,
        borderColor: colors.border.subtle,
        textStyle: { color: colors.text.primary, fontSize: 11 },
        formatter: (params: unknown) => {
          const p = params as { name?: string; value?: number; percent?: number; color?: string };
          const dot = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${String(p.color)};margin-right:6px"></span>`;
          return `<div style="display:flex;align-items:center;gap:4px">${dot}<b>${p.name ?? ''}</b></div><div style="margin-top:2px;color:${colors.text.secondary}">${(p.value ?? 0).toLocaleString()} (${(p.percent ?? 0).toFixed(1)}%)</div>`;
        },
      },
      series: [{
        type: 'pie' as const,
        radius: ['45%', '70%'],
        center: ['50%', '50%'],
        data,
        label: { show: false },
        emphasis: {
          label: { show: true, color: colors.text.primary, fontSize: 12 },
        },
      }],
    };
  }, [budget]);

  return (
    <Panel title="Budget Breakdown" subtitle="Token allocation by category" tooltip="How the context window is divided. 'Hot Path Input' is the main conversation, 'Reserved Output' is reserved for the agent's response, 'Reserved Tools' is for tool calls, 'Safety Margin' prevents overflow. If hot-path is too high, compaction kicks in.">
      <ReactEChartsCore echarts={echarts} option={option} style={{ height: 200 }} notMerge />
      <div style={{ fontSize: 10, color: colors.text.muted, marginTop: 6 }}>
        Hot-path = main conversation | Output = agent response reserve | Tools = tool call budget | Safety = overflow protection
      </div>
    </Panel>
  );
}
