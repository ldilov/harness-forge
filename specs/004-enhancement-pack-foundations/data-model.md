# Data Model: Harness Forge Enhancement Pack Foundations

## 1. CapabilityTaxonomy

### Purpose

Represents the normalized list of capability families and sub-capabilities that
Harness Forge uses to describe target support.

### Fields

- `version`: taxonomy version
- `families`: top-level capability families
- `subCapabilities`: optional finer-grained capability identifiers
- `descriptions`: human-readable definitions
- `deprecationState`: whether a capability is active, renamed, or retired

### Relationships

- Referenced by many `CapabilityRecord` entries

### Validation Rules

- Every capability identifier must be unique
- Deprecated capabilities must define a successor or rationale
- Public docs must use taxonomy identifiers consistently

## 2. CapabilityRecord

### Purpose

Represents the canonical support statement for one target and one capability.

### Fields

- `targetId`: target identifier
- `capabilityId`: referenced capability identifier
- `supportLevel`: high-level support strength
- `supportMode`: native, translated, emulated, documentation-only, or similar
- `evidenceSource`: supporting docs, manifests, adapters, or validation outputs
- `lastValidatedAt`: validation recency marker
- `validationMethod`: how support was checked
- `confidence`: confidence score
- `notes`: optional human-readable nuance
- `fallbackBehavior`: what users should expect when support is degraded

### Relationships

- Belongs to one `CapabilityTaxonomy`
- Informs one or more `InstructionRecommendation`, `ObservabilitySummary`, and
  `BenchmarkExpectation` records

### Validation Rules

- Each target-capability pair must be unique
- Degraded support must include fallback behavior
- Evidence and validation method are required for every record

## 3. RepoMap

### Purpose

Represents the structured, evidence-backed view of a repository.

### Fields

- `workspaceId`: stable workspace identifier
- `workspaceType`: monorepo, service, library, app, automation, or mixed
- `dominantLanguages`: ranked language detections with confidence
- `frameworks`: ranked framework detections with confidence
- `packageManagers`: detected package-manager or build-system signals
- `services`: detected service, package, or app boundaries
- `criticalPaths`: paths that deserve extra attention
- `highRiskPaths`: risky or sensitive paths
- `existingInstructionSurfaces`: already-present guidance files and scopes
- `qualityGaps`: missing validations or weak spots
- `supportingEvidence`: files or paths that justify the map

### Relationships

- Produces one or more `InstructionPlan` records
- Compared against `BenchmarkExpectation`

### Validation Rules

- Confidence-bearing detections must include evidence
- Critical and high-risk paths must resolve inside the workspace
- Generated or vendor paths must be distinguishable from owned source paths

## 4. InstructionRecommendation

### Purpose

Represents one proposed instruction surface, scope, or guidance section derived
from repo cartography.

### Fields

- `path`: target path or scope
- `surfaceType`: root guidance, scoped guidance, target-specific rule, or docs
- `reason`: why the recommendation exists
- `confidence`: confidence score
- `evidence`: supporting files or traits
- `writeMode`: recommend-only, diffable, or write-ready

### Relationships

- Belongs to one `InstructionPlan`
- References one `RepoMap`
- May be constrained by `CapabilityRecord`

### Validation Rules

- Recommendations must include at least one evidence item
- Scoped recommendations must explain why root-only guidance is insufficient
- Unsupported target surfaces must not be recommended as native

## 5. InstructionPlan

### Purpose

Represents the full synthesized guidance plan for a repository and target.

### Fields

- `workspaceId`: owning workspace
- `targetId`: chosen target
- `scopeStrategy`: root-only, mixed-scope, or scoped-heavy
- `recommendations`: ordered `InstructionRecommendation` list
- `recommendedProfiles`: optional profile suggestions
- `recommendedSkills`: optional skill suggestions
- `generatedArtifacts`: planned output artifacts
- `riskNotes`: warnings or constraints

### Relationships

- Derived from one `RepoMap`
- Influenced by relevant `CapabilityRecord` entries

### Validation Rules

- Recommendations must be deterministic for the same repo state
- Scope strategy must match the recommendation set
- Risk notes must exist when confidence is low or target support is degraded

## 6. ObservabilityEvent

### Purpose

Represents one append-safe local record of something that happened in the
platform.

### Fields

- `eventId`: stable event identifier
- `eventType`: typed event name
- `recordedAt`: timestamp
- `workspaceId`: related workspace
- `target`: related target
- `featureId`: related feature when applicable
- `result`: success, failure, accepted, rejected, blocked, or similar
- `durationMs`: optional timing
- `confidence`: optional confidence marker
- `inputs`: relevant inputs
- `outputs`: relevant outputs
- `artifacts`: referenced artifact paths
- `evidence`: supporting evidence paths
- `tags`: searchable labels

