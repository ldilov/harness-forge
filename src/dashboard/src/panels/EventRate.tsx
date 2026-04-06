import { useMemo, useRef, useEffect, useCallback } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, MarkLineComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { Panel } from '../components/Panel';
import type { DashboardEvent } from '../state/types';
import { colors, getCategoryEmoji } from '../styles/theme';
import { useDashboardContext } from '../state/DashboardContext';

echarts.use([LineChart, GridComponent, TooltipComponent, MarkLineComponent, CanvasRenderer]);

interface EventRateProps {
  readonly events: readonly DashboardEvent[];
}

export function EventRate({ events }: EventRateProps) {
  const chartRef = useRef<ReactEChartsCore>(null);
  const { hoveredTimestamp, setHoveredTimestamp, compareMode } = useDashboardContext();

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
    // Group events into 1-minute buckets
    const buckets = new Map<number, number>();
    for (const e of events) {
      const t = Math.floor(new Date(e.occurredAt).getTime() / 60000) * 60000;
      buckets.set(t, (buckets.get(t) ?? 0) + 1);
    }
    const data = [...buckets.entries()]
      .sort(([a], [b]) => a - b)
      .slice(-30)
      .map(([t, count]) => [t, count]);

    const annotations = events
      .filter((e) =>
        e.eventType.includes('compaction.completed') ||
        e.eventType.includes('rotation.completed') ||
        e.eventType.endsWith('.failed') ||
        e.eventType.endsWith('.exceeded')
      )
      .slice(-10)
      .map((e) => ({
        xAxis: new Date(e.occurredAt).getTime(),
        label: {
          formatter: getCategoryEmoji(e.eventType),
          position: 'start' as const,
          fontSize: 11,
        },
        lineStyle: {
          color: e.eventType.endsWith('.failed') || e.eventType.endsWith('.exceeded')
            ? colors.accent.coral
            : colors.accent.mint,
          type: 'dashed' as const,
          opacity: 0.4,
        },
      }));

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
      grid: { top: 10, right: 20, bottom: 30, left: 40 },
      xAxis: {
        type: 'time' as const,
        axisLabel: { color: colors.text.muted, fontSize: 10 },
        axisLine: { lineStyle: { color: colors.border.subtle } },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'value' as const,
        axisLabel: { color: colors.text.muted, fontSize: 10 },
        splitLine: { lineStyle: { color: colors.border.subtle, type: 'dashed' as const } },
      },
      series: (() => {
        const primarySeries = {
          type: 'line' as const,
          data,
          smooth: true,
          areaStyle: { color: `${colors.accent.peach}20` },
          lineStyle: { color: colors.accent.peach, width: 2 },
          itemStyle: { color: colors.accent.peach },
          showSymbol: false,
          name: 'Current',
          markLine: {
            silent: true,
            symbol: 'none',
            data: annotations,
          },
        };

        const result: unknown[] = [primarySeries];

        if (compareMode && data.length > 4) {
          const mid = Math.floor(data.length / 2);
          const prevData = data.slice(0, mid);
          const currStart = (data[mid] as [number, number])?.[0] ?? 0;
          const prevStart = (prevData[0] as [number, number])?.[0] ?? 0;
          const timeShift = currStart - prevStart;
          const shiftedPrev = prevData.map((point) => [(point[0] ?? 0) + timeShift, point[1] ?? 0]);

          result.push({
            type: 'line' as const,
            data: shiftedPrev,
            smooth: true,
            lineStyle: { color: colors.text.muted, width: 1.5, type: 'dashed' as const, opacity: 0.4 },
            areaStyle: undefined,
            showSymbol: false,
            silent: true,
            name: 'Previous',
          });
        }

        return result;
      })(),
    };
  }, [events, compareMode]);

  return (
    <Panel title="Event Rate" subtitle="Events per minute">
      <ReactEChartsCore
        ref={chartRef}
        echarts={echarts}
        option={option}
        style={{ height: 160 }}
        notMerge
        onEvents={{ mousemove: onChartMouseMove, globalout: onChartMouseOut }}
      />
    </Panel>
  );
}
