# Living Loop Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement the Observe → Learn → Adapt → Share → Import self-improving loop for harness-forge v1.5.0.

**Architecture:** Five-stage closed feedback loop where session telemetry (Observe) feeds pattern extraction (Learn), which drives policy auto-tuning (Adapt), with state portability via bundles (Share/Import). Each stage is a domain + application module pair following existing layered patterns.

**Tech Stack:** TypeScript (ESM), Zod schemas, Vitest, React 19 + ECharts (dashboard), Commander.js (CLI), NDJSON persistence.

---

## Phase 1: OBSERVE — Session Recorder + Effectiveness Scorer

### Task 1: Domain Types — Session Trace

**Files:**
- Create: `src/domain/loop/session-trace.ts`
- Create: `src/domain/loop/index.ts`

**Step 1: Write the failing test**

Create: `tests/contract/session-trace.contract.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { SessionTraceSchema, type SessionTrace } from '@domain/loop/session-trace.js';

describe('SessionTrace contract', () => {
  it('parses a valid session trace', () => {
    const raw = {
      traceId: 'trc_abc123',
      sessionId: 'rsn_def456',
      target: 'claude-code',
      repo: 'my-app',
      startedAt: '2026-04-06T10:00:00Z',
      endedAt: '2026-04-06T10:30:00Z',
      durationSeconds: 1800,
      metrics: {
        tokensUsed: 48200,
        tokenBudget: 128000,
        compactionsTriggered: 2,
        compactionStrategies: ['summarize'],
        tokensSaved: 18400,
        subagentsSpawned: 3,
        duplicatesSuppressed: 7,
        skillsInvoked: ['tdd-workflow'],
        commandsRun: ['hforge next'],
        errorsEncountered: 2,
      },
      outcome: {
        taskCompleted: true,
        retries: 1,
        userCorrections: 0,
        budgetExceeded: false,
      },
    };
    const parsed = SessionTraceSchema.parse(raw);
    expect(parsed.traceId).toBe('trc_abc123');
    expect(parsed.metrics.tokensUsed).toBe(48200);
    expect(parsed.outcome.taskCompleted).toBe(true);
  });

  it('rejects trace with missing required fields', () => {
    expect(() => SessionTraceSchema.parse({})).toThrow();
  });

  it('defaults optional arrays to empty', () => {
    const minimal = {
      traceId: 'trc_1',
      sessionId: 'rsn_1',
      target: 'codex',
      repo: 'x',
      startedAt: '2026-04-06T10:00:00Z',
      durationSeconds: 10,
      metrics: {
        tokensUsed: 100,
        tokenBudget: 1000,
        compactionsTriggered: 0,
        tokensSaved: 0,
        subagentsSpawned: 0,
        duplicatesSuppressed: 0,
        errorsEncountered: 0,
      },
      outcome: {
        taskCompleted: false,
        retries: 0,
        userCorrections: 0,
        budgetExceeded: false,
      },
    };
    const parsed = SessionTraceSchema.parse(minimal);
    expect(parsed.metrics.compactionStrategies).toEqual([]);
    expect(parsed.metrics.skillsInvoked).toEqual([]);
    expect(parsed.metrics.commandsRun).toEqual([]);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/contract/session-trace.contract.test.ts`
Expected: FAIL — module not found

**Step 3: Write the domain type**

Create `src/domain/loop/session-trace.ts`:

```typescript
import { z } from 'zod';

export const TraceMetricsSchema = z.object({
  tokensUsed: z.number().int().nonnegative(),
  tokenBudget: z.number().int().positive(),
  compactionsTriggered: z.number().int().nonnegative(),
  compactionStrategies: z.array(z.string()).default([]),
  tokensSaved: z.number().int().nonnegative(),
  subagentsSpawned: z.number().int().nonnegative(),
  duplicatesSuppressed: z.number().int().nonnegative(),
  skillsInvoked: z.array(z.string()).default([]),
  commandsRun: z.array(z.string()).default([]),
  errorsEncountered: z.number().int().nonnegative(),
});

export type TraceMetrics = z.infer<typeof TraceMetricsSchema>;

export const TraceOutcomeSchema = z.object({
  taskCompleted: z.boolean(),
  retries: z.number().int().nonnegative(),
  userCorrections: z.number().int().nonnegative(),
  budgetExceeded: z.boolean(),
});

export type TraceOutcome = z.infer<typeof TraceOutcomeSchema>;

export const SessionTraceSchema = z.object({
  traceId: z.string(),
  sessionId: z.string(),
  target: z.string(),
  repo: z.string(),
  startedAt: z.string(),
  endedAt: z.string().optional(),
  durationSeconds: z.number().nonnegative(),
  metrics: TraceMetricsSchema,
  outcome: TraceOutcomeSchema,
});

export type SessionTrace = z.infer<typeof SessionTraceSchema>;
```

