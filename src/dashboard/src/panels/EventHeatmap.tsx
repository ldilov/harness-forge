import { useMemo } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { HeatmapChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, VisualMapComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { Panel } from '../components/Panel';
import type { DashboardEvent } from '../state/types';
import { colors, getCategoryFromEventType } from '../styles/theme';

echarts.use([HeatmapChart, GridComponent, TooltipComponent, VisualMapComponent, CanvasRenderer]);

interface EventHeatmapProps {
  readonly events: readonly DashboardEvent[];
}

export function EventHeatmap({ events }: EventHeatmapProps) {
  const option = useMemo(() => {
    const now = Date.now();
    const bucketMs = 10_000;
    const bucketCount = 30;
    const windowStart = now - bucketCount * bucketMs;

    const categorySet = new Set<string>();
    for (const e of events) {
      const cat = getCategoryFromEventType(e.eventType);
      if (cat) categorySet.add(cat);
    }
    const categories = [...categorySet].sort();
    if (categories.length === 0) return { series: [] };

    const catIndex = new Map(categories.map((c, i) => [c, i]));

    const grid = new Map<string, number>();
    let maxVal = 0;
    for (const e of events) {
      const t = new Date(e.occurredAt).getTime();
      if (t < windowStart) continue;
      const xIdx = Math.min(Math.floor((t - windowStart) / bucketMs), bucketCount - 1);
      const yIdx = catIndex.get(getCategoryFromEventType(e.eventType));
      if (yIdx === undefined) continue;
      const key = `${xIdx}-${yIdx}`;
      const val = (grid.get(key) ?? 0) + 1;
      grid.set(key, val);
      if (val > maxVal) maxVal = val;
    }

    const data: [number, number, number][] = [];
    for (let x = 0; x < bucketCount; x++) {
      for (let y = 0; y < categories.length; y++) {
        data.push([x, y, grid.get(`${x}-${y}`) ?? 0]);
      }
    }

    const timeLabels = Array.from({ length: bucketCount }, (_, i) => {
      const t = new Date(windowStart + i * bucketMs);
      return t.toLocaleTimeString([], { minute: '2-digit', second: '2-digit' });
    });

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
          const p = params as { data?: [number, number, number] };
          const d = p.data;
          if (!d) return '';
          const cat = categories[d[1]] ?? '';
          const count = d[2];
          const time = timeLabels[d[0]] ?? '';
          return `<div style="color:${colors.text.muted};font-size:10px">${time}</div><div><b>${cat}</b>: ${count} event${count !== 1 ? 's' : ''}</div>`;
        },
      },
      grid: { top: 10, right: 40, bottom: 24, left: 80 },
      xAxis: {
        type: 'category' as const,
        data: timeLabels,
        axisLabel: { color: colors.text.muted, fontSize: 9, interval: 4 },
        axisLine: { lineStyle: { color: colors.border.subtle } },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'category' as const,
        data: categories,
        axisLabel: { color: colors.text.secondary, fontSize: 10 },
        axisLine: { lineStyle: { color: colors.border.subtle } },
        splitLine: { show: false },
      },
      visualMap: {
        min: 0,
        max: Math.max(maxVal, 1),
        calculable: false,
        orient: 'vertical' as const,
        right: 0,
        top: 'center',
        itemWidth: 10,
        itemHeight: 80,
        textStyle: { color: colors.text.muted, fontSize: 9 },
        inRange: {
          color: [colors.bg.secondary, colors.accent.mint],
        },
      },
      series: [{
        type: 'heatmap' as const,
        data,
        emphasis: {
          itemStyle: { borderColor: colors.accent.mint, borderWidth: 1 },
        },
      }],
    };
  }, [events]);

  return (
    <Panel title="Event Density" subtitle="Event activity by category over time (10s buckets)">
      <ReactEChartsCore echarts={echarts} option={option} style={{ height: 160 }} notMerge />
    </Panel>
  );
}
