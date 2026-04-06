import { useMemo } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, MarkLineComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { Panel } from '../components/Panel';
import { colors } from '../styles/theme';

echarts.use([LineChart, GridComponent, TooltipComponent, MarkLineComponent, CanvasRenderer]);

interface EffectivenessTrendProps {
  readonly scores: readonly number[];
}

export function EffectivenessTrend({ scores }: EffectivenessTrendProps) {
  const option = useMemo(() => {
    const data = scores.map((score, i) => [i + 1, score]);

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis' as const,
        backgroundColor: colors.bg.card,
        borderColor: colors.border.subtle,
        textStyle: { color: colors.text.primary, fontSize: 11 },
        formatter: (params: unknown) => {
          const arr = params as ReadonlyArray<{
            data: readonly [number, number];
          }>;
          const point = arr[0];
          if (!point) return '';
          const [session, score] = point.data;
          return `<div style="font-size:10px;color:${colors.text.muted}">Session ${String(session)}</div><div style="font-weight:700;color:${colors.accent.mint}">${String(score)}</div>`;
        },
      },
      grid: { top: 20, right: 20, bottom: 30, left: 40 },
      xAxis: {
        type: 'value' as const,
        name: 'Session',
        nameLocation: 'center' as const,
        nameGap: 20,
        nameTextStyle: { color: colors.text.muted, fontSize: 10 },
        min: 1,
        max: Math.max(scores.length, 20),
        axisLine: { lineStyle: { color: colors.border.subtle } },
        axisLabel: { color: colors.text.muted, fontSize: 10 },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'value' as const,
        min: 0,
        max: 100,
        axisLine: { lineStyle: { color: colors.border.subtle } },
        axisLabel: { color: colors.text.muted, fontSize: 10 },
        splitLine: { lineStyle: { color: colors.chart.gridLine, type: 'dashed' as const } },
      },
      series: [
        {
          type: 'line' as const,
          data,
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { color: colors.accent.mint, width: 2 },
          itemStyle: { color: colors.accent.mint },
          areaStyle: { color: colors.chart.areaFill },
          markLine: {
            silent: true,
            symbol: 'none',
            lineStyle: { color: colors.accent.peach, type: 'dashed' as const, width: 1 },
            data: [{ yAxis: 70, label: { formatter: 'Good', color: colors.accent.peach, fontSize: 10 } }],
          },
        },
      ],
    };
  }, [scores]);

  return (
    <Panel title={'\uD83D\uDCC8 Effectiveness Trend'} subtitle="Session scores over time">
      <ReactEChartsCore
        echarts={echarts}
        option={option}
        style={{ height: 200 }}
        notMerge
      />
    </Panel>
  );
}