Create `src/domain/loop/index.ts`:

```typescript
export * from './session-trace.js';
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/contract/session-trace.contract.test.ts`
Expected: PASS (3 tests)

**Step 5: Commit**

```bash
git add src/domain/loop/ tests/contract/session-trace.contract.test.ts
git commit -m "feat(loop): add SessionTrace domain type with Zod schema"
```

---

### Task 2: Domain Types — Effectiveness Score

**Files:**
- Create: `src/domain/loop/effectiveness-score.ts`
- Modify: `src/domain/loop/index.ts`

**Step 1: Write the failing test**

Create: `tests/contract/effectiveness-score.contract.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import {
  EffectivenessScoreSchema,
  ScoreBreakdownSchema,
  SCORE_WEIGHTS,
} from '@domain/loop/effectiveness-score.js';

describe('EffectivenessScore contract', () => {
  it('parses a valid score record', () => {
    const raw = {
      sessionId: 'rsn_abc',
      traceId: 'trc_abc',
      score: 74,
      breakdown: {
        tokenEfficiency: 82,
        taskCompletion: 100,
        compactionHealth: 65,
        errorRate: 80,
        userFriction: 100,
      },
      scoredAt: '2026-04-06T10:30:00Z',
      repo: 'my-app',
      target: 'claude-code',
    };
    const parsed = EffectivenessScoreSchema.parse(raw);
    expect(parsed.score).toBe(74);
    expect(parsed.breakdown.tokenEfficiency).toBe(82);
  });

  it('score weights sum to 1.0', () => {
    const total = Object.values(SCORE_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(total).toBeCloseTo(1.0);
  });

  it('all breakdown fields are 0-100', () => {
    expect(() =>
      ScoreBreakdownSchema.parse({
        tokenEfficiency: 101,
        taskCompletion: 50,
        compactionHealth: 50,
        errorRate: 50,
        userFriction: 50,
      }),
    ).toThrow();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/contract/effectiveness-score.contract.test.ts`
Expected: FAIL

**Step 3: Write the domain type**

Create `src/domain/loop/effectiveness-score.ts`:

```typescript
import { z } from 'zod';

export const SCORE_WEIGHTS = {
  tokenEfficiency: 0.3,
  taskCompletion: 0.3,
  compactionHealth: 0.2,
  errorRate: 0.1,
  userFriction: 0.1,
} as const;

const score0to100 = z.number().min(0).max(100);

export const ScoreBreakdownSchema = z.object({
  tokenEfficiency: score0to100,
  taskCompletion: score0to100,
  compactionHealth: score0to100,
  errorRate: score0to100,
  userFriction: score0to100,
});

export type ScoreBreakdown = z.infer<typeof ScoreBreakdownSchema>;

export const EffectivenessScoreSchema = z.object({
  sessionId: z.string(),
  traceId: z.string(),
  score: score0to100,
  breakdown: ScoreBreakdownSchema,
  scoredAt: z.string(),
  repo: z.string(),
  target: z.string(),
});

export type EffectivenessScore = z.infer<typeof EffectivenessScoreSchema>;
```

Update `src/domain/loop/index.ts` — add `export * from './effectiveness-score.js';`

**Step 4: Run test — expected PASS**

**Step 5: Commit**

```bash
git add src/domain/loop/ tests/contract/effectiveness-score.contract.test.ts
git commit -m "feat(loop): add EffectivenessScore domain type with weights"
```

---

### Task 3: Constants — Living Loop paths and ID prefixes

**Files:**
- Modify: `src/shared/constants.ts` — add loop-related constants
- Modify: `src/shared/id-generator.ts` — add `trace`, `pattern`, `tuning`, `bundle` prefixes

**Step 1: Write the failing test**

Create: `tests/unit/loop-constants.spec.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { generateId } from '@shared/id-generator.js';
import {
  RUNTIME_TRACES_DIR,
  RUNTIME_INSIGHTS_DIR,
  RUNTIME_EFFECTIVENESS_LEDGER_FILE,
  RUNTIME_PATTERNS_FILE,
  RUNTIME_TUNING_LOG_FILE,
  RUNTIME_MERGE_LOG_FILE,
  RUNTIME_INSIGHTS_CHANGELOG_FILE,
  RUNTIME_INSIGHTS_RECOMMENDATIONS_FILE,
} from '@shared/constants.js';

describe('Loop constants', () => {
  it('trace directory is under runtime', () => {
    expect(RUNTIME_TRACES_DIR).toBe('traces');
  });

  it('insights directory is under runtime', () => {
    expect(RUNTIME_INSIGHTS_DIR).toBe('insights');
  });

  it('generates trace IDs with trc_ prefix', () => {
    const id = generateId('trace');
    expect(id).toMatch(/^trc_[a-f0-9]{24}$/);
  });

  it('generates pattern IDs with pat_ prefix', () => {
    const id = generateId('pattern');
    expect(id).toMatch(/^pat_[a-f0-9]{24}$/);
  });

  it('generates tuning IDs with tun_ prefix', () => {
    const id = generateId('tuning');
    expect(id).toMatch(/^tun_[a-f0-9]{24}$/);
  });

  it('generates bundle IDs with bnd_ prefix', () => {
    const id = generateId('bundle');
    expect(id).toMatch(/^bnd_[a-f0-9]{24}$/);
  });
});
```

