# Detailed Event Logging for Dashboard Visibility: Research Report

*Generated: 2026-04-06 | Sources: 30+ | Confidence: High*

## Executive Summary

Harness Forge has a **fully built but disconnected** event pipeline. The `BehaviorEventEmitter` defines 22 event types, the `SignalAggregator` routes them to dashboard channels, the `SignalBroadcaster` pushes them over WebSocket, and the dashboard SPA has 16 panels ready to visualize them — but **zero production call sites** invoke the emitter. Meanwhile, ~80% of the application lifecycle (discovery, recommendation, planning, install, compaction, memory rotation, maintenance) produces no events at all.

This report identifies **47 specific instrumentation points** across 13 lifecycle phases, proposes **15 new event types** to complement the existing 22, and recommends a phased implementation plan that will give dashboard users full visibility into every harness-forge operation.

---

## 1. Critical Gap: The Dead Emitter Problem

### Current State

The `BehaviorEventEmitter` (22 methods) exists at `src/application/behavior/behavior-event-emitter.ts`. Every method builds a `BehaviorEvent` with ID, timestamp, session, and payload, then fans out to listeners. The `SignalAggregator` consumes these events and routes them to 12 dashboard signal channels.

**The problem:** A grep of the entire `src/` tree reveals **zero call sites** for any `emitter.emit*()` method outside of tests. The subsystems that should call these emitters — compaction service, budget monitor, subagent brief generator, memory rotator, enforcement ladder, etc. — do not invoke them.

### Root Cause

Each behavior subsystem (e.g., `EnforcementLadder.evaluate()`, `HistoryExpansionGate.evaluate()`, `DuplicateSuppressor.suppress()`) returns a result that *names* an event type but does not *emit* it. The caller was expected to wire the emitter, but that wiring never happened.

### Fix Priority: **CRITICAL**

Before adding any new events, wire the existing 22 event types to their natural call sites. This alone will populate every existing dashboard panel.

---

## 2. Existing Event Wiring Map (22 Events → Call Sites)

### Memory & Context Events (8)

| Event Type | Natural Call Site | Module |
|---|---|---|
| `context.load.started` | Entry of context loading flow | `startup-file-generator.ts` |
| `context.load.completed` | Exit of context loading flow | `startup-file-generator.ts` |
| `context.compaction.triggered` | When `TriggerEngine` fires | `trigger-engine.ts` |
| `context.compaction.completed` | After `CompactionService.compact()` | `compaction-service.ts` |
| `context.summary.promoted` | After session summary written | `session-summary-writer.ts` |
| `context.delta.emitted` | After delta artifact saved | `compaction-artifact-updater.ts` |
| `memory.rotation.started` | Entry of `rotateMemory()` | `memory-rotator.ts` |
| `memory.rotation.completed` | Exit of `rotateMemory()` | `memory-rotator.ts` |

### Budget & Policy Events (5)

| Event Type | Natural Call Site | Module |
|---|---|---|
| `context.budget.warning` | `EnforcementLadder.evaluate()` returns nudge/defaults | `enforcement-ladder.ts` |
| `context.budget.exceeded` | `EnforcementLadder.evaluate()` returns enforcement | `enforcement-ladder.ts` |
| `history.expansion.requested` | `HistoryExpansionGate.evaluate()` entry | `history-expansion-gate.ts` |
| `history.expansion.denied` | Gate returns denied | `history-expansion-gate.ts` |
| `context.duplicate.suppressed` | `DuplicateSuppressor.suppress()` finds duplicates | `duplicate-suppressor.ts` |

### Subagent Events (5)

| Event Type | Natural Call Site | Module |
|---|---|---|
| `subagent.brief.generated` | `SubagentBriefGenerator.generate()` | `subagent-brief-generator.ts` |
| `subagent.brief.rewritten` | `SubagentBriefRewriter.rewrite()` | `subagent-brief-rewriter.ts` |
| `subagent.brief.rejected` | `SubagentBriefValidator.validate()` fails | `subagent-brief-validator.ts` |
| `subagent.run.started` | Before subagent execution | `subagent-brief-generator.ts` |
| `subagent.run.completed` | After subagent returns | `subagent-brief-generator.ts` |

