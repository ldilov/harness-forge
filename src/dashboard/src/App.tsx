import React, { useReducer, type CSSProperties } from 'react';
import { colors } from './styles/theme';
import { dashboardReducer, initialState } from './state/reducer';
import type { DashboardState, DashboardAction } from './state/types';
import { useSignals } from './hooks/useSignals';
import { Sidebar } from './components/Sidebar';
import { ConnectionStatus } from './components/ConnectionStatus';
import { ProjectSelector } from './components/ProjectSelector';
import { ProjectSwitcher } from './components/ProjectSwitcher';
import { useNotifications } from './hooks/useNotifications';
import { useSessionPersistence } from './hooks/useSessionPersistence';
import { DashboardProvider, useDashboardContext, filterEventsByTimeRange } from './state/DashboardContext';
import { TimeRangeSelector } from './components/TimeRangeSelector';
import { CompareToggle } from './components/CompareToggle';
import { KpiCards } from './panels/KpiCards';
import { EventTimeline } from './panels/EventTimeline';
import { MemoryPressure } from './panels/MemoryPressure';
import { CompactionHistory } from './panels/CompactionHistory';
import { BudgetBreakdown } from './panels/BudgetBreakdown';
import { LiveEventFeed } from './panels/LiveEventFeed';
import { EventDistribution } from './panels/EventDistribution';
import { EventRate } from './panels/EventRate';
import { SubagentBriefs } from './panels/SubagentBriefs';
import { BriefMetrics } from './panels/BriefMetrics';
import { ProfileDistribution } from './panels/ProfileDistribution';
import { SuppressionGauge } from './panels/SuppressionGauge';
import { ExpansionGate } from './panels/ExpansionGate';
import { TokensSaved } from './panels/TokensSaved';
import { MemoryPolicy } from './panels/MemoryPolicy';
import { ConfigEditor } from './panels/ConfigEditor';
import { SessionInfo } from './panels/SessionInfo';
import { SessionHeroCard } from './panels/SessionHeroCard';
import { EventHeatmap } from './panels/EventHeatmap';
import { CommandWaterfall } from './panels/CommandWaterfall';

const layoutStyle: CSSProperties = {
  display: 'flex',
  minHeight: '100vh',
  background: colors.bg.primary,
};

const mainStyle: CSSProperties = {
  flex: 1,
  padding: 24,
  overflowY: 'auto',
};

const headerStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 24,
};

const titleStyle: CSSProperties = {
  fontSize: 20,
  fontWeight: 600,
  color: colors.text.primary,
  letterSpacing: '0.05em',
};


const headerRightStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 16,
};

const gridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
  gap: 16,
};

const fullWidthStyle: CSSProperties = {
  gridColumn: '1 / -1',
};

const twoColStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 16,
  gridColumn: '1 / -1',
};

export function App() {
  const [state, dispatch] = useReducer(dashboardReducer, initialState);
  const { lastSequenceIdRef } = useSignals(dispatch, state.activeProject);
  useNotifications(state.events);
  useSessionPersistence(state, lastSequenceIdRef.current, dispatch);

  if (state.screen === 'project-selector') {
    return <ProjectSelector dispatch={dispatch} />;
  }

  return (
    <DashboardProvider>
      <DashboardContent state={state} dispatch={dispatch} />
    </DashboardProvider>
  );
}

function DashboardContent({ state, dispatch }: {
  readonly state: DashboardState;
  readonly dispatch: React.Dispatch<DashboardAction>;
}) {
  const { timeRange } = useDashboardContext();
  const filteredEvents = filterEventsByTimeRange(state.events, timeRange);
  const activeProject = state.activeProject;

  return (
    <div style={layoutStyle}>
      <Sidebar />
      <main style={mainStyle}>
        <div style={headerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={titleStyle}>DASHBOARD</span>
            {activeProject && (
              <ProjectSwitcher activeProject={activeProject} dispatch={dispatch} />
            )}
          </div>
          <div style={headerRightStyle}>
            <CompareToggle />
            <TimeRangeSelector />
            <ConnectionStatus state={state.connectionState} />
          </div>
        </div>

        <div style={gridStyle}>
          <div style={fullWidthStyle}>
            <SessionHeroCard state={state} />
          </div>

          <div style={fullWidthStyle}>
            <KpiCards state={state} />
          </div>

          <div style={fullWidthStyle}>
            <CommandWaterfall events={filteredEvents} />
          </div>

          <div style={fullWidthStyle}>
            <EventTimeline events={filteredEvents} />
          </div>

          <div style={fullWidthStyle}>
            <EventHeatmap events={filteredEvents} />
          </div>

          <div style={twoColStyle}>
            <MemoryPressure events={filteredEvents} />
            <CompactionHistory events={filteredEvents} />
            <MemoryPolicy budget={state.budgetSnapshot} />
            <BudgetBreakdown budget={state.budgetSnapshot} />
          </div>

          <div style={twoColStyle}>
            <LiveEventFeed events={filteredEvents} />
            <div>
              <EventDistribution eventCounts={state.eventCounts} />
              <div style={{ marginTop: 16 }}>
                <EventRate events={filteredEvents} />
              </div>
            </div>
          </div>

          <div style={twoColStyle}>
            <SubagentBriefs events={filteredEvents} />
            <div>
              <BriefMetrics events={filteredEvents} />
              <div style={{ marginTop: 16 }}>
                <ProfileDistribution events={filteredEvents} />
              </div>
            </div>
          </div>

          <div style={twoColStyle}>
            <SuppressionGauge events={filteredEvents} />
            <ExpansionGate events={filteredEvents} />
          </div>

          <div style={fullWidthStyle}>
            <TokensSaved events={filteredEvents} />
          </div>

          <div style={fullWidthStyle}>
            <ConfigEditor />
          </div>

          <div style={fullWidthStyle}>
            <SessionInfo state={state} />
          </div>
        </div>
      </main>
    </div>
  );
}