**Step 2: Run test — expected FAIL**

**Step 3: Add constants to `src/shared/constants.ts`:**

```typescript
// Living Loop
export const RUNTIME_TRACES_DIR = "traces";
export const RUNTIME_INSIGHTS_DIR = "insights";
export const RUNTIME_EFFECTIVENESS_LEDGER_FILE = "effectiveness-ledger.ndjson";
export const RUNTIME_PATTERNS_FILE = "patterns.json";
export const RUNTIME_INSIGHTS_RECOMMENDATIONS_FILE = "recommendations.json";
export const RUNTIME_INSIGHTS_CHANGELOG_FILE = "changelog.ndjson";
export const RUNTIME_TUNING_LOG_FILE = "tuning-log.ndjson";
export const RUNTIME_MERGE_LOG_FILE = "merge-log.ndjson";
export const LOOP_PATTERN_EXTRACT_INTERVAL = 5; // sessions
export const LOOP_CONFIDENCE_OBSERVE = 0.5;
export const LOOP_CONFIDENCE_SUGGEST = 0.7;
export const LOOP_ROLLBACK_WINDOW = 3; // sessions
export const BUNDLE_FILE_EXTENSION = ".hfb";
```

Add to `src/shared/id-generator.ts` PREFIXES:

```typescript
trace: 'trc_',
pattern: 'pat_',
tuning: 'tun_',
bundle: 'bnd_',
```

**Step 4: Run test — expected PASS**

**Step 5: Commit**

```bash
git add src/shared/constants.ts src/shared/id-generator.ts tests/unit/loop-constants.spec.ts
git commit -m "feat(loop): add Living Loop constants and ID prefixes"
```

---

### Task 4: Application — Session Recorder

**Files:**
- Create: `src/application/loop/session-recorder.ts`
- Create: `src/application/loop/index.ts`

**Step 1: Write the failing test**

Create: `tests/unit/session-recorder.spec.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { SessionRecorder } from '@app/loop/session-recorder.js';
import type { BehaviorEvent } from '@app/behavior/behavior-event-emitter.js';

describe('SessionRecorder', () => {
  let recorder: SessionRecorder;

  beforeEach(() => {
    recorder = new SessionRecorder('rsn_test', 'claude-code', 'my-app');
  });

  it('creates empty trace on construction', () => {
    const trace = recorder.buildTrace();
    expect(trace.sessionId).toBe('rsn_test');
    expect(trace.target).toBe('claude-code');
    expect(trace.repo).toBe('my-app');
    expect(trace.metrics.tokensUsed).toBe(0);
    expect(trace.outcome.taskCompleted).toBe(false);
  });

  it('accumulates metrics from events', () => {
    recorder.recordEvent({
      eventType: 'context.compaction.completed',
      payload: {
        strategy: 'summarize',
        tokensBeforeAfter: { before: 50000, after: 32000 },
      },
    } as unknown as BehaviorEvent);

    const trace = recorder.buildTrace();
    expect(trace.metrics.compactionsTriggered).toBe(1);
    expect(trace.metrics.tokensSaved).toBe(18000);
    expect(trace.metrics.compactionStrategies).toContain('summarize');
  });

  it('tracks budget exceeded from budget events', () => {
    recorder.recordEvent({
      eventType: 'context.budget.exceeded',
      payload: { budgetState: { estimatedInputTokens: 120000, maxHotPathInputTokens: 100000 } },
    } as unknown as BehaviorEvent);

    const trace = recorder.buildTrace();
    expect(trace.outcome.budgetExceeded).toBe(true);
  });

  it('tracks skills invoked from command events', () => {
    recorder.recordEvent({
      eventType: 'command.completed',
      payload: { commandName: 'hforge next' },
    } as unknown as BehaviorEvent);

    const trace = recorder.buildTrace();
    expect(trace.metrics.commandsRun).toContain('hforge next');
  });

  it('computes duration from first to last event', () => {
    recorder.recordEvent({
      eventType: 'session.started',
      occurredAt: '2026-04-06T10:00:00.000Z',
      payload: {},
    } as unknown as BehaviorEvent);
    recorder.recordEvent({
      eventType: 'session.ended',
      occurredAt: '2026-04-06T10:30:00.000Z',
      payload: {},
    } as unknown as BehaviorEvent);

    const trace = recorder.buildTrace();
    expect(trace.durationSeconds).toBe(1800);
  });
});
```