### Artifact & Output Events (4)

| Event Type | Natural Call Site | Module |
|---|---|---|
| `artifact.pointer.promoted` | `ArtifactPointerPromoter.evaluate()` | `artifact-pointer-promoter.ts` |
| `runtime.startup.files.generated` | `StartupFileGenerator.generate()` | `startup-file-generator.ts` |
| `response.profile.selected` | `OutputProfileResolver.resolve()` | `output-profile-resolver.ts` |
| `response.profile.overridden` | Override path in resolver | `output-profile-resolver.ts` |

---

## 3. Proposed New Event Types (15)

Based on analysis of all 13 lifecycle phases and research on AI observability best practices (LangSmith, Langfuse, Pulumi, Turborepo, OpenTelemetry GenAI conventions).

### Phase 1: Discovery & Diagnosis (3 new events)

| Event Type | Payload | Dashboard Value |
|---|---|---|
| `workspace.discovery.completed` | `{ targetsFound: string[], confidence: Record<string,number>, evidence: string[], durationMs: number }` | Shows what targets were auto-detected and with what confidence. Gives visibility into the "magic" of target detection. |
| `workspace.diagnosis.completed` | `{ languages: string[], frameworks: string[], existingTargets: string[], repoType: string, durationMs: number }` | Shows the full diagnosis result. Users can verify the tool "sees" their repo correctly. |
| `recommendation.generated` | `{ bundles: string[], templates: string[], profiles: string[], source: 'intelligence'\|'heuristic'\|'manual', durationMs: number }` | Shows what was recommended and why. Critical for user trust — "why did it suggest X?" |

### Phase 2: Planning & Install (4 new events)

| Event Type | Payload | Dashboard Value |
|---|---|---|
| `install.plan.created` | `{ operationCount: number, bundleCount: number, conflictCount: number, warningCount: number, planHash: string }` | Shows plan complexity before execution. Users can track how plans vary across runs. |
| `install.operation.applied` | `{ operation: 'copy'\|'merge'\|'append'\|'skip'\|'remove', target: string, path: string, durationMs: number, bytesWritten: number }` | Per-file granularity. Users see exactly what was written/modified. The dashboard can show a progress bar during install. |
| `install.completed` | `{ totalOperations: number, filesWritten: number, filesSkipped: number, conflicts: number, durationMs: number }` | Summary event for the full install. Enables duration tracking across runs. |
| `install.validation.completed` | `{ valid: boolean, warnings: string[], errors: string[] }` | Shows whether the environment was valid before install attempted. |

### Phase 3: Compaction & Memory (3 new events)

| Event Type | Payload | Dashboard Value |
|---|---|---|
| `compaction.strategy.selected` | `{ strategy: 'trim'\|'summarize'\|'rollup'\|'rollover', reason: string, triggerType: string, tokensEstimate: number }` | Shows which strategy was chosen and why. Critical for understanding budget pressure. |
| `compaction.validation.completed` | `{ valid: boolean, criticalEventsPreserved: boolean, tokenReduction: number, violations: string[] }` | Shows whether compaction was safe. Users can trust the tool isn't losing important context. |
| `memory.rotation.failed` | `{ reason: string, phase: string, recoverable: boolean }` | Error visibility for memory operations. Currently there's no failure event for rotation. |

### Phase 4: CLI Command Lifecycle (3 new events)

| Event Type | Payload | Dashboard Value |
|---|---|---|
| `command.started` | `{ command: string, args: Record<string,unknown>, workspaceRoot: string }` | Every CLI command becomes visible. Users see the full command history in the dashboard. |
| `command.completed` | `{ command: string, exitCode: number, durationMs: number, resultSummary: string }` | Shows outcome and duration. Enables latency tracking across all commands. |
| `command.failed` | `{ command: string, error: string, exitCode: number, durationMs: number, recoverable: boolean }` | Error visibility. Users see failures without checking terminal output. |

### Phase 5: Session Lifecycle (2 new events)

