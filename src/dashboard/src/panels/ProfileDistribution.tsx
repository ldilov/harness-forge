import { useMemo } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { PieChart } from 'echarts/charts';
import { TooltipComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { Panel } from '../components/Panel';
import type { DashboardEvent } from '../state/types';
import { colors } from '../styles/theme';

echarts.use([PieChart, TooltipComponent, LegendComponent, CanvasRenderer]);

interface ProfileDistributionProps {
  readonly events: readonly DashboardEvent[];
}

export function ProfileDistribution({ events }: ProfileDistributionProps) {
  const option = useMemo(() => {
    const counts: Record<string, number> = { brief: 0, standard: 0, deep: 0 };
    for (const e of events) {
      if (e.eventType === 'response.profile.selected') {
        const profile = (e.payload.profile as string) ?? 'standard';
        counts[profile] = (counts[profile] ?? 0) + 1;
      }
    }

    const data = [
      { value: counts.brief ?? 0, name: 'Brief', itemStyle: { color: colors.accent.mint } },
      { value: counts.standard ?? 0, name: 'Standard', itemStyle: { color: colors.accent.amber } },
      { value: counts.deep ?? 0, name: 'Deep', itemStyle: { color: colors.accent.violet } },
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
        radius: ['40%', '65%'],
        data,
        label: { show: true, color: colors.text.secondary, fontSize: 10 },
      }],
    };
  }, [events]);

  return (
    <Panel title="Response Profile" subtitle="Distribution of brief / standard / deep">
      <ReactEChartsCore echarts={echarts} option={option} style={{ height: 160 }} notMerge />
    </Panel>
  );
}
