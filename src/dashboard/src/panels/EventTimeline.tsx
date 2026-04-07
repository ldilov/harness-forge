import { useMemo, useRef, useEffect, useCallback } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { ScatterChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, DataZoomComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { Panel } from '../components/Panel';
import type { DashboardEvent } from '../state/types';
import { colors, getCategoryColor } from '../styles/theme';
import { useDashboardContext } from '../state/DashboardContext';

echarts.use([ScatterChart, GridComponent, TooltipComponent, DataZoomComponent, CanvasRenderer]);

function getColor(eventType: string): string {
  return getCategoryColor(eventType);
}

interface EventTimelineProps {
  readonly events: readonly DashboardEvent[];
}

export function EventTimeline({ events }: EventTimelineProps) {
  const chartRef = useRef<ReactEChartsCore>(null);
  const { hoveredTimestamp, setHoveredTimestamp } = useDashboardContext();

  const onChartMouseMove = useCallback((params: Record<string, unknown>) => {
    const data = params.data as unknown[] | undefined;
    if (Array.isArray(data) && typeof data[0] === 'number') {
      setHoveredTimestamp(data[0]);
    }
  }, [setHoveredTimestamp]);

  const onChartMouseOut = useCallback(() => {
    setHoveredTimestamp(null);
  }, [setHoveredTimestamp]);

  useEffect(() => {
    const chart = chartRef.current?.getEchartsInstance();
    if (!chart || hoveredTimestamp === null) return;
    const opt = chart.getOption() as { series?: Array<{ data?: unknown[][] }> };
    const seriesData = opt.series?.[0]?.data;
    if (!seriesData?.length) return;
    let nearestIdx = 0;
    let nearestDist = Infinity;
    for (let i = 0; i < seriesData.length; i++) {
      const t = seriesData[i]?.[0] as number;
      const dist = Math.abs(t - hoveredTimestamp);
      if (dist < nearestDist) { nearestDist = dist; nearestIdx = i; }
    }
    chart.dispatchAction({ type: 'showTip', seriesIndex: 0, dataIndex: nearestIdx });
    return () => { chart.dispatchAction({ type: 'hideTip' }); };
  }, [hoveredTimestamp]);

  const option = useMemo(() => {
    const data = events.slice(-500).map((e, i) => ({
      value: [new Date(e.occurredAt).getTime(), i % 5],
      itemStyle: { color: getColor(e.eventType) },
      name: e.eventType,
    }));

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
          const p = params as { data?: { eventType?: string; occurredAt?: string }; color?: string };
          const d = p.data;
          const dot = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${String(p.color)};margin-right:6px"></span>`;
          const time = d?.occurredAt ? new Date(d.occurredAt).toLocaleTimeString() : '';
          return `<div style="font-size:10px;color:${colors.text.muted};margin-bottom:4px">${time}</div><div style="display:flex;align-items:center">${dot}<b>${d?.eventType ?? ''}</b></div>`;
        },
      },
      grid: { top: 10, right: 20, bottom: 40, left: 60 },
      xAxis: {
        type: 'time' as const,
        axisLine: { lineStyle: { color: colors.border.subtle } },
        axisLabel: { color: colors.text.muted, fontSize: 10 },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'value' as const,
        show: false,
        min: -1,
        max: 6,
      },
      dataZoom: [{ type: 'inside' as const, start: 0, end: 100 }],
      series: [{
        type: 'scatter' as const,
        symbolSize: 8,
        data,
      }],
    };
  }, [events]);

  return (
    <Panel title="Event Timeline" subtitle="All events plotted over time — scroll to zoom" tooltip="Every decision the harness makes, plotted over time. Colors represent categories: green=memory, yellow=budget, purple=compaction, teal=subagent. Click a dot to see the full event details.">
      <ReactEChartsCore
        ref={chartRef}
        echarts={echarts}
        option={option}
        style={{ height: 180 }}
        notMerge
        onEvents={{ mousemove: onChartMouseMove, globalout: onChartMouseOut }}
      />
    </Panel>
  );
}
