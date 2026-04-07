import { useMemo, type CSSProperties } from 'react';
import { Panel } from '../components/Panel';
import type { DashboardEvent } from '../state/types';
import { colors } from '../styles/theme';

interface TokensSavedProps {
  readonly events: readonly DashboardEvent[];
}

const valueStyle: CSSProperties = {
  fontSize: 32,
  fontWeight: 700,
  color: colors.accent.mint,
};

const subStyle: CSSProperties = {
  fontSize: 12,
  color: colors.text.secondary,
  marginTop: 4,
};

export function TokensSaved({ events }: TokensSavedProps) {
  const { saved, promotions } = useMemo(() => {
    let totalSaved = 0;
    let count = 0;
    for (const e of events) {
      if (e.eventType === 'artifact.pointer.promoted') {
        totalSaved += (e.payload.estimatedTokensSaved as number) ?? 0;
        count++;
      }
    }
    return { saved: totalSaved, promotions: count };
  }, [events]);

  return (
    <Panel title="Artifact Promotion" subtitle="Tokens saved by promoting inline content to references" tooltip="Tokens saved by converting inline content into compact references. More promotions = less context wasted on repeated or large blobs.">
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
        <span style={valueStyle}>{saved.toLocaleString()}</span>
        <span style={subStyle}>tokens saved across {promotions} promotions</span>
      </div>
    </Panel>
  );
}
