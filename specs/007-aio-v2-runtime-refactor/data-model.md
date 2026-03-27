# Data Model: Harness Forge AIO v2 Runtime Refactor

## AILayerRoot

**Purpose**: Represents the hidden `.hforge/` AI layer that acts as the
authoritative system of record for installed agentic support content.

**Fields**:
- `layerId` - Stable identifier for the installed AI layer.
- `rootPath` - Canonical hidden root path.
- `visibilityMode` - Local-only, selectively shared, or exported-only.
- `status` - Draft, active, stale, superseded, or missing.
- `authoritativeSurfaces` - Named hidden surfaces such as library, runtime,
  tasks, cache, exports, state, and generated helpers.

**Relationships**:
- Owns many `HiddenKnowledgeSurface`, `RepoIntelligenceArtifact`, `TaskPack`,
  `WorkingMemoryArtifact`, and `ExportBundle` records.
- Is referenced by many `DiscoveryBridge` records.
- Is governed by one `VisibilityPolicy`.

**Validation Rules**:
- There must be one active authoritative AI layer per installed workspace.
- `rootPath` must resolve to a hidden `.hforge/` surface.
- `authoritativeSurfaces` must distinguish durable and short-term content.

## VisibilityPolicy

**Purpose**: Defines what stays hidden in `.hforge/`, what can appear at the
repo root, and what may be intentionally shared.

**Fields**:
- `policyId` - Stable visibility-policy identifier.
- `defaultTrackingMode` - Ignored, shared-by-exception, or tracked.
- `allowedVisibleSurfaces` - Root or target-native bridges allowed to remain
  visible.
- `hiddenCanonicalSurfaces` - Hidden surfaces that must not become visible
  product-root content.
- `shareableOutputs` - Bundles or selected artifacts that may be exported or
  intentionally shared.
- `violationBehavior` - Warn, block, or require explicit opt-in.

**Relationships**:
- Governs one `AILayerRoot`.
- Constrains many `DiscoveryBridge` and `ExportBundle` records.

**Validation Rules**:
- Hidden canonical surfaces must not overlap with visible bridge-only
  allowances.
- A policy must define at least one shareable path for collaboration.
- Default tracking mode must be explicit.

## DiscoveryBridge

**Purpose**: Describes a thin visible surface that routes an agent runtime into
the hidden AI layer.

**Fields**:
- `bridgeId` - Stable bridge identifier.
- `targetId` - Runtime identifier such as codex, claude-code, cursor, or
  opencode.
- `surfacePath` - Visible root or target-native path.
- `bridgeType` - Root instruction, wrapper skill, target-native runtime file,
  scoped bridge, or compatibility note.
- `linkedLayerPath` - Hidden-layer location the bridge exposes.
- `supportMode` - Native, translated, partial, documentation-only, or
  unsupported.
- `status` - Active, degraded, stale, or missing.
- `justification` - Why the bridge is required.

**Relationships**:
- References one `AILayerRoot`.
- Belongs to one `CompatibilityProfile`.
- Is constrained by one `VisibilityPolicy`.

**Validation Rules**:
- Every active bridge must point to hidden authoritative content rather than a
  duplicate visible copy.
- Scoped bridges require explicit justification.
- `status` must indicate degradation when the hidden linked surface is missing
  or stale.

## HiddenKnowledgeSurface

**Purpose**: Represents one durable hidden content family inside `.hforge/`,
such as skills, rules, knowledge, or templates.

**Fields**:
- `surfaceId` - Stable surface identifier.
- `surfaceType` - Skills, rules, knowledge, templates, runtime, tasks, cache,
  exports, state, or generated.
- `path` - Hidden-layer path.
- `authorityLevel` - Canonical, derived, cache, or export.
- `consumerTypes` - Humans, agents, automation, or mixed.
- `freshnessState` - Fresh, stale, superseded, or missing.

**Relationships**:
- Belongs to one `AILayerRoot`.
- May contain many `RepoIntelligenceArtifact`, `TaskPack`, or
  `WorkingMemoryArtifact` records.

**Validation Rules**:
- Canonical surfaces must not be represented as visible repo-root product
  folders.
- Cache or export surfaces must not be mislabeled as canonical.
- Hidden surface type must remain explicit.

## CompatibilityProfile

**Purpose**: Records how a runtime supports discovery, task-pack consumption,
working memory, export behavior, and other hidden-layer capabilities.

**Fields**:
- `targetId` - Stable runtime identifier.
- `capabilityAreas` - Capability families covered by the profile.
- `supportModes` - Per-capability support states.
- `supportSummary` - Human-readable explanation of supported behavior.
- `fallbackNotes` - Required notes for translated or reduced behavior.
- `reviewStatus` - Draft, confirmed, approved, or stale.

