import { useState, useEffect, type CSSProperties } from 'react';
import type { DashboardState } from '../state/types';
import { colors, spacing } from '../styles/theme';

interface SessionInfoProps {
  readonly state: DashboardState;
}

const barStyle: CSSProperties = {
  display: 'flex',
  gap: spacing.xl,
  padding: `${spacing.md}px ${spacing.lg}px`,
  background: colors.bg.card,
  borderRadius: 8,
  border: `1px solid ${colors.border.subtle}`,
  fontSize: 12,
};

const labelStyle: CSSProperties = {
  color: colors.text.muted,
  marginRight: 6,
};

const valueStyle: CSSProperties = {
  color: colors.text.primary,
};

function formatDuration(startIso: string): string {
  const elapsed = Math.floor((Date.now() - new Date(startIso).getTime()) / 1000);
  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  return `${h}h ${m}m ${s}s`;
}

export function SessionInfo({ state }: SessionInfoProps) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const info = state.sessionInfo;

  return (
    <div style={barStyle}>
      <div><span style={labelStyle}>Session:</span><span style={valueStyle}>{info.sessionId || '—'}</span></div>
      <div><span style={labelStyle}>Started:</span><span style={valueStyle}>{info.startTime ? new Date(info.startTime).toLocaleTimeString() : '—'}</span></div>
      <div><span style={labelStyle}>Runtime:</span><span style={valueStyle}>{info.startTime ? formatDuration(info.startTime) : '—'}</span></div>
      <div><span style={labelStyle}>Version:</span><span style={valueStyle}>{info.harnessVersion || '—'}</span></div>
      <div><span style={labelStyle}>Events:</span><span style={valueStyle}>{state.events.length}</span></div>
    </div>
  );
}