**Step 2: Run test — expected FAIL**

**Step 3: Implement `src/application/loop/session-recorder.ts`**

The recorder listens to BehaviorEvents and accumulates metrics into a SessionTrace. Key logic:
- Track compaction events → increment `compactionsTriggered`, accumulate `tokensSaved`, collect strategies
- Track budget events → set `budgetExceeded` flag, update `tokensUsed`
- Track subagent events → increment `subagentsSpawned`
- Track suppression events → increment `duplicatesSuppressed`
- Track command events → collect into `commandsRun`
- Track session start/end → compute `durationSeconds`
- `buildTrace()` returns immutable `SessionTrace` with a generated `traceId`

**Step 4: Run test — expected PASS**

**Step 5: Commit**

```bash
git add src/application/loop/ tests/unit/session-recorder.spec.ts
git commit -m "feat(loop): implement SessionRecorder — accumulates BehaviorEvents into traces"
```

---

### Task 5: Application — Effectiveness Scorer

**Files:**
- Create: `src/application/loop/effectiveness-scorer.ts`

**Step 1: Write the failing test**

Create: `tests/unit/effectiveness-scorer.spec.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { scoreSession } from '@app/loop/effectiveness-scorer.js';
import type { SessionTrace } from '@domain/loop/session-trace.js';

describe('EffectivenessScorer', () => {
  const baseTrace: SessionTrace = {
    traceId: 'trc_1',
    sessionId: 'rsn_1',
    target: 'claude-code',
    repo: 'my-app',
    startedAt: '2026-04-06T10:00:00Z',
    durationSeconds: 1800,
    metrics: {
      tokensUsed: 64000,
      tokenBudget: 128000,
      compactionsTriggered: 1,
      compactionStrategies: ['summarize'],
      tokensSaved: 18000,
      subagentsSpawned: 2,
      duplicatesSuppressed: 3,
      skillsInvoked: ['tdd-workflow'],
      commandsRun: ['hforge next'],
      errorsEncountered: 1,
    },
    outcome: {
      taskCompleted: true,
      retries: 0,
      userCorrections: 0,
      budgetExceeded: false,
    },
  };

  it('scores a healthy session above 70', () => {
    const result = scoreSession(baseTrace);
    expect(result.score).toBeGreaterThanOrEqual(70);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('penalizes high token usage', () => {
    const high = { ...baseTrace, metrics: { ...baseTrace.metrics, tokensUsed: 125000 } };
    const normal = scoreSession(baseTrace);
    const penalized = scoreSession(high);
    expect(penalized.score).toBeLessThan(normal.score);
  });

  it('penalizes incomplete tasks', () => {
    const incomplete = { ...baseTrace, outcome: { ...baseTrace.outcome, taskCompleted: false } };
    const result = scoreSession(incomplete);
    expect(result.score).toBeLessThan(scoreSession(baseTrace).score);
  });

  it('penalizes retries', () => {
    const retried = { ...baseTrace, outcome: { ...baseTrace.outcome, retries: 5 } };
    const result = scoreSession(retried);
    expect(result.score).toBeLessThan(scoreSession(baseTrace).score);
  });

  it('penalizes user corrections', () => {
    const corrected = { ...baseTrace, outcome: { ...baseTrace.outcome, userCorrections: 3 } };
    const result = scoreSession(corrected);
    expect(result.score).toBeLessThan(scoreSession(baseTrace).score);
  });

  it('returns all breakdown fields between 0 and 100', () => {
    const result = scoreSession(baseTrace);
    for (const val of Object.values(result.breakdown)) {
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThanOrEqual(100);
    }
  });

  it('weighted score matches manual calculation', () => {
    const result = scoreSession(baseTrace);
    const manual =
      result.breakdown.tokenEfficiency * 0.3 +
      result.breakdown.taskCompletion * 0.3 +
      result.breakdown.compactionHealth * 0.2 +
      result.breakdown.errorRate * 0.1 +
      result.breakdown.userFriction * 0.1;
    expect(result.score).toBeCloseTo(Math.round(manual));
  });
});
```

**Step 2: Run test — expected FAIL**

**Step 3: Implement `src/application/loop/effectiveness-scorer.ts`**

Pure function `scoreSession(trace: SessionTrace): EffectivenessScore`:
- `tokenEfficiency`: `100 * (1 - tokensUsed / tokenBudget)`, clamped 0-100
- `taskCompletion`: 100 if completed, minus 15 per retry, minus 20 per correction, floor 0
- `compactionHealth`: 100 if no compaction needed, or based on tokensSaved ratio, 0 if budget exceeded
- `errorRate`: `100 * (1 - errors / totalActions)` where totalActions = compactions + subagents + commands + 1
- `userFriction`: `100 - (corrections * 25)`, clamped 0-100
- Final score = weighted sum rounded to integer