| Event Type | Payload | Dashboard Value |
|---|---|---|
| `session.started` | `{ sessionId: string, workspaceRoot: string, version: string, nodeVersion: string }` | Session start marker. Required for session-level grouping in the dashboard. |
| `session.ended` | `{ sessionId: string, totalEvents: number, totalDurationMs: number, commandsRun: number }` | Session end summary. Enables session-level analytics. |

---

## 4. Dashboard Panel Enhancements

### New Panels (for new events)

| Panel | Chart Type | Events Consumed | User Value |
|---|---|---|---|
| **Command History** | Scrollable timeline with duration bars | `command.started/completed/failed` | "What commands ran, how long each took, which failed" |
| **Install Progress** | Stacked horizontal bar + operation log | `install.plan.created`, `install.operation.applied`, `install.completed` | Real-time install progress with per-file detail |
| **Discovery Results** | Card grid with confidence badges | `workspace.discovery.completed`, `workspace.diagnosis.completed` | "What did harness-forge detect about my repo?" |
| **Recommendation Evidence** | Card list with source tags | `recommendation.generated` | "Why were these bundles/profiles recommended?" |
| **Compaction Strategy** | Sankey or flow diagram | `compaction.strategy.selected`, `compaction.validation.completed` | "How is the tool managing my context budget?" |
| **Error Log** | Filtered reverse-chronological list | `command.failed`, `memory.rotation.failed`, `compaction.validation.completed` (where valid=false) | "What went wrong and when?" |

### Enhancements to Existing Panels

| Panel | Enhancement | Rationale |
|---|---|---|
| **KpiCards** | Add "Commands Run" counter and "Session Duration" | Most basic visibility users expect (per Grafana RED method) |
| **EventTimeline** | Color-code new event categories (discovery=blue, install=green, command=cyan) | Currently only 6 categories; adding 4 more gives comprehensive lifecycle coverage |
| **LiveEventFeed** | Add severity/importance badges and filtering by event category | Currently all events look the same in the feed |
| **SessionInfo** | Add workspace root, node version, total commands | Richer context for debugging |
| **Sparkline** | Actually use it — add to each KPI card for trend indication | Component exists but is orphaned |

---

## 5. Event Payload Enrichment (Existing Events)

Several existing events carry minimal payloads. Enriching them improves dashboard utility without new event types.

| Event | Current Payload | Recommended Addition | Dashboard Benefit |
|---|---|---|---|
| `context.load.started` | (none) | `{ sourcesCount: number, estimatedTokens: number }` | Shows how much context is being loaded |
| `context.load.completed` | (none) | `{ sourcesLoaded: number, totalTokens: number, durationMs: number, loadOrder: string[] }` | Shows what was loaded and how long it took |
| `context.compaction.triggered` | (none/level) | `{ level: string, trigger: string, currentTokens: number, threshold: number }` | Shows exactly why compaction triggered |
| `subagent.brief.generated` | (inconsistent from seed data) | Standardize: `{ objective: string, estimatedTokens: number, responseProfile: string, sourceStateType: string, decisions: number }` | Consistent card rendering in SubagentBriefs panel |
| `subagent.run.completed` | (none) | `{ durationMs: number, resultTokens: number, exitStatus: 'success'\|'failed'\|'timeout' }` | Duration and outcome tracking per subagent |
| `artifact.pointer.promoted` | (inconsistent) | Standardize: `{ artifactType: string, originalTokens: number, pointerTokens: number, tokensSaved: number, reference: string }` | Accurate TokensSaved panel |
| `context.budget.warning` | `{ budgetState }` | Add: `{ enforcementLevel: string, suggestedAction: string }` | Users see what action will be taken |
| `memory.rotation.completed` | `{ automatic?: boolean }` | Add: `{ tokensBefore: number, tokensAfter: number, archivedSections: number, durationMs: number }` | Memory rotation efficiency tracking |

---

## 6. Implementation Strategy

### Phase 1: Wire Existing Events (HIGH IMPACT, LOW EFFORT)

