import type { CSSProperties } from 'react';
import { Panel } from '../components/Panel';
import { colors, spacing, radius } from '../styles/theme';
import type { SentinelAction, SentinelApprovalEntry } from '../hooks/useSentinelData';

interface SentinelApprovalInboxProps {
  readonly actions: readonly SentinelAction[];
  readonly approvals: readonly SentinelApprovalEntry[];
}

const listStyle: CSSProperties = {
  maxHeight: 320,
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.sm,
};

const rowStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  padding: spacing.sm,
  borderRadius: radius.md,
  background: colors.bg.cardHover,
  border: `1px solid ${colors.border.subtle}`,
};

const headerStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: 12,
  fontWeight: 600,
  color: colors.text.primary,
};

const reasonStyle: CSSProperties = {
  fontSize: 11,
  color: colors.text.secondary,
};

const metaStyle: CSSProperties = {
  fontSize: 10,
  color: colors.text.muted,
  fontFamily: 'monospace',
};

const cliHintStyle: CSSProperties = {
  fontSize: 10,
  fontFamily: 'monospace',
  color: colors.accent.lavender,
  marginTop: 4,
};

const emptyStyle: CSSProperties = {
  fontSize: 12,
  color: colors.text.muted,
  padding: spacing.md,
  textAlign: 'center',
};

function isApprovalActive(approval: SentinelApprovalEntry, now: number = Date.now()): boolean {
  if (approval.revokedAt !== null) {
    return false;
  }
  if (approval.expiresAt === null) {
    return true;
  }
  const expiresAt = Date.parse(approval.expiresAt);
  return Number.isFinite(expiresAt) && expiresAt > now;
}

export function SentinelApprovalInbox({ actions, approvals }: SentinelApprovalInboxProps): JSX.Element {
  const activeApprovalsByAction = new Map<string, SentinelApprovalEntry[]>();
  for (const approval of approvals) {
    if (!isApprovalActive(approval)) {
      continue;
    }
    const existing = activeApprovalsByAction.get(approval.actionPlanId) ?? [];
    existing.push(approval);
    activeApprovalsByAction.set(approval.actionPlanId, existing);
  }
  const pending = actions.filter(
    (action) =>
      action.status === 'proposed' &&
      action.risk.requiresHumanApproval === true &&
      (activeApprovalsByAction.get(action.id) ?? []).length === 0,
  );

  return (
    <Panel
      id="sentinel-approval-inbox"
      title="Sentinel Approval Inbox"
      subtitle={`${pending.length} action(s) waiting for human approval`}
      tooltip="Proposed actions whose risk assessment requires explicit operator sign-off. Approve via the CLI."
    >
      <div style={listStyle}>
        {pending.length === 0 ? (
          <div style={emptyStyle}>Inbox is clear. New proposed actions with requiresHumanApproval=true will appear here.</div>
        ) : (
          pending.map((action) => (
            <div key={action.id} style={rowStyle}>
              <div style={headerStyle}>
                <div>{action.title}</div>
                <span style={{ fontSize: 10, color: colors.text.muted }}>
                  {action.risk.level} · {action.authorityRequired}
                </span>
              </div>
              <div style={reasonStyle}>{action.reason}</div>
              <div style={metaStyle}>
                touched={action.risk.touchedTargets.join(', ') || '—'} · reasons={action.risk.reasons.length}
              </div>
              <div style={cliHintStyle}>
                hforge actions approve {action.id} --authority {action.authorityRequired} --expires 2h
              </div>
            </div>
          ))
        )}
      </div>
    </Panel>
  );
}
