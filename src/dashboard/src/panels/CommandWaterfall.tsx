import { useMemo, type CSSProperties } from 'react';
import { Panel } from '../components/Panel';
import type { DashboardEvent } from '../state/types';
import { colors, radius } from '../styles/theme';

interface CommandWaterfallProps {
  readonly events: readonly DashboardEvent[];
}

interface CommandSpan {
  readonly command: string;
  readonly startTime: number;
  readonly endTime: number | null;
  readonly status: 'running' | 'completed' | 'failed';
  readonly durationMs: number | null;
  readonly error?: string;
}

const statusColors: Record<string, string> = {
  completed: colors.accent.mint,
  failed: colors.accent.coral,
  running: colors.accent.amber,
};

const rowStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '120px 1fr 70px',
  gap: 8,
  alignItems: 'center',
  padding: '4px 0',
  borderBottom: `1px solid ${colors.border.subtle}`,
  fontSize: 11,
};

const barContainerStyle: CSSProperties = {
  position: 'relative',
  height: 20,
  background: colors.bg.primary,
  borderRadius: radius.sm,
  overflow: 'hidden',
};

export function CommandWaterfall({ events }: CommandWaterfallProps) {
  const spans = useMemo(() => {
    const starts = new Map<string, DashboardEvent>();
    const result: CommandSpan[] = [];

    for (const e of events) {
      if (e.eventType === 'command.started') {
        const cmd = String((e.payload).command ?? 'unknown');
        starts.set(cmd, e);
      } else if (e.eventType === 'command.completed' || e.eventType === 'command.failed') {
        const cmd = String((e.payload).command ?? 'unknown');
        const startEvt = starts.get(cmd);
        const startTime = startEvt ? new Date(startEvt.occurredAt).getTime() : new Date(e.occurredAt).getTime();
        const endTime = new Date(e.occurredAt).getTime();
        starts.delete(cmd);
        result.push({
          command: cmd,
          startTime,
          endTime,
          status: e.eventType === 'command.completed' ? 'completed' : 'failed',
          durationMs: (e.payload).durationMs as number | null ?? (endTime - startTime),
          error: e.eventType === 'command.failed' ? String((e.payload).error ?? '') : undefined,
        });
      }
    }

    const now = Date.now();
    for (const [cmd, startEvt] of starts) {
      result.push({
        command: cmd,
        startTime: new Date(startEvt.occurredAt).getTime(),
        endTime: null,
        status: 'running',
        durationMs: null,
      });
    }

    return result.slice(-10);
  }, [events]);

  if (spans.length === 0) {
    return (
      <Panel title="Command Activity" subtitle="CLI command execution timeline">
        <div style={{ padding: 20, textAlign: 'center', color: colors.text.muted, fontSize: 12 }}>
          No command events yet
        </div>
      </Panel>
    );
  }

  const minTime = Math.min(...spans.map((s) => s.startTime));
  const maxTime = Math.max(...spans.map((s) => s.endTime ?? Date.now()));
  const totalRange = Math.max(maxTime - minTime, 1);

  return (
    <Panel title="Command Activity" subtitle="CLI command execution timeline">
      <div style={{ maxHeight: 240, overflowY: 'auto' }}>
        {spans.map((span, i) => {
          const leftPct = ((span.startTime - minTime) / totalRange) * 100;
          const widthPct = Math.max(
            (((span.endTime ?? Date.now()) - span.startTime) / totalRange) * 100,
            2,
          );
          const barColor = statusColors[span.status] ?? colors.text.muted;

          return (
            <div key={`${span.command}-${i}`} style={rowStyle}>
              <span style={{
                color: colors.text.secondary,
                fontFamily: 'monospace',
                fontSize: 10,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {span.command}
              </span>
              <div style={barContainerStyle}>
                <div
                  style={{
                    position: 'absolute',
                    left: `${leftPct}%`,
                    width: `${widthPct}%`,
                    height: '100%',
                    background: barColor,
                    borderRadius: radius.sm,
                    opacity: 0.8,
                    transition: 'width 0.3s ease',
                  }}
                  title={span.error ?? `${span.command}: ${span.durationMs ? `${span.durationMs}ms` : 'running...'}`}
                />
              </div>
              <span style={{
                color: barColor,
                fontSize: 10,
                textAlign: 'right',
                fontFamily: 'monospace',
              }}>
                {span.durationMs !== null
                  ? span.durationMs < 1000
                    ? `${span.durationMs}ms`
                    : `${(span.durationMs / 1000).toFixed(1)}s`
                  : 'running'}
              </span>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
