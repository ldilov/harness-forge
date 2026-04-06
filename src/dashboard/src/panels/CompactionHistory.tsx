import { useMemo } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { BarChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { Panel } from '../components/Panel';
import type { DashboardEvent } from '../state/types';
import { colors } from '../styles/theme';

echarts.use([BarChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer]);

interface CompactionHistoryProps {
  readonly events: readonly DashboardEvent[];
}

export function CompactionHistory({ events }: CompactionHistoryProps) {
  const option = useMemo(() => {
    const compactions = events
      .filter((e) => e.eventType.includes('compaction.completed') && e.payload.tokensBeforeAfter)
      .slice(-20);

    const categories = compactions.map((_, i) => `#${i + 1}`);
    const before = compactions.map((e) => (e.payload.tokensBeforeAfter as Record<string, number>)?.before ?? 0);
    const after = compactions.map((e) => (e.payload.tokensBeforeAfter as Record<string, number>)?.after ?? 0);

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis' as const,
        confine: true,
        transitionDuration: 0.1,
        backgroundColor: colors.bg.card,
        borderColor: colors.border.subtle,
        textStyle: { color: colors.text.primary, fontSize: 11 },
        formatter: (params: unknown) => {
          const items = (Array.isArray(params) ? params : [params]) as Array<{
            axisValueLabel?: string;
            seriesName?: string;
            data?: unknown[];
            color?: string;
            value?: unknown;
          }>;
          const time = items[0]?.axisValueLabel ?? '';
          const lines = items.map((item) => {
            const val = Array.isArray(item.data) ? item.data[1] : item.value;
            const dot = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${String(item.color)};margin-right:6px"></span>`;
            const name = item.seriesName ? `<span style="color:${colors.text.secondary};margin-right:8px">${item.seriesName}</span>` : '';
            return `<div style="display:flex;align-items:center;gap:2px">${dot}${name}<b>${typeof val === 'number' ? val.toLocaleString() : String(val ?? '')}</b></div>`;
          });
          return `<div style="font-size:10px;color:${colors.text.muted};margin-bottom:4px">${time}</div>${lines.join('')}`;
        },
      },
      legend: {
        data: ['Before', 'After'],
        textStyle: { color: colors.text.muted, fontSize: 10 },
        top: 0,
      },
      grid: { top: 30, right: 20, bottom: 30, left: 50 },
      xAxis: {
        type: 'category' as const,
        data: categories,
        axisLabel: { color: colors.text.muted, fontSize: 10 },
        axisLine: { lineStyle: { color: colors.border.subtle } },
      },
      yAxis: {
        type: 'value' as const,
        axisLabel: { color: colors.text.muted, fontSize: 10 },
        axisLine: { lineStyle: { color: colors.border.subtle } },
        splitLine: { lineStyle: { color: colors.border.subtle, type: 'dashed' as const } },
      },
      series: [
        { name: 'Before', type: 'bar' as const, data: before, itemStyle: { color: colors.accent.magenta }, barGap: '10%' },
        { name: 'After', type: 'bar' as const, data: after, itemStyle: { color: colors.accent.lavender } },
      ],
    };
  }, [events]);

  return (
    <Panel title="Compaction History" subtitle="Tokens before/after each compaction">
      <ReactEChartsCore echarts={echarts} option={option} style={{ height: 200 }} notMerge />
    </Panel>
  );
}