**Step 4: Run test — expected PASS**

**Step 5: Commit**

```bash
git add src/application/loop/effectiveness-scorer.ts tests/unit/effectiveness-scorer.spec.ts
git commit -m "feat(loop): implement effectiveness scorer — rates sessions 0-100"
```

---

### Task 6: Application — Trace Persistence (write + read)

**Files:**
- Create: `src/application/loop/trace-store.ts`

**Step 1: Write the failing test**

Create: `tests/unit/trace-store.spec.ts`

Test `writeTrace(workspaceRoot, trace)` and `readTraces(workspaceRoot, options?)`:
- Writes trace JSON to `.hforge/runtime/traces/session-{id}.trace.json`
- Appends score to `.hforge/runtime/insights/effectiveness-ledger.ndjson`
- Reads traces by date range
- Limits to last N traces

Use a temp directory (vitest `beforeEach` with `mkdtemp`).

**Step 2: Run test — expected FAIL**

**Step 3: Implement using existing `writeJsonFile`, `appendNdjson`, `readJsonFile` patterns from `@shared/fs.js` and `@infra/events/ndjson-writer.js`**

**Step 4: Run test — expected PASS**

**Step 5: Commit**

```bash
git add src/application/loop/trace-store.ts tests/unit/trace-store.spec.ts
git commit -m "feat(loop): implement trace persistence — write/read traces and scores"
```

---

### Task 7: Integration — Wire Recorder into CLI Emitter

**Files:**
- Modify: `src/cli/cli-emitter.ts` — attach SessionRecorder as event listener
- Modify: `src/cli/index.ts` — on session end, build trace + score + persist

**Step 1: Write the failing test**

Create: `tests/integration/loop-cli-integration.spec.ts`

Test that when the CLI emitter fires session.started → some events → session.ended, a trace file is written.

**Step 2-5: Implement, test, commit**

```bash
git commit -m "feat(loop): wire SessionRecorder into CLI lifecycle — auto-trace sessions"
```

---

## Phase 2: LEARN — Pattern Extraction + Insight Store

### Task 8: Domain Types — Insight Pattern

**Files:**
- Create: `src/domain/loop/insight-pattern.ts`
- Modify: `src/domain/loop/index.ts`

Zod schema for `InsightPattern`:
- `id`, `type` (enum: compaction_affinity, budget_sweet_spot, skill_effectiveness, failure_mode, time_pattern, pack_gap), `confidence` (0-1), `sampleSize`, `discoveredAt`, `lastValidated`, `finding` (string), `evidence` (Record<string, unknown>), `recommendation` (optional: `{ action, params, impact }`)

**Test, implement, commit.**

```bash
git commit -m "feat(loop): add InsightPattern domain type"
```

---

### Task 9: Application — Pattern Extractor

**Files:**
- Create: `src/application/loop/pattern-extractor.ts`

Deterministic statistical analysis on the effectiveness ledger. Implement extractors:
- `extractCompactionAffinity(scores)` — group by compaction strategy, compare avg savings
- `extractBudgetSweetSpot(scores)` — find threshold where scores peak
- `extractSkillEffectiveness(scores, traces)` — correlate skill usage with scores
- `extractFailureModes(scores, traces)` — cluster low-scoring sessions
- `extractPackGaps(traces)` — detect frequent search patterns without matching pack

Main entry: `extractPatterns(workspaceRoot): Promise<InsightPattern[]>`

Confidence = `min(1, sampleSize / 20) * (1 - variance / maxVariance)`

**Test each extractor individually, then integration test for `extractPatterns`.**

```bash
git commit -m "feat(loop): implement pattern extractor — mines ledger for insights"
```

---

### Task 10: Application — Insight Store

**Files:**
- Create: `src/application/loop/insight-store.ts`

Functions:
- `savePatterns(workspaceRoot, patterns)` — write to patterns.json, append changelog
- `loadPatterns(workspaceRoot)` — read current patterns
- `getRecommendations(workspaceRoot)` — filter patterns with confidence >= 0.5
- `shouldExtract(workspaceRoot)` — check if 5+ new sessions since last extraction

**Test, implement, commit.**

```bash
git commit -m "feat(loop): implement insight store — persist and query patterns"
```

---

### Task 11: CLI Command — `hforge learn` + `hforge insights`

**Files:**
- Create: `src/cli/commands/learn.ts`
- Modify: `src/cli/index.ts` — register learn commands

`hforge learn` — runs pattern extraction manually
`hforge insights` — displays discovered patterns with confidence bars
`hforge score` — displays recent effectiveness scores
`hforge trace` — displays recent session traces

