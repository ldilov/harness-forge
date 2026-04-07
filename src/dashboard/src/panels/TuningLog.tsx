import type { CSSProperties } from 'react';
import { Panel } from '../components/Panel';
import { colors, spacing, radius } from '../styles/theme';

interface Tuning {
  readonly id: string;
  readonly param: string;
  readonly oldValue: unknown;
  readonly newValue: unknown;
  readonly status: 'applied' | 'reverted';
}

interface TuningLogProps {
  readonly tunings: readonly Tuning[];
  readonly onRevert?: (tuningId: string) => void;
}

const listStyle: CSSProperties = {
  maxHeight: 300,
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.xs,
};

const headerRowStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '2fr 3fr 80px 70px',
  gap: spacing.sm,
  padding: `${spacing.xs}px ${spacing.sm}px`,
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase' as const,
  color: colors.text.muted,
  borderBottom: `1px solid ${colors.border.subtle}`,
};

const rowStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '2fr 3fr 80px 70px',
  gap: spacing.sm,
  padding: `${spacing.sm}px`,
  background: colors.bg.secondary,
  borderRadius: radius.sm,
  border: `1px solid ${colors.border.subtle}`,
  alignItems: 'center',
};

const paramStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: colors.text.primary,
  fontFamily: 'monospace',
};

const valueChangeStyle: CSSProperties = {
  fontSize: 11,
  color: colors.text.secondary,
  fontFamily: 'monospace',
};

const arrowSpanStyle: CSSProperties = {
  color: colors.text.muted,
  margin: '0 4px',
};

const statusStyle: CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.05em',
  textTransform: 'uppercase' as const,
};

const revertBtnStyle: CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  color: colors.accent.coral,
  background: 'transparent',
  border: `1px solid ${colors.accent.coral}`,
  borderRadius: radius.sm,
  padding: '2px 8px',
  cursor: 'pointer',
};

const emptyStyle: CSSProperties = {
  textAlign: 'center',
  color: colors.text.muted,
  fontSize: 12,
  padding: spacing.lg,
};

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function getStatusColor(status: 'applied' | 'reverted'): string {
  return status === 'applied' ? colors.accent.mint : colors.accent.coral;
}

function TuningRow({ tuning, onRevert }: { readonly tuning: Tuning; readonly onRevert?: (id: string) => void }) {
  return (
    <div style={rowStyle}>
      <div style={paramStyle}>{tuning.param}</div>
      <div style={valueChangeStyle}>
        {formatValue(tuning.oldValue)}
        <span style={arrowSpanStyle}>{'\u2192'}</span>
        {formatValue(tuning.newValue)}
      </div>
      <div style={{ ...statusStyle, color: getStatusColor(tuning.status) }}>
        {tuning.status}
      </div>
      <div>
        {tuning.status === 'applied' && onRevert && (
          <button
            type="button"
            style={revertBtnStyle}
            onClick={() => onRevert(tuning.id)}
          >
            Revert
          </button>
        )}
      </div>
    </div>
  );
}

export function TuningLog({ tunings, onRevert }: TuningLogProps) {
  return (
    <Panel title={'\u2699\uFE0F Tuning Log'} subtitle="Parameter adjustments from the Adapt stage" tooltip="Policy changes the harness made automatically. Shows what parameter changed, old to new value, and why. Click 'Revert' to undo any change instantly. All tunings have guardrails — they auto-revert if sessions score worse.">
      {tunings.length === 0 ? (
        <div style={emptyStyle}>No tuning adjustments yet</div>
      ) : (
        <>
          <div style={headerRowStyle}>
            <div>Parameter</div>
            <div>Change</div>
            <div>Status</div>
            <div>Action</div>
          </div>
          <div style={listStyle}>
            {tunings.map((tuning) => (
              <TuningRow key={tuning.id} tuning={tuning} onRevert={onRevert} />
            ))}
          </div>
        </>
      )}
    </Panel>
  );
}
