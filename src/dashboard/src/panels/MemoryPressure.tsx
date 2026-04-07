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

interface MemoryPressureProps {
  readonly events: readonly DashboardEvent[];
}

export function MemoryPressure({ events }: MemoryPressureProps) {
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
    const tokenEvents = events
      .filter((e) => e.payload.budgetState || e.payload.tokensBeforeAfter)
      .slice(-200);

    const data = tokenEvents.map((e) => {
      const tokens = (e.payload.budgetState as Record<string, number>)?.estimatedTokens ??
        (e.payload.tokensBeforeAfter as Record<string, number>)?.after ?? 0;
      return [new Date(e.occurredAt).getTime(), tokens];
    });

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
      grid: { top: 20, right: 20, bottom: 30, left: 60 },
      xAxis: {
        type: 'time' as const,
        axisLine: { lineStyle: { color: colors.border.subtle } },
        axisLabel: { color: colors.text.muted, fontSize: 10 },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'value' as const,
        axisLine: { lineStyle: { color: colors.border.subtle } },
        axisLabel: { color: colors.text.muted, fontSize: 10 },
        splitLine: { lineStyle: { color: colors.border.subtle, type: 'dashed' as const } },
      },
      series: (() => {
        const primarySeries = {
          type: 'line' as const,
          data,
          smooth: true,
          areaStyle: { color: `${colors.accent.magenta}20` },
          lineStyle: { color: colors.accent.magenta, width: 2 },
          itemStyle: { color: colors.accent.magenta },
          showSymbol: false,
          name: 'Current',
          markLine: {
            silent: true,
            lineStyle: { type: 'dashed' as const },
            data: [
              { yAxis: 2800, label: { formatter: '70%', color: colors.text.muted, fontSize: 9 }, lineStyle: { color: colors.threshold.safe } },
              { yAxis: 3200, label: { formatter: '80%', color: colors.text.muted, fontSize: 9 }, lineStyle: { color: colors.threshold.trim } },
              { yAxis: 3520, label: { formatter: '88%', color: colors.text.muted, fontSize: 9 }, lineStyle: { color: colors.threshold.summarize } },
              { yAxis: 3720, label: { formatter: '93%', color: colors.text.muted, fontSize: 9 }, lineStyle: { color: colors.threshold.rollup } },
              ...annotations,
            ],
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
    <Panel title="Memory Pressure" subtitle="Token usage over time with threshold lines" tooltip="How close the agent is to running out of context space. The lines show thresholds — when token usage crosses a threshold, the harness compacts (compresses) old context to make room. Lower is better.">
      <ReactEChartsCore
        ref={chartRef}
        echarts={echarts}
        option={option}
        style={{ height: 200 }}
        notMerge
        onEvents={{ mousemove: onChartMouseMove, globalout: onChartMouseOut }}
      />
      <div style={{ fontSize: 10, color: colors.text.muted, marginTop: 6 }}>
        Thresholds: 70% evaluate | 80% trim | 88% summarize | 93% rollup | 96% rollover
      </div>
    </Panel>
  );
}
