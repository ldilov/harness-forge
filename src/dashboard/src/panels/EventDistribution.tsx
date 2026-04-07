import { useMemo, useCallback } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { BarChart } from 'echarts/charts';
import { GridComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { Panel } from '../components/Panel';
import { colors, getCategoryFromEventType } from '../styles/theme';
import { useDashboardContext } from '../state/DashboardContext';

echarts.use([BarChart, GridComponent, TooltipComponent, CanvasRenderer]);

interface EventDistributionProps {
  readonly eventCounts: Record<string, number>;
}

export function EventDistribution({ eventCounts }: EventDistributionProps) {
  const { selectedCategory, setSelectedCategory } = useDashboardContext();

  const onChartClick = useCallback((params: Record<string, unknown>) => {
    const eventType = params.name as string;
    if (!eventType) return;
    const category = getCategoryFromEventType(eventType);
    setSelectedCategory(selectedCategory === category ? null : category);
  }, [selectedCategory, setSelectedCategory]);

  const option = useMemo(() => {
    const sorted = Object.entries(eventCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);

    const categories = sorted.map(([k]) => k);
    const values = sorted.map(([, v]) => v);

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
          const p = params as { name?: string; value?: number; color?: string };
          const dot = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${String(p.color)};margin-right:6px"></span>`;
          return `<div style="display:flex;align-items:center;gap:4px">${dot}<b>${p.name ?? ''}</b></div><div style="margin-top:2px;color:${colors.text.secondary}">${(p.value ?? 0).toLocaleString()} events</div>`;
        },
      },
      grid: { top: 10, right: 20, bottom: 10, left: 180 },
      xAxis: {
        type: 'value' as const,
        axisLabel: { color: colors.text.muted, fontSize: 10 },
        splitLine: { lineStyle: { color: colors.border.subtle, type: 'dashed' as const } },
      },
      yAxis: {
        type: 'category' as const,
        data: categories,
        axisLabel: { color: colors.text.secondary, fontSize: 10 },
        axisLine: { lineStyle: { color: colors.border.subtle } },
        inverse: true,
      },
      series: [{
        type: 'bar' as const,
        data: values,
        itemStyle: {
          color: (params: { name?: string }) => {
            const cat = getCategoryFromEventType(params.name ?? '');
            if (selectedCategory && cat !== selectedCategory) return colors.border.active;
            return colors.accent.violet;
          },
          borderRadius: [0, 4, 4, 0],
        },
        barWidth: 14,
      }],
    };
  }, [eventCounts, selectedCategory]);

  return (
    <Panel title="Event Distribution" subtitle="Top 10 event types by count" tooltip="Which event types fire most often. Click a bar to filter the timeline to that category. High compaction events may mean the context budget is too tight.">
      <ReactEChartsCore
        echarts={echarts}
        option={option}
        style={{ height: 200 }}
        notMerge
        onEvents={{ click: onChartClick }}
      />
    </Panel>
  );
}
