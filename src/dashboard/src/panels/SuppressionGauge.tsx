import { useMemo, type CSSProperties } from 'react';
import { Panel } from '../components/Panel';
import { Gauge } from '../components/Gauge';
import type { DashboardEvent } from '../state/types';
import { colors } from '../styles/theme';

interface SuppressionGaugeProps {
  readonly events: readonly DashboardEvent[];
}

const logStyle: CSSProperties = {
  maxHeight: 150,
  overflow: 'auto',
  fontSize: 11,
  marginTop: 12,
};

const logRowStyle: CSSProperties = {
  padding: '4px 0',
  borderBottom: `1px solid ${colors.border.subtle}`,
  color: colors.text.secondary,
};

export function SuppressionGauge({ events }: SuppressionGaugeProps) {
  const { ratio, total, suppressed, logEntries } = useMemo(() => {
    let totalAll = 0, suppressedAll = 0;
    const entries: { path: string; reason: string }[] = [];
    for (const e of events) {
      if (e.eventType === 'context.duplicate.suppressed') {
        const sc = e.payload.suppressionCounts as Record<string, number> | undefined;
        if (sc) {
          totalAll += sc.total ?? 0;
          suppressedAll += sc.suppressed ?? 0;
        }
        const suppSources = e.payload.suppressedSources as Array<Record<string, string>> | undefined;
        if (suppSources) {
          for (const s of suppSources.slice(-5)) {
            entries.push({ path: s.path ?? '', reason: s.reason ?? '' });
          }
        }
      }
    }
    return {
      ratio: totalAll > 0 ? (suppressedAll / totalAll) * 100 : 0,
      total: totalAll,
      suppressed: suppressedAll,
      logEntries: entries.slice(-10),
    };
  }, [events]);

  return (
    <Panel title="Duplicate Suppression" subtitle={`${suppressed}/${total} sources suppressed`}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <Gauge
          value={ratio}
          max={100}
          label="Suppression Ratio"
          size={100}
          thresholds={[
            { at: 0, color: colors.accent.mint },
            { at: 30, color: colors.accent.amber },
            { at: 60, color: colors.accent.peach },
          ]}
        />
        <div style={logStyle}>
          {logEntries.length === 0 && <div style={{ color: colors.text.muted }}>No suppressions yet</div>}
          {logEntries.map((entry, i) => (
            <div key={i} style={logRowStyle}>
              <span style={{ color: colors.accent.peach }}>{entry.path}</span>
              {entry.reason && <span style={{ color: colors.text.muted }}> — {entry.reason}</span>}
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}
