import type { CSSProperties } from 'react';
import type { ConnectionState } from '../state/types';
import { colors } from '../styles/theme';

interface ConnectionStatusProps {
  readonly state: ConnectionState;
}

const statusColors: Record<ConnectionState, string> = {
  connected: colors.accent.mint,
  connecting: colors.accent.amber,
  reconnecting: colors.accent.peach,
  disconnected: colors.accent.coral,
};

const labels: Record<ConnectionState, string> = {
  connected: 'Connected',
  connecting: 'Connecting...',
  reconnecting: 'Reconnecting...',
  disconnected: 'Disconnected',
};

const containerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontSize: 12,
};

export function ConnectionStatus({ state }: ConnectionStatusProps) {
  const color = statusColors[state];
  return (
    <div style={containerStyle}>
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: color,
          boxShadow: `0 0 6px ${color}`,
        }}
      />
      <span style={{ color }}>{labels[state]}</span>
    </div>
  );
}