### Relationships

- Aggregated into one or more `ObservabilitySummary` records
- May be referenced by `BenchmarkExpectation`

### Validation Rules

- Event identity and type are always required
- Event payloads must remain useful without an external collector
- Artifact references must be local and inspectable when present

## 7. ObservabilitySummary

### Purpose

Represents reproducible rollups derived from local observability events.

### Fields

- `generatedAt`: summary generation time
- `workspaceScope`: workspace, target, feature, or global scope
- `recommendationAcceptanceRate`: accepted vs rejected summary
- `benchmarkPassRate`: pass rate by target or fixture
- `flowRecoveryMetrics`: recovery success and timing
- `hookFailureMetrics`: failure counts and hotspots
- `skillUsefulnessMetrics`: accepted outcomes by skill
- `driftFindings`: capability or docs drift warnings
- `instructionSynthesisMetrics`: acceptance and rejection outcomes

### Relationships

- Derived from many `ObservabilityEvent` records
- Compared against `BenchmarkExpectation`

### Validation Rules

- Summaries must be reproducible from raw events
- Metric definitions must remain stable enough for release comparisons
- Drift findings must point back to evidence

## 8. BenchmarkExpectation

### Purpose

Represents the expected outcome for a fixture or scenario.

### Fields

- `fixtureId`: stable fixture identifier
- `repoArchetype`: scenario type
- `expectedRepoMap`: expected repo facts
- `expectedRecommendations`: expected recommendations and warnings
- `expectedInstructionScopes`: expected guidance scopes
- `expectedQualityGaps`: expected weak spots
- `expectedObservabilityEvents`: expected event families or outcomes
- `expectedParallelDecision`: expected parallel strategy

### Relationships

- Validates `RepoMap`, `InstructionPlan`, `ObservabilitySummary`, and
  `ParallelExecutionPlan`

### Validation Rules

- Expectations must be specific enough to catch regressions
- Expectations must stay aligned with the fixture contents
- Target warnings must be explicit when degraded support is expected

## 9. ParallelExecutionPlan

### Purpose

Represents the recommended execution strategy for a feature or backlog.

### Fields

- `planId`: plan identifier
- `featureId`: related feature
- `strategy`: single-thread, local-isolated, cloud-style, or emulated
- `rootTask`: overall objective
- `shards`: planned shard list
- `dependencies`: task or shard dependency list
- `sharedRiskPaths`: risky shared paths
- `expectedArtifacts`: expected outputs
- `validationGates`: required validation steps
- `mergeCriteria`: required merge conditions
- `rollbackPlan`: rollback guidance
- `fallbackToSingleThreadReason`: reason when no safe split exists

### Relationships

- References many `ShardState` records
- Can emit `ObservabilityEvent` records
- May be compared against `BenchmarkExpectation`

### Validation Rules

- Any parallel strategy must define merge criteria and validation gates
- Shared-risk paths are required when overlap is non-trivial
- Blocked or single-thread outcomes must explain why

## 10. ShardState

### Purpose

Represents the current status of one isolated execution shard.

### Fields

- `shardId`: shard identifier
- `assignedTasks`: owned task identifiers
- `executionLocation`: branch, worktree, or equivalent location
- `status`: planned, active, blocked, complete, abandoned
- `lastCheckIn`: freshness marker
- `validationStatus`: pending, passing, failing, or stale
- `mergeReadiness`: ready, blocked, or unknown
- `blockers`: blocking reasons

### Relationships

- Belongs to one `ParallelExecutionPlan`
- Produces `MergeReadinessFinding` records

### Validation Rules

- Every active shard must have an execution location
- Blocked shards must list at least one blocker
- Validation status must be explicit before merge

## 11. MergeReadinessFinding

### Purpose

Represents a human-inspectable explanation of why a parallel plan can or cannot
merge safely.

### Fields

- `planId`: related plan
- `status`: ready or blocked
- `reasons`: blocking or approval reasons
- `overlapPaths`: overlapping or contested paths
- `staleDependencies`: stale or missing dependencies
- `missingArtifacts`: expected outputs not yet produced
- `requiredActions`: concrete next steps

### Relationships

- References one `ParallelExecutionPlan`
- May summarize many `ShardState` records

### Validation Rules

- Blocked findings must contain actionable reasons
- Missing artifacts and overlap paths must be explicit when relevant
- Required actions must align with the plan’s merge criteria