**Test, implement, commit.**

```bash
git commit -m "feat(loop): add learn/insights/score/trace CLI commands"
```

---

## Phase 3: ADAPT — Policy Tuner + Guardrails

### Task 12: Domain Types — Tuning Record + Tunable Parameters

**Files:**
- Create: `src/domain/loop/tuning-record.ts`
- Modify: `src/domain/loop/index.ts`

Zod schemas:
- `TunableParameter` — enum of tunable config keys
- `TuningBounds` — min/max per parameter
- `TuningRecord` — id, parameter, previousValue, newValue, triggeringPatternId, appliedAt, rolledBack (boolean)

**Test, implement, commit.**

```bash
git commit -m "feat(loop): add TuningRecord and TunableBounds domain types"
```

---

### Task 13: Application — Policy Tuner

**Files:**
- Create: `src/application/loop/policy-tuner.ts`

Functions:
- `applyTunings(workspaceRoot, patterns)` — for patterns with confidence >= 0.7, apply to config files
- `checkRollback(workspaceRoot)` — if last 3 sessions after a tuning scored worse, revert
- `revertTuning(workspaceRoot, tuningId)` — restore previous value
- `listTunings(workspaceRoot)` — read tuning log
- `unlockParameter(workspaceRoot, param)` — allow tuner to modify a user-set param

Guardrails implemented inline: bounds checking, user-override detection, audit logging.

**Test each function. Test rollback logic thoroughly.**

```bash
git commit -m "feat(loop): implement policy tuner with guardrails and rollback"
```

---

### Task 14: CLI Command — `hforge adapt` + `hforge loop`

**Files:**
- Create: `src/cli/commands/adapt.ts`
- Create: `src/cli/commands/loop.ts`
- Modify: `src/cli/index.ts`

`hforge adapt` — show tuning log
`hforge adapt --revert <id>` — revert a tuning
`hforge adapt --unlock <param>` — unlock a parameter
`hforge loop` — show loop health (traces count, patterns count, tunings count, scores avg)

**Test, implement, commit.**

```bash
git commit -m "feat(loop): add adapt and loop CLI commands"
```

---

## Phase 4: SHARE + IMPORT — State Portability

### Task 15: Domain Types — Bundle Manifest

**Files:**
- Create: `src/domain/loop/bundle-manifest.ts`
- Create: `src/domain/loop/repo-fingerprint.ts`
- Modify: `src/domain/loop/index.ts`

Zod schemas:
- `RepoFingerprint` — languageMix (Record<string, number>), fileCount, frameworkHints (string[]), avgSessionScore
- `BundleManifest` — bundleId, formatVersion, createdAt, sourceRepoFingerprint, exportProfile, contents (string[])

**Test, implement, commit.**

```bash
git commit -m "feat(loop): add BundleManifest and RepoFingerprint domain types"
```

---

### Task 16: Application — State Exporter

**Files:**
- Create: `src/application/loop/state-exporter.ts`

Functions:
- `createBundle(workspaceRoot, outputPath, options?)` — zip insights + policies + packs list + fingerprint
- `createRepoFingerprint(workspaceRoot)` — language mix from scan, file count, frameworks
- `exportInsightsOnly(workspaceRoot, outputPath)` — lightweight bundle

Uses Node.js built-in `zlib` for zip creation (or `archiver` if already a dependency).

**Test with temp directories.**

```bash
git commit -m "feat(loop): implement state exporter — creates .hfb bundles"
```

---

### Task 17: Application — Bundle Importer + Insight Merger

**Files:**
- Create: `src/application/loop/bundle-importer.ts`
- Create: `src/application/loop/insight-merger.ts`

`importBundle(workspaceRoot, bundlePath, options?)`:
1. Extract zip, validate manifest
2. Compare repo fingerprint (warn if divergent)
3. Merge insights via `mergeInsights(local, imported)`
4. Optionally apply policies
5. Log merge to merge-log.ndjson

`mergeInsights(local, imported)`:
- Higher confidence wins
- Larger sample breaks ties
- New patterns added with 20% confidence discount
- Returns merged patterns + conflict log

**Test merge logic extensively — same pattern IDs, different confidence, new patterns.**

```bash
git commit -m "feat(loop): implement bundle importer and insight merger"
```

---

### Task 18: CLI Commands — `hforge export`, `hforge import`, `hforge sync`

**Files:**
- Modify: `src/cli/commands/export.ts` — add `--bundle` and `--insights-only` options
- Create: `src/cli/commands/import-bundle.ts`
- Create: `src/cli/commands/sync.ts`
- Modify: `src/cli/index.ts`