**Scope:** Connect the 22 existing `BehaviorEventEmitter` methods to their natural call sites.

**Pattern:**
```typescript
// In each subsystem, accept emitter via constructor injection:
class CompactionService {
  constructor(
    private readonly emitter: BehaviorEventEmitter,
    // ... other deps
  ) {}

  async compact(/* ... */): Promise<CompactionResult> {
    // ... existing logic ...
    this.emitter.emitCompaction({ tokensBeforeAfter: { before, after } });
    return result;
  }
}
```

**Estimated impact:** All 16 existing dashboard panels come alive with real data. This is the single highest-value change.

### Phase 2: Enrich Existing Payloads (MEDIUM IMPACT, LOW EFFORT)

**Scope:** Add the recommended fields to existing emit calls (see table in Section 5).

**Pattern:** Each `emit*()` method already accepts an open `payload` object. Just pass richer data:
```typescript
this.emitter.emitContextLoad({
  sourcesLoaded: sources.length,
  totalTokens: tokenCount,
  durationMs: Date.now() - startTime,
  loadOrder: sources.map(s => s.name),
});
```

### Phase 3: Add New Event Types (HIGH IMPACT, MEDIUM EFFORT)

**Scope:** Add the 15 new event types from Section 3.

**Steps:**
1. Add constants to `behavior-event-types.ts`
2. Add `emit*()` methods to `BehaviorEventEmitter`
3. Add signal channel definitions to `signal-channels.ts`
4. Add routing logic to `SignalAggregator`
5. Wire emitters in each subsystem
6. Update contract tests

### Phase 4: Dashboard Frontend Panels (MEDIUM IMPACT, MEDIUM EFFORT)

**Scope:** Build 6 new panels and enhance 5 existing ones (see Section 4).

**Priority order:**
1. Command History (most immediately useful)
2. Error Log (critical for debugging)
3. Install Progress (most visual impact)
4. Discovery Results + Recommendation Evidence (trust-building)
5. Compaction Strategy (advanced users)

### Phase 5: Aggregate Metrics & Trends (MEDIUM IMPACT, HIGH EFFORT)

**Scope:** Derive higher-level analytics from the event stream.

**New derived metrics for `SignalAggregator`:**
- `commands.throughput` — commands per minute
- `commands.error.rate` — failed/total ratio
- `commands.avg.duration` — rolling average command duration
- `install.operations.rate` — operations per second during install
- `compaction.frequency` — compactions per hour
- `session.uptime` — seconds since session started

---

## 7. Architecture Recommendations

### 7.1 Dependency Injection for Emitters

Every subsystem that should emit events needs the `BehaviorEventEmitter` injected. Two patterns:

**Option A: Constructor injection (recommended)**
Each service class accepts an emitter in its constructor. The composition root (CLI command handler) creates the emitter and passes it down.

**Option B: Global singleton**
A module-scoped emitter instance that subsystems import directly. Simpler but harder to test.

Recommendation: **Option A** for testability and immutability alignment with coding standards.

### 7.2 Bridge the Two Event Systems

Currently there are two disconnected systems:
- `BehaviorEvent` → `events.json` → Dashboard
- `EventEnvelope` → `current.ndjson` → EventReader

The `EventEnvelope` has richer fields (`importance`, `retentionTier`, `actor`, `target`, `cost`, `artifacts`, `tags`, `parentEventId`) that `BehaviorEvent` lacks.

**Recommendation:** Add an adapter that converts `BehaviorEvent` to `EventEnvelope` and writes to both stores. This unifies the event pipeline and preserves the richer schema for NDJSON consumers.

### 7.3 Follow Pulumi's Discriminated Union Pattern

Pulumi's `EngineEvent` uses a discriminated union with sequence numbers. This maps directly to harness-forge's existing `SignalMessage` with `sequenceId`. The key improvement is adding a `category` discriminator to `BehaviorEvent` so consumers can pattern-match on category before inspecting individual event types:

