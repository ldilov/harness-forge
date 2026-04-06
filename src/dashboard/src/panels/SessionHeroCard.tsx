import { useState, useEffect, useMemo, type CSSProperties } from 'react';
import { Sparkline } from '../components/Sparkline';
import type { DashboardState } from '../state/types';
import { colors, spacing, radius } from '../styles/theme';

interface SessionHeroCardProps {
  readonly state: DashboardState;
}

const cardStyle: CSSProperties = {
  background: colors.bg.card,
  border: `1px solid ${colors.border.subtle}`,
  borderRadius: radius.lg,
  padding: spacing.lg,
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: spacing.xl,
};

const labelStyle: CSSProperties = {
  fontSize: 10,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: colors.text.muted,
  marginBottom: 4,
};

const valueStyle: CSSProperties = {
  fontSize: 36,
  fontWeight: 700,
  lineHeight: 1.2,
};

const secondaryValueStyle: CSSProperties = {
  fontSize: 28,
  fontWeight: 700,
  lineHeight: 1.2,
};

const subtitleStyle: CSSProperties = {
  fontSize: 11,
  color: colors.text.secondary,
  marginTop: 4,
};

const metricRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

const ERROR_SUFFIXES = ['.failed', '.exceeded', '.rejected', '.denied'] as const;

function formatNumber(n: number): string {
  return n >= 1_000 ? n.toLocaleString() : String(n);
}

export function SessionHeroCard({ state }: SessionHeroCardProps) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { events, sessionInfo } = state;

  const totalEvents = events.length;

  const sparkData = useMemo(() => {
    const bucketCount = 30;
    const bucketMs = 10_000;
    const buckets = new Array<number>(bucketCount).fill(0);
    const windowStart = now - bucketCount * bucketMs;
    for (const e of events) {
      const t = new Date(e.occurredAt).getTime();
      if (t >= windowStart) {
        const idx = Math.min(
          Math.floor((t - windowStart) / bucketMs),
          bucketCount - 1,
        );
        buckets[idx] = (buckets[idx] ?? 0) + 1;
      }
    }
    return buckets;
  }, [events, now]);

  const startTime = sessionInfo.startTime
    ? new Date(sessionInfo.startTime).getTime()
    : now;
  const durationSec = Math.max(0, Math.floor((now - startTime) / 1000));
  const durationStr =
    durationSec >= 3600
      ? `${Math.floor(durationSec / 3600)}h ${Math.floor((durationSec % 3600) / 60)}m`
      : `${Math.floor(durationSec / 60)}m ${durationSec % 60}s`;
  const startTimeStr = sessionInfo.startTime
    ? new Date(sessionInfo.startTime).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '--:--';

  const errorCount = useMemo(
    () =>
      events.filter((e) =>
        ERROR_SUFFIXES.some((suffix) => e.eventType.endsWith(suffix)),
      ).length,
    [events],
  );

  const fiveMinAgo = now - 300_000;
  const recentEvents = useMemo(
    () => events.filter((e) => new Date(e.occurredAt).getTime() >= fiveMinAgo),
    [events, fiveMinAgo],
  );
  const eventsPerMin =
    recentEvents.length > 0
      ? Math.round((recentEvents.length / 5) * 10) / 10
      : 0;

  const rateSparkData = useMemo(() => {
    return sparkData.map((v) => v * 6);
  }, [sparkData]);

  const trend = useMemo(() => {
    const mid = Math.floor(sparkData.length / 2);
    const firstHalf = sparkData.slice(0, mid).reduce((a, b) => a + b, 0);
    const secondHalf = sparkData.slice(mid).reduce((a, b) => a + b, 0);
    if (secondHalf > firstHalf) return 'up' as const;
    if (secondHalf < firstHalf) return 'down' as const;
    return 'flat' as const;
  }, [sparkData]);

  const trendArrow = trend === 'up' ? '\u25B2' : trend === 'down' ? '\u25BC' : '';
  const trendColor =
    trend === 'up' ? colors.accent.mint : trend === 'down' ? colors.accent.coral : colors.text.muted;

  return (
    <div style={cardStyle}>
      <div>
        <div style={labelStyle}>Total Events</div>
        <div style={metricRowStyle}>
          <span style={{ ...valueStyle, color: colors.accent.mint }}>
            {formatNumber(totalEvents)}
          </span>
          <Sparkline data={sparkData} width={80} height={24} color={colors.accent.mint} />
        </div>
        <div style={subtitleStyle}>session total</div>
      </div>

      <div>
        <div style={labelStyle}>Session Duration</div>
        <div style={{ ...valueStyle, color: colors.text.primary }}>
          {durationStr}
        </div>
        <div style={subtitleStyle}>started {startTimeStr}</div>
      </div>

      <div>
        <div style={labelStyle}>Errors</div>
        <div style={metricRowStyle}>
          <span
            style={{
              ...secondaryValueStyle,
              color: errorCount > 0 ? colors.accent.coral : colors.accent.mint,
            }}
          >
            {errorCount}
          </span>
          <span style={{ fontSize: 18 }}>
            {errorCount === 0 ? '\u2713' : ''}
          </span>
        </div>
        <div style={subtitleStyle}>
          {errorCount === 0 ? 'healthy' : `${errorCount} issue${errorCount !== 1 ? 's' : ''}`}
        </div>
      </div>

      <div>
        <div style={labelStyle}>Events/Min</div>
        <div style={metricRowStyle}>
          <span style={{ ...secondaryValueStyle, color: colors.text.primary }}>
            {eventsPerMin}/min
          </span>
          <Sparkline data={rateSparkData} width={60} height={24} color={colors.accent.mint} />
        </div>
        <div style={subtitleStyle}>
          {trendArrow && (
            <span style={{ color: trendColor, marginRight: 4 }}>{trendArrow}</span>
          )}
          {trend === 'flat' ? 'stable' : 'trending'}
        </div>
      </div>
    </div>
  );
}
