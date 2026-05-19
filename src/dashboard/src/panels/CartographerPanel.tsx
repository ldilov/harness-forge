import type { CSSProperties } from 'react';
import { Panel } from '../components/Panel';
import { colors, spacing } from '../styles/theme';
import type { CartographerData } from '../hooks/useCartographerData';

interface CartographerPanelProps {
  readonly data: CartographerData;
}

const gridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: spacing.md,
};

const cellStyle: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 2 };
const labelStyle: CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  textTransform: 'uppercase',
  color: colors.text.muted,
  letterSpacing: 0.5,
};
const valueStyle: CSSProperties = { fontSize: 16, fontWeight: 700, color: colors.text.primary };
const subStyle: CSSProperties = { fontSize: 10, color: colors.text.secondary };
const rowStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: 11,
  color: colors.text.secondary,
  padding: '2px 0',
};
const sectionTitle: CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  textTransform: 'uppercase',
  color: colors.text.muted,
  marginTop: spacing.md,
};

function kindSummary(kinds: Readonly<Record<string, number>>): string {
  const entries = Object.entries(kinds).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) {
    return 'none';
  }
  return entries.map(([k, n]) => `${k}:${n}`).join('  ');
}

export function CartographerPanel({ data }: CartographerPanelProps) {
  const { graph, bundles, impact, hooks } = data;
  return (
    <Panel title="Cartographer+" subtitle="project knowledge graph · context · impact · agent broker">
      {!graph.present ? (
        <div style={subStyle}>No graph yet. Run: hforge graph build</div>
      ) : (
        <>
          <div style={gridStyle}>
            <div style={cellStyle}>
              <span style={labelStyle}>Nodes</span>
              <span style={valueStyle}>{graph.nodeCount}</span>
            </div>
            <div style={cellStyle}>
              <span style={labelStyle}>Edges</span>
              <span style={valueStyle}>{graph.edgeCount}</span>
            </div>
            <div style={cellStyle}>
              <span style={labelStyle}>Diagnostics</span>
              <span style={valueStyle}>{graph.diagnosticCount}</span>
            </div>
            <div style={cellStyle}>
              <span style={labelStyle}>Version</span>
              <span style={subStyle}>{graph.version}</span>
            </div>
          </div>
          <div style={sectionTitle}>Edge kinds</div>
          <div style={subStyle}>{kindSummary(graph.edgeKinds)}</div>
        </>
      )}

      <div style={sectionTitle}>Recent context bundles ({bundles.length})</div>
      {bundles.slice(0, 5).map((bundle) => (
        <div key={bundle.id} style={rowStyle}>
          <span>{bundle.goal}</span>
          <span>
            {bundle.fileCount} files{bundle.contextTruncated ? ' · truncated' : ''}
          </span>
        </div>
      ))}

      <div style={sectionTitle}>Recent impact reports ({impact.length})</div>
      {impact.slice(0, 5).map((report) => (
        <div key={report.id} style={rowStyle}>
          <span>{report.id}</span>
          <span>
            risk {report.risk} · {report.impactedFileCount} impacted
          </span>
        </div>
      ))}

      <div style={sectionTitle}>Recent agent-hook runs ({hooks.length})</div>
      {hooks.slice(0, 5).map((run) => (
        <div key={run.id} style={rowStyle}>
          <span>
            {run.event} · {run.mode}
            {run.cached ? ' · cached' : ''}
          </span>
          <span>
            {run.status} · {run.recommendedCount} rec / {run.executedCount} exec
          </span>
        </div>
      ))}

      {data.error !== null ? <div style={{ ...subStyle, color: colors.accent.coral }}>{data.error}</div> : null}
    </Panel>
  );
}
