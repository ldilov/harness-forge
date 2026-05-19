import type { CSSProperties } from 'react';
import { Panel } from '../components/Panel';
import { colors, spacing, radius } from '../styles/theme';
import type { SentinelPolicy } from '../hooks/useSentinelData';

interface SentinelAuthorityMapProps {
  readonly policy: SentinelPolicy | null;
}

const containerStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: spacing.md,
  fontSize: 11,
};

const sectionStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  padding: spacing.sm,
  borderRadius: radius.md,
  background: colors.bg.cardHover,
  border: `1px solid ${colors.border.subtle}`,
};

const labelStyle: CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  textTransform: 'uppercase',
  color: colors.text.muted,
  letterSpacing: 0.5,
};

const valueStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: colors.text.primary,
};

const subStyle: CSSProperties = {
  fontSize: 10,
  color: colors.text.secondary,
};

const listStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  fontSize: 10,
  fontFamily: 'monospace',
  color: colors.text.secondary,
  marginTop: 2,
  maxHeight: 110,
  overflowY: 'auto',
};

const emptyStyle: CSSProperties = {
  fontSize: 12,
  color: colors.text.muted,
  padding: spacing.md,
  textAlign: 'center',
};

export function SentinelAuthorityMap({ policy }: SentinelAuthorityMapProps): JSX.Element {
  if (policy === null) {
    return (
      <Panel id="sentinel-authority-map" title="Sentinel Autonomy Posture" subtitle="Loading…">
        <div style={emptyStyle}>Loading effective policy…</div>
      </Panel>
    );
  }
  const profile = policy.activeProfile;
  return (
    <Panel
      id="sentinel-authority-map"
      title="Sentinel Autonomy Posture"
      subtitle={`profile=${profile.name} · default ${profile.defaultLevel} · per-monitor capability map: pending`}
      tooltip="Effective autonomy posture: profile (requireApproval + deny tags), cadence ceilings, budget caps, denied paths and commands. The full per-monitor capability mapping (spec FR-080) is a follow-up — capabilities are configured per-monitor in YAML and aren't aggregated yet."
    >
      <div style={containerStyle}>
        <div style={sectionStyle}>
          <span style={labelStyle}>Active Profile</span>
          <span style={valueStyle}>{profile.name}</span>
          <span style={subStyle}>
            default {profile.defaultLevel} · {policy.cadence.panicStop ? 'PANIC STOP ON' : 'panic-stop off'}
          </span>
          <span style={labelStyle}>Requires approval</span>
          <span style={subStyle}>{profile.requireApproval.join(', ') || '—'}</span>
          <span style={labelStyle}>Deny intent tags</span>
          <span style={subStyle}>{profile.deny.join(', ') || '—'}</span>
        </div>
        <div style={sectionStyle}>
          <span style={labelStyle}>Cadence</span>
          <span style={valueStyle}>
            {policy.cadence.maxMonitorRunsPerHour} runs/h · {policy.cadence.maxActionsPerHour} act/h
          </span>
          <span style={subStyle}>
            min {policy.cadence.globalMinIntervalSeconds}s · jitter ±{policy.cadence.perMonitorJitterPercent}%
          </span>
          <span style={labelStyle}>Budget</span>
          <span style={subStyle}>
            {policy.budget.llmTokensDaily} LLM/day · {policy.budget.npmRequestsPerHour} npm/h · {policy.budget.githubRequestsPerHour} gh/h
          </span>
        </div>
        <div style={sectionStyle}>
          <span style={labelStyle}>Denied Paths</span>
          <div style={listStyle}>
            {policy.deniedPaths.length === 0 ? (
              <span style={subStyle}>—</span>
            ) : (
              policy.deniedPaths.map((path) => <span key={path}>{path}</span>)
            )}
          </div>
        </div>
        <div style={sectionStyle}>
          <span style={labelStyle}>Denied Commands</span>
          <div style={listStyle}>
            {policy.deniedCommands.length === 0 ? (
              <span style={subStyle}>—</span>
            ) : (
              policy.deniedCommands.map((cmd) => <span key={cmd}>{cmd}</span>)
            )}
          </div>
        </div>
      </div>
    </Panel>
  );
}
