# Data Model: Harness Forge Platform Depth, Intelligence, and Runtime Maturity

## 1. StructuredPack

### Purpose

Represents a first-class language or framework pack that users can install,
inspect, recommend, and validate.

### Fields

- `id`: stable pack identifier
- `kind`: `language-pack` or `framework-pack`
- `displayName`: user-facing name
- `baseLanguage`: owning language for framework packs
- `maturity`: seeded, expanding, stable, or limited
- `docPaths`: overview and guidance document paths
- `rulePaths`: promoted rule files
- `workflowPaths`: language- or framework-aware workflow files
- `skillPaths`: canonical and auto-discoverable skill paths
- `examplePaths`: scenario examples
- `detectionSignals`: repo traits used to recommend the pack
- `qualityScore`: aggregate coverage/depth score

### Relationships

- May extend another `StructuredPack`
- Is recommended by one or more `RepoIntelligenceResult` records
- Is constrained by `CompatibilityEntry` records

### Validation Rules

- First-class packs must meet minimum content depth and example count
- Framework packs must reference a valid base language
- Detection signals must resolve to documented evidence rules

## 2. OperationalSkill

### Purpose

Represents a reusable skill with explicit activation logic and a deterministic
artifact contract.

### Fields

- `id`: stable skill identifier
- `category`: language, framework, workload, governance, or flow
- `triggerSignals`: conditions for activation
- `firstInspectPaths`: paths or surfaces to inspect first
- `workflowSteps`: ordered operational stages
- `outputContract`: required artifact shape
- `failureModes`: known blocked or degraded states
- `escalationRules`: conditions for human or higher-level escalation
- `referencePaths`: optional deeper references

### Relationships

- May support one or more `StructuredPack` records
- May be recommended by `RepoIntelligenceResult`
- May be emphasized by an `OperatingProfile`

### Validation Rules

- Must define trigger conditions and output contract
- Non-trivial skills must include at least one example or supporting reference
- Referenced files must resolve inside the package surface

## 3. RepoIntelligenceResult

### Purpose

Represents the evidence-backed interpretation of a repository and the resulting
recommendations.

### Fields

- `repoType`: service, library, monorepo, app, automation, mixed, or similar
- `dominantLanguages`: ranked language list with evidence
- `frameworkMatches`: ranked framework detections with confidence
- `buildSignals`: package manager, build tool, workspace model
- `testSignals`: discovered test stack and quality hints
- `deploymentSignals`: deployment or runtime indicators
- `riskSignals`: security, migration, release, or drift-sensitive findings
- `recommendedBundles`: ranked bundle suggestions with rationale
- `recommendedProfiles`: ranked operating profiles with rationale
- `recommendedSkills`: ranked skills with rationale
- `missingValidationSurfaces`: suggested checks or surfaces not yet present

### Relationships

- References many `StructuredPack`, `OperationalSkill`, and `OperatingProfile`
  records
- May be compared against `BenchmarkScenario` expectations

### Validation Rules

- Recommendations must include evidence and confidence
- Framework recommendations must be explainable from detected signals
- Output must support both JSON and human-readable rendering

## 4. FlowState

### Purpose

Represents the recoverable current state of a Speckit-driven work stream.

### Fields

- `featureId`: active feature identifier
- `currentStage`: clarify, specify, plan, analyze, tasks, implement, validate,
  or equivalent
- `lastArtifact`: latest generated or modified artifact
- `blockers`: current blocking issues
- `nextAction`: recommended next command or step
- `artifactLineage`: ordered upstream/downstream artifact references
- `updatedAt`: last state update time
- `status`: active, blocked, paused, complete

### Relationships

- References generated artifacts and contracts
- May be surfaced by CLI and runtime scripts

### Validation Rules

- Must always identify feature and current stage
- Artifact lineage must reference valid known artifacts
- Blocked states must include at least one blocker description

## 5. HookManifest

### Purpose

Represents a typed runtime hook with explicit support and execution behavior.

### Fields