`hforge export --bundle <file>` — create .hfb bundle
`hforge export --insights-only <file>` — lightweight export
`hforge import <file>` — import bundle with diff preview
`hforge import <file> --dry-run` — preview only
`hforge import <file> --insights-only` — import patterns only
`hforge share --to <url>` — push insights to git branch or file path
`hforge sync --from <url>` — pull and merge shared insights

**Test, implement, commit.**

```bash
git commit -m "feat(loop): add export --bundle, import, and sync CLI commands"
```

---

## Phase 5: DASHBOARD — Loop Visualization

### Task 19: New Behavior Events for Loop

**Files:**
- Modify: `src/domain/behavior/behavior-event-types.ts` — add loop events
- Modify: `src/application/behavior/behavior-event-emitter.ts` — add emit methods
- Modify: `src/domain/dashboard/signal-channels.ts` — add loop signal channels

New event types:
```typescript
export const LOOP_TRACE_RECORDED = 'loop.trace.recorded' as const;
export const LOOP_PATTERN_EXTRACTED = 'loop.pattern.extracted' as const;
export const LOOP_TUNING_APPLIED = 'loop.tuning.applied' as const;
export const LOOP_TUNING_REVERTED = 'loop.tuning.reverted' as const;
export const LOOP_BUNDLE_EXPORTED = 'loop.bundle.exported' as const;
export const LOOP_BUNDLE_IMPORTED = 'loop.bundle.imported' as const;
```

New signal channels:
```typescript
'loop.observe'    — trace + score events
'loop.learn'      — pattern extraction events
'loop.adapt'      — tuning events
'loop.share'      — export/import events
'loop.health'     — aggregated loop status
```

**Update contract test counts. Test, implement, commit.**

```bash
git commit -m "feat(loop): add loop behavior events and dashboard signal channels"
```

---

### Task 20: Dashboard — Loop Health Ring Panel

**Files:**
- Create: `src/dashboard/src/panels/LoopHealthRing.tsx`

A ring/arc visualization with 5 segments (Observe, Learn, Adapt, Share, Import):
- Each segment colored by activity status (green = active, amber = stale, dim = inactive)
- Count badges on each segment
- Center: overall loop health score (0-100)
- Pulse animation CSS when a full cycle completes
- Uses ECharts gauge or custom SVG arcs

Props: loop health data from reducer state.

**Test with Vitest + React Testing Library if available, or snapshot test.**

```bash
git commit -m "feat(dashboard): add LoopHealthRing panel — ring visualization of loop stages"
```

---

### Task 21: Dashboard — Effectiveness Trend Panel

**Files:**
- Create: `src/dashboard/src/panels/EffectivenessTrend.tsx`

ECharts line chart:
- X-axis: session index (last 20 sessions)
- Y-axis: effectiveness score (0-100)
- Threshold line at 70 (green zone above)
- Tooltip shows breakdown on hover
- Week-over-week comparison annotation

```bash
git commit -m "feat(dashboard): add EffectivenessTrend panel — sparkline of session scores"
```

---

### Task 22: Dashboard — Insights Panel

**Files:**
- Create: `src/dashboard/src/panels/InsightsPanel.tsx`

List of discovered patterns:
- Confidence bar (colored: green > 0.7, amber > 0.5, gray < 0.5)
- Pattern type icon/emoji
- Finding text
- "New" badge for patterns discovered in last 24h
- Click to expand evidence

```bash
git commit -m "feat(dashboard): add InsightsPanel — browsable pattern list with confidence"
```

---

### Task 23: Dashboard — Tuning Log Panel

**Files:**
- Create: `src/dashboard/src/panels/TuningLog.tsx`

Table/list of recent tunings:
- Parameter name, old → new value, triggering pattern
- Status: applied / reverted
- One-click revert button (sends POST to `/api/loop/revert-tuning`)
- Color: green (applied), red (reverted)

```bash
git commit -m "feat(dashboard): add TuningLog panel — policy changes with revert button"
```

---

### Task 24: Dashboard — Wire Loop Panels into App

**Files:**
- Modify: `src/dashboard/src/App.tsx` — add loop panels to layout
- Modify: `src/dashboard/src/state/reducer.ts` — handle loop signal channels
- Modify: `src/dashboard/src/state/types.ts` — add loop state fields

Add to DashboardState:
```typescript
loopHealth: {
  observeCount: number;
  learnCount: number;
  adaptCount: number;
  shareCount: number;
  importCount: number;
  healthScore: number;
  lastCycleAt: string | null;
}
effectivenessScores: readonly number[];  // last 20
patterns: readonly { id: string; type: string; confidence: number; finding: string; isNew: boolean }[];
tunings: readonly { id: string; param: string; oldValue: unknown; newValue: unknown; status: string }[];
```

Layout: LoopHealthRing at top (full width), then EffectivenessTrend + InsightsPanel side-by-side, then TuningLog below.

```bash
git commit -m "feat(dashboard): integrate loop panels into main layout"
```

---