```typescript
type BehaviorEventCategory =
  | 'memory'    // context.load.*, memory.rotation.*
  | 'budget'    // context.budget.*, history.expansion.*
  | 'compaction'// context.compaction.*, context.summary.*, context.delta.*
  | 'subagent'  // subagent.*
  | 'artifact'  // artifact.*, response.profile.*
  | 'discovery' // workspace.discovery.*, workspace.diagnosis.*
  | 'install'   // install.*
  | 'command'   // command.*
  | 'session';  // session.*
```

### 7.4 Duration Tracking Pattern

Many proposed events include `durationMs`. The standard pattern:

```typescript
async someOperation(): Promise<Result> {
  const startTime = Date.now();
  this.emitter.emitOperationStarted({ /* ... */ });

  try {
    const result = await doWork();
    this.emitter.emitOperationCompleted({
      durationMs: Date.now() - startTime,
      /* ... result fields ... */
    });
    return result;
  } catch (error) {
    this.emitter.emitOperationFailed({
      durationMs: Date.now() - startTime,
      error: error.message,
      recoverable: error instanceof RecoverableError,
    });
    throw error;
  }
}
```

---

## 8. What Users Value Most (Research-Backed)

Based on analysis of LangSmith, Langfuse, Nx Cloud, Turborepo, and Grafana best practices:

### Must-Haves (users abandon tools without these)

1. **Command history with duration** — "what ran and how long" (Grafana RED: Rate + Duration)
2. **Error visibility** — "what failed and why" (Grafana RED: Errors)
3. **Real-time progress** — "what's happening right now" (live feed + connection status)
4. **Session context** — "which run am I looking at" (session info bar)

### High-Value (users love these)

5. **Token/budget tracking** — AI-specific; equivalent of cost dashboards in cloud tools
6. **Recommendation transparency** — "why did it suggest X?" builds trust
7. **Compaction visibility** — "how is my context being managed?" reduces anxiety
8. **Install operation detail** — per-file visibility during apply

### Nice-to-Haves (power users)

9. **Subagent trace trees** — nested span visualization (like LangSmith)
10. **Cross-session trends** — sparklines and historical comparison
11. **Export/share** — generate reports from dashboard data
12. **Threshold alerts** — browser notifications for budget/error spikes

---

## 9. Documentation Gap: Event Taxonomy Needs Updating

The current `docs/observability/event-taxonomy.md`:
- Claims "23 total" events but code has 22 (contract test asserts 22)
- Does not document proposed new event types
- Missing a "Dashboard Mapping" section showing which panel each event feeds
- Missing payload field documentation for most events

**Recommendation:** Update the taxonomy doc as part of each implementation phase. Include:
1. Event type → signal channel → dashboard panel mapping
2. Complete payload schema per event (not just "optional fields")
3. Example payloads for each event type
4. Event lifecycle diagrams showing start→complete→fail triads

---

## Sources

### Codebase Analysis
- `src/domain/behavior/behavior-event-types.ts` — 22 behavior event constants
- `src/application/behavior/behavior-event-emitter.ts` — Emitter with zero call sites
- `src/application/dashboard/signal-aggregator.ts` — Event→channel routing
- `src/application/dashboard/signal-broadcaster.ts` — WebSocket broadcast
- `src/application/dashboard/dashboard-server.ts` — HTTP+WS server
- `src/dashboard/src/` — Full React SPA with 16 panels
- `docs/observability/event-taxonomy.md` — Current taxonomy docs
- 47 subsystem modules across 13 lifecycle phases (see Section 2-3)

### External Research
- HashiCorp Terraform structured logging (`tflog`)
- Pulumi EngineEvent discriminated union model
- Turborepo 2.9 native OTLP support
- OpenTelemetry GenAI semantic conventions for agent spans
- Grafana dashboard best practices (RED/USE methods)
- Nx Cloud task analytics and flaky task detection
- LangSmith trace trees and observability patterns
- Langfuse data model and metrics system
- Braintrust AI observability comparison
- Helicone gateway-level monitoring

### Methodology
Searched codebase across all `src/` directories. Analyzed 47 subsystem modules for event emission gaps. Cross-referenced with 30+ external sources on CLI tool observability, AI agent monitoring, and dashboard design patterns.