- `id`: stable hook identifier
- `family`: quality-gate, summary, checkpoint, scan, or similar
- `targetCompatibility`: per-target support state
- `triggerStage`: lifecycle stage where the hook runs
- `executionOrder`: relative ordering within a stage
- `mode`: blocking or advisory
- `timeoutBudget`: maximum execution budget
- `retryPolicy`: retry behavior
- `failurePolicy`: how failures should be handled
- `requiredInputs`: required runtime inputs
- `expectedOutputs`: output contract
- `observabilityFields`: fields that should be recorded when enabled

### Relationships

- Is constrained by `CompatibilityEntry`
- May be enabled or emphasized by an `OperatingProfile`

### Validation Rules

- Must declare compatibility and failure semantics
- Blocking hooks must define actionable failure behavior
- Required inputs and expected outputs must be explicit

## 6. OperatingProfile

### Purpose

Represents a high-signal operating mode that changes installed behavior.

### Fields

- `id`: stable profile identifier
- `displayName`: user-facing name
- `defaultBundles`: default bundle set
- `preferredSkills`: prioritized skills
- `recommendedHooks`: preferred hook set
- `validationStrictness`: lenient, standard, strict, or equivalent
- `reviewDepth`: shallow, standard, deep, or equivalent
- `riskAppetite`: low, balanced, or aggressive
- `targetCompatibility`: supported targets

### Relationships

- References many `StructuredPack`, `OperationalSkill`, and `HookManifest`
  records
- May be recommended by `RepoIntelligenceResult`

### Validation Rules

- Must materially differ from other profiles in at least one behavior axis
- Must declare compatibility and emphasis surfaces
- Must not claim support where required runtime surfaces are absent

## 7. CompatibilityEntry

### Purpose

Represents one machine-readable support assertion between two or more platform
surfaces.

### Fields

- `subjectType`: target, bundle, hook, skill, profile, workflow, language, or
  framework
- `subjectId`: identifier of the subject
- `relationType`: supports, limits, depends-on, incompatible-with, extends
- `relatedType`: type of related object
- `relatedId`: identifier of the related object
- `supportLevel`: full, partial, emulated, unsupported
- `notes`: human-readable rationale

### Relationships

- May reference any major runtime entity

### Validation Rules

- All referenced subjects must exist
- Partial or unsupported entries must include a rationale
- Generated documentation must not contradict the matrix

## 8. MaintenanceState

### Purpose

Represents the current health and drift state of an installed harness surface.

### Fields

- `installVersion`: currently installed version or package identity
- `ownedPaths`: expected runtime-owned files
- `missingPaths`: missing expected files
- `stalePaths`: outdated or drifted files
- `recommendedRepairs`: suggested maintenance actions
- `recommendedPruneTargets`: surfaces safe to remove
- `lastAuditAt`: last maintenance inspection time

### Relationships

- References `CompatibilityEntry`, `OperatingProfile`, and package-surface data

### Validation Rules

- Missing and stale paths must map to actionable remediation
- Repairs must preserve target ownership semantics

## 9. EffectivenessSignal

### Purpose

Represents a local-first observation that helps maintainers understand platform
value and failure trends.

### Fields

- `signalType`: bundle-use, skill-use, hook-run, validation-failure,
  recommendation-acceptance, target-mix, or similar
- `subjectId`: related bundle, skill, hook, profile, or target
- `context`: optional lightweight context such as repo type or command
- `result`: success, skipped, failed, accepted, rejected
- `recordedAt`: observation time
- `details`: structured diagnostic payload

### Relationships

- May be aggregated by maintenance or reporting tools

### Validation Rules

- Signals must remain local-first and opt-in
- Signal payloads must avoid requiring external transport to be useful

## 10. BenchmarkScenario

### Purpose

Represents a realistic fixture repo used to regression-test recommendation and
skill quality.

### Fields

- `id`: stable scenario identifier
- `repoArchetype`: web app, service, CLI, monorepo, legacy, security-sensitive,
  or similar
- `expectedSignals`: repo traits that should be detected
- `expectedRecommendations`: bundles, skills, or profiles that should appear
- `validationFocus`: what the scenario is meant to prove
- `fixturePath`: repo fixture location

### Relationships

- Validates `RepoIntelligenceResult`
- May be used by `OperationalSkill` integration tests

### Validation Rules

- Each scenario must define expected signals and expected recommendations
- Scenario fixtures must stay aligned with documented validation focus