**Relationships**:
- Owns many `DiscoveryBridge` records.
- May reference `TaskPack` or `ExportBundle` delivery expectations.

**Validation Rules**:
- Every supported target must have one compatibility profile.
- Partial or translated support requires fallback notes.
- Compatibility claims must not contradict bridge or runtime docs.

## RepoIntelligenceArtifact

**Purpose**: Captures structured hidden runtime knowledge about repository
layout, boundaries, conventions, risk areas, and trust metadata.

**Fields**:
- `artifactId` - Stable artifact identifier.
- `artifactType` - Repo map, recommendations, support summary, scan summary,
  risk findings, or validation gaps.
- `scope` - Whole repo, workspace segment, module, or bounded context.
- `contentSummary` - Human-readable description of the artifact.
- `evidenceBasis` - Repo state or signals that shaped the artifact.
- `confidence` - Inferred, partial, or strongly evidenced confidence level.
- `reviewStatus` - Proposed, confirmed, approved, stale, or superseded.
- `updatedAt` - Last refresh timestamp.

**Relationships**:
- Belongs to one `HiddenKnowledgeSurface`.
- May inform many `TaskPack` and `ExportBundle` records.

**Validation Rules**:
- Confidence and review status must be explicit.
- `artifactType` must be distinguishable.
- Hidden repo intelligence must remain inspectable without being mistaken for
  product source.

## TaskPack

**Purpose**: Represents the primary hidden-layer context bundle for a feature,
bugfix, refactor, or investigation.

**Fields**:
- `taskId` - Stable task identifier.
- `summary` - Short task statement.
- `requestedOutcome` - User or business goal.
- `requirements` - Structured requirement items.
- `implementationNotes` - Evidence-backed task notes.
- `impactedModules` - Likely affected modules or files.
- `risks` - Key task risk statements.
- `acceptanceCriteria` - Verifiable expected outcomes.
- `testImplications` - Validation and regression expectations.
- `nextStep` - Recommended immediate next action.
- `storageMode` - Active, archived, exported, or superseded.

**Relationships**:
- Belongs to one `HiddenKnowledgeSurface`.
- May reference many `RepoIntelligenceArtifact` records.
- May link to one active `WorkingMemoryArtifact`.
- May be included in many `ExportBundle` records.

**Validation Rules**:
- Active task packs must include requested outcome, requirements, impacted
  modules, risks, acceptance criteria, and test implications.
- `nextStep` cannot be empty while active.
- Hidden task packs must not require visible root-level note trees.

## WorkingMemoryArtifact

**Purpose**: Models the compact hidden short-term cache for ongoing work.

**Fields**:
- `artifactId` - Stable working-memory identifier.
- `currentObjective` - Immediate goal.
- `currentPlan` - Short ordered plan.
- `filesInFocus` - Files currently under attention.
- `confirmedFacts` - Verified facts.
- `openQuestions` - Outstanding questions.
- `failedAttempts` - Short list of recent meaningful failures.
- `nextStep` - Immediate next action.
- `lastUpdated` - Latest refresh timestamp.
- `promotionStatus` - Needs-promotion, promoted, or local-only.

**Relationships**:
- Belongs to one `HiddenKnowledgeSurface`.
- May reference one active `TaskPack`.

**Validation Rules**:
- Active memory requires `currentObjective`, `currentPlan`, and `nextStep`.
- Confirmed facts must remain distinguishable from open questions.
- The artifact must remain compact and must not become a transcript archive.

## ExportBundle

**Purpose**: Represents a portable handoff artifact intentionally derived from
the hidden AI layer.

**Fields**:
- `bundleId` - Stable export identifier.
- `bundleType` - Review pack, task handoff, runtime summary, or target-oriented
  bundle.
- `sourceArtifacts` - Hidden-layer artifacts included in the bundle.
- `audience` - Human reviewer, another agent, maintainer, or mixed audience.
- `scopeSummary` - Short description of what the export covers.
- `freshnessStamp` - Timestamp and trust summary for the bundle.
- `sharingMode` - Local file, intentional commit, or ephemeral handoff.

**Relationships**:
- Belongs to one `AILayerRoot`.
- May contain many `TaskPack` and `RepoIntelligenceArtifact` records.
- Is governed by one `VisibilityPolicy`.

**Validation Rules**:
- Export bundles must not be treated as the canonical runtime.
- `sourceArtifacts` must remain traceable to hidden authoritative surfaces.
- Sharing mode must be explicit.
