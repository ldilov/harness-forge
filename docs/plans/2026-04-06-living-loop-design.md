# The Living Loop — Self-Improving Harness Architecture

**Date:** 2026-04-06
**Status:** Approved
**Branch:** releases/1.5.0
**Approach:** B — Unified Self-Improving Platform

---

## Overview

Harness Forge evolves from passive infrastructure to an **active, self-improving harness** via a closed feedback loop:

```
🔍 OBSERVE → 🧠 LEARN → ⚡ ADAPT → 📤 SHARE → 📥 IMPORT
     ↑                                                │
     └────────────────────────────────────────────────┘
```

Every session feeds the loop. The more you use it, the smarter it gets.

---

## Loop Stages

### Stage 1: OBSERVE — Session Telemetry & Effectiveness Scoring

**Session Recorder** captures structured traces beyond raw events:

```
.hforge/runtime/traces/session-<id>.trace.json
```

Each trace contains:
- Aggregated metrics: tokens used/budget, compactions triggered, strategy used, tokens saved, subagents spawned, skills invoked
- Outcome signal: task completed, retries, user corrections, budget exceeded, error count
- Compact event timeline with timestamps

**Effectiveness Scorer** rates each session 0-100:
- Token efficiency (30%): tokens_used / tokens_budget
- Task completion (30%): binary + retry penalty
- Compaction health (20%): timing + savings
- Error rate (10%): errors / total_actions
- User friction (10%): corrections + overrides

Scores appended to: `.hforge/runtime/insights/effectiveness-ledger.ndjson`

### Stage 2: LEARN — Pattern Extraction & Insight Store

**Pattern Extractor** runs after every 5 sessions or manually via `hforge learn`.

Pattern types detected:
- **Compaction affinity**: Which strategy yields best savings for this repo
- **Budget sweet spots**: Optimal thresholds before compaction triggers
- **Skill effectiveness**: Which skills correlate with higher scores
- **Failure modes**: Recurring patterns in low-scoring sessions
- **Time patterns**: When sessions perform best
- **Pack gaps**: Missing packs agent keeps searching for

Extractor is **deterministic** — statistical analysis on the ledger, no LLM calls.

**Insight Store**:
```
.hforge/runtime/insights/
├── effectiveness-ledger.ndjson   # Raw session scores
├── patterns.json                 # Extracted patterns
├── recommendations.json          # Actionable recommendations
└── changelog.ndjson              # Pattern change history
```

Pattern records include: id, type, confidence (0-1), sample size, finding, evidence, recommendation.

Confidence thresholds:
- < 0.5: Observation only (dashboard display)
- 0.5–0.7: Suggestion (surfaced via `hforge next`)
- > 0.7: Eligible for auto-tuning

### Stage 3: ADAPT — Policy Auto-Tuning

**Policy Tuner** applies high-confidence (>0.7) patterns to runtime config.

Tunable parameters:
| Policy | Config File |
|--------|------------|
| Compaction trigger threshold | context-budget.json |
| Preferred compaction strategy | context-budget.json |
| Memory rotation cap | memory-policy.json |
| Subagent brief length | default-brief-policy.json |
| Load order priority | load-order.json |
| Output profile defaults | output-profiles.json |

**Guardrails:**
1. Hard min/max bounds on every parameter
2. Audit trail in tuning-log.ndjson (before/after + triggering pattern)
3. Auto-rollback if next 3 sessions score lower than pre-tuning average
4. User manual overrides are sacred — tuner won't touch them
5. Dashboard notification with one-click revert

**Skill Recommender** surfaces pack installation suggestions based on observed usage gaps.

### Stage 4: SHARE — State Export & Team Sync

**State Exporter** creates portable `.hfb` bundles (zip format):

```
my-team.hfb (zip)
├── manifest.json                  # Metadata, version, repo fingerprint
├── insights/                      # Patterns + scores (anonymized)
├── policies/                      # Tuned config files
├── packs/installed-packs.json     # Pack list (not pack content)
├── profile/selected-profile.json
└── meta/repo-fingerprint.json     # Language mix, file count, framework hints (no code)
```

No source code or secrets ever included.

**Team Sync** uses git as transport:
```bash
hforge share --to git://origin/hforge-insights
hforge sync --from git://origin/hforge-insights
```

### Stage 5: IMPORT — Bundle Bootstrap & Insight Merger