### Task 25: Dashboard Server — Loop API Endpoints

**Files:**
- Modify: `src/application/dashboard/dashboard-server.ts`

Add HTTP endpoints:
- `GET /api/loop/health` — returns loop health summary
- `GET /api/loop/scores` — returns last 20 effectiveness scores
- `GET /api/loop/patterns` — returns current patterns
- `GET /api/loop/tunings` — returns tuning log
- `POST /api/loop/revert-tuning` — reverts a tuning by ID

These endpoints read from the insight store and trace store.

```bash
git commit -m "feat(dashboard): add loop API endpoints to dashboard server"
```

---

## Phase 6: README + Promotion

### Task 26: Behavior Event — Loop Promotion on Dashboard

**Files:**
- Modify: `src/application/loop/session-recorder.ts` — after building trace, emit `loop.trace.recorded`
- Modify: `src/application/loop/pattern-extractor.ts` — after extraction, emit `loop.pattern.extracted`
- Modify: `src/application/loop/policy-tuner.ts` — after applying, emit `loop.tuning.applied`
- Modify: `src/application/loop/state-exporter.ts` — after export, emit `loop.bundle.exported`
- Modify: `src/application/loop/bundle-importer.ts` — after import, emit `loop.bundle.imported`

These emissions drive the dashboard loop ring to light up in real-time.

```bash
git commit -m "feat(loop): emit loop events from all stages — powers dashboard ring"
```

---

### Task 27: Auto-trigger — Pattern Extraction After N Sessions

**Files:**
- Modify: `src/application/loop/trace-store.ts` — after persisting a trace, check `shouldExtract()`
- If yes, run `extractPatterns()` + `applyTunings()` automatically

This closes the loop: every 5 sessions, the harness observes → learns → adapts automatically.

```bash
git commit -m "feat(loop): auto-trigger pattern extraction every 5 sessions"
```

---

### Task 28: README Update — How It Works Section

**Files:**
- Modify: `README.md` — add Living Loop section with emoji table, badges placeholder

Add after the existing "Features" section:

```markdown
## 🔄 The Living Loop

Harness Forge gets smarter every time you use it.

🔍 OBSERVE → 🧠 LEARN → ⚡ ADAPT → 📤 SHARE → 📥 IMPORT
     ↑                                                │
     └────────────────────────────────────────────────┘

| Step | What happens | Example |
|------|-------------|---------|
| 🔍 **Observe** | Tracks how your AI agent works | "Agent hit token ceiling 3x today" |
| 🧠 **Learn** | Finds patterns in your sessions | "Summarize saves 40% more tokens than Trim" |
| ⚡ **Adapt** | Auto-tunes your setup | Compaction threshold lowered 75% → 65% |
| 📤 **Share** | Export your tuned harness | `hforge export --bundle my-team.hfb` |
| 📥 **Import** | Bootstrap anywhere instantly | `hforge import my-team.hfb` → ready in seconds |

> **The more you use it, the better it gets.**
> After ~10 sessions, Harness Forge learns your repo's patterns and tunes itself.
```

```bash
git commit -m "docs: add Living Loop section to README with emoji table"
```

---

### Task 29: Final Integration Test

**Files:**
- Create: `tests/integration/living-loop-e2e.spec.ts`

End-to-end test of the full loop:
1. Create a workspace with traces
2. Run scorer → verify ledger
3. Run extractor → verify patterns
4. Run tuner → verify config changed
5. Export bundle → verify .hfb created
6. Import bundle into new workspace → verify merge

```bash
git commit -m "test(loop): add end-to-end integration test for full Living Loop cycle"
```

---

### Task 30: Update Event Contract Test

**Files:**
- Modify: `tests/contract/behavior-event-types.contract.test.ts`

Update event count assertions to include the 6 new loop events. Update category sums.

```bash
git commit -m "test: update behavior event contract for loop events"
```

---

## Summary

| Phase | Tasks | Key Deliverables |
|-------|-------|-----------------|
| **P1: Observe** | 1-7 | SessionTrace, EffectivenessScore, SessionRecorder, scorer, persistence, CLI wiring |
| **P2: Learn** | 8-11 | InsightPattern, PatternExtractor, InsightStore, `hforge learn/insights` commands |
| **P3: Adapt** | 12-14 | TuningRecord, PolicyTuner with guardrails, `hforge adapt/loop` commands |
| **P4: Share/Import** | 15-18 | BundleManifest, exporter, importer, merger, `hforge export --bundle/import/sync` |
| **P5: Dashboard** | 19-25 | Loop events, LoopHealthRing, EffectivenessTrend, InsightsPanel, TuningLog, API |
| **P6: Promotion** | 26-30 | Event emission, auto-trigger, README, E2E test, contract update |

Total: **30 tasks**, ~150 commits, TDD throughout.