**Bundle Importer** workflow:
1. Validate bundle (version, integrity)
2. Compare repo fingerprint (warn if very different)
3. Show diff preview with selective merge option
4. Apply changes
5. Log import event

**Insight Merger** conflict resolution:
- Higher confidence wins
- Larger sample size breaks ties
- Local user overrides are sacred
- New patterns added with 20% confidence discount
- Conflicts logged to merge-log.ndjson

---

## New CLI Commands

| Command | Stage | Description |
|---------|-------|-------------|
| `hforge trace` | Observe | View recent session traces |
| `hforge score` | Observe | Show effectiveness scores |
| `hforge learn` | Learn | Trigger pattern extraction |
| `hforge insights` | Learn | Browse discovered patterns |
| `hforge adapt` | Adapt | Show/manage auto-tunings |
| `hforge adapt --revert <id>` | Adapt | Revert a specific tuning |
| `hforge adapt --unlock <param>` | Adapt | Re-enable tuner for user-set param |
| `hforge export --bundle <file>` | Share | Create portable bundle |
| `hforge share --to <url>` | Share | Push insights to shared location |
| `hforge import <file>` | Import | Bootstrap from bundle |
| `hforge sync --from <url>` | Import | Pull shared team insights |
| `hforge loop` | Meta | Show loop health summary |

---

## Dashboard Integration

### Loop Status Ring (top-level panel)

Circular ring visualization at top of dashboard:
- 5 segments: Observe, Learn, Adapt, Share, Import
- Each segment lights up when active, shows count badges
- Color-coded health: green/amber/red
- Clickable for drill-down into stage detail panel
- Pulse animation when loop completes a full cycle

### Stage Detail Panels

| Stage | Panel Content |
|-------|--------------|
| Observe | Live trace feed, token spend sparkline, score history |
| Learn | Pattern list with confidence, "new this week" badge |
| Adapt | Policy change log with before/after, revert button |
| Share | Export history, bundle preview, sync status |
| Import | Import history, merge log, what changed |

### Effectiveness Panel
- Score trend sparkline (last 10 sessions)
- Average score with week-over-week comparison
- Top patterns with confidence scores

---

## README Promotion

### "How It Works" section with emoji table

```
🔍 OBSERVE → 🧠 LEARN → ⚡ ADAPT → 📤 SHARE → 📥 IMPORT

| Step | What happens | Example |
|------|-------------|---------|
| 🔍 Observe | Tracks how your AI agent works | "Agent hit token ceiling 3x today" |
| 🧠 Learn | Finds patterns in your sessions | "Summarize saves 40% more tokens" |
| ⚡ Adapt | Auto-tunes your setup | Threshold lowered 75% → 65% |
| 📤 Share | Export your tuned harness | hforge export --bundle team.hfb |
| 📥 Import | Bootstrap anywhere instantly | hforge import team.hfb |
```

### Status badges at top of README
- Loop Health badge (score %)
- Patterns Learned badge (count)
- Policy Tunings badge (count)
- Generated by `hforge status --badges`

---

## File Layout

```
.hforge/runtime/
├── traces/                        # Session trace files
│   └── session-<id>.trace.json
├── insights/
│   ├── effectiveness-ledger.ndjson
│   ├── patterns.json
│   ├── recommendations.json
│   ├── changelog.ndjson
│   ├── tuning-log.ndjson
│   └── merge-log.ndjson
└── (existing files unchanged)
```

---

## Domain Types Needed

- SessionTrace
- EffectivenessScore / ScoreBreakdown
- InsightPattern / PatternType / PatternConfidence
- TunableParameter / TuningRecord / TuningBounds
- HarnessForgBundle / BundleManifest / RepoFingerprint
- MergeResult / MergeConflict
- LoopHealth / LoopStageStatus

---

## Implementation Priority

1. **P0 — Observe**: Session Recorder + Effectiveness Scorer (foundation for everything)
2. **P0 — Learn**: Pattern Extractor + Insight Store (no value without extraction)
3. **P1 — Adapt**: Policy Tuner + guardrails (the payoff)
4. **P1 — Dashboard**: Loop ring + stage panels (visibility)
5. **P2 — Share**: State Exporter + bundle format
6. **P2 — Import**: Bundle Importer + Insight Merger
7. **P2 — Team Sync**: Git-based sharing
8. **P3 — README**: Badges + How It Works section
