# Remediation Plan: Top 3 Implementation Gaps

**Feature**: `007-aio-v2-runtime-refactor`  
**Date**: `2026-03-27`  
**Source**: follow-up planning for the first three findings from the
implementation consistency analysis against
`C:/Users/lazar/Downloads/aio_v2_brainstorm.md`

## Purpose

This plan narrows the broader v2 implementation plan to the first three gaps
identified during analysis:

1. the shared runtime is written as a single-target summary and can be
   overwritten during multi-target bootstrap
2. bootstrap creates only a shared-runtime shell instead of hydrating baseline
   repo-intelligence artifacts
3. task packs, adaptive question flow, compact working memory, and practical
   operator outputs are still missing

The goal is to fix these in dependency order without expanding scope into the
remaining freshness and impact-analysis work beyond what is required to support
the first three items safely.

## Scope

### In scope

- make `.hforge/runtime/` truly workspace-level and multi-target safe
- generate baseline runtime artifacts during bootstrap instead of only runtime
  directories and summaries
- implement the first practical task-pack and working-memory workflow surfaces
- expose usable operator commands and portable outputs for the new task flow
- extend tests and docs so the new behavior is auditable and release-safe

### Out of scope

- full freshness and provenance model from User Story 3
- advanced blast-radius analysis beyond the minimum needed for task-pack inputs
- path migration from `.hforge/` to `.harness-forge/`
- deeper ecosystem integrations and advanced automation

## Delivery Strategy

Implement the fixes in three workstreams, each with a strict dependency edge:

1. **WS1** stabilizes the shared runtime as a workspace-level system of record.
2. **WS2** hydrates the runtime with baseline repo-intelligence artifacts during
   bootstrap and install.
3. **WS3** adds task-pack, question, working-memory, review, and export flows
   on top of the stabilized and hydrated runtime.

This order matters because WS2 should write into a runtime model that no longer
loses per-target bridge information, and WS3 should consume baseline repo
knowledge instead of inventing a second task-only storage path.

## Workstream 1: Make the Shared Runtime Multi-Target Safe

### Problem

`bootstrapWorkspace()` can apply more than one target plan, but the generated
shared runtime currently stores one `targetId` and is rewritten once per target.
That makes the "shared" runtime summary last-write-wins instead of reflecting
the whole workspace.

### Target outcome

`.hforge/runtime/index.json` and `.hforge/runtime/README.md` describe the
workspace runtime as a whole and include every installed target bridge instead
of only the most recently applied one.

### Design changes

#### 1. Replace single-target runtime summary with workspace summary

Refactor `SharedRuntimePlan` and the generated runtime document so the root
object represents the workspace, not one target.

Introduce these logical fields:

- `runtimeId`
- `rootDir`
- `generatedAt`
- `authoritativeSurfaces`
- `cacheSurfaces`
- `targets`
- `discoveryBridges`
- `notesByTarget`

`targets` should be a collection keyed by target id, with each entry including:

- `targetId`
- `displayName`
- `supportMode`
- `instructionSurfaces`
- `runtimeSurfaces`
- `notes`

#### 2. Separate "bridge contribution" from "runtime document"

Keep per-target planning lightweight by having install planning produce a target
bridge contribution rather than a full standalone runtime document. Then merge
that contribution into the workspace runtime state during apply.

#### 3. Merge runtime state during install

`applyInstall()` should:

- load the current runtime document if it exists
- merge the current target's bridge contribution
- preserve already installed targets
- rewrite the workspace runtime once with the full merged view

#### 4. Align install-state and reconcile behavior

Install state should remain the source for which targets and bundles are
installed, while the runtime document becomes the human- and agent-readable
workspace summary. Reconcile logic should validate that runtime bridge entries
still match installed targets.

### Likely file touch points

- `src/domain/operations/install-plan.ts`
- `src/application/install/shared-runtime.ts`
- `src/application/install/plan-install.ts`
- `src/application/install/apply-install.ts`
- `src/application/install/bootstrap-workspace.ts`
- `src/application/install/reconcile-state.ts`
- `src/domain/state/install-state.ts`
- `tests/contract/aio-v2-shared-runtime.contract.test.ts`
- `tests/integration/aio-v2-runtime-flow.spec.ts`
- `tests/integration/install-target-ready.spec.ts`
- `docs/installation.md`
- `docs/generated-artifacts.md`

### Validation

- add a contract test that requires multiple targets to appear in one runtime
  document
- add an integration test that bootstraps two targets into one temp workspace
  and verifies both bridge sets survive
- add a reconcile test that reports drift when install state and runtime
  bridges diverge

### Exit criteria

- bootstrapping `codex` and `claude-code` in the same workspace produces one
  runtime index listing both targets
- no shared-runtime test assumes a single-target document shape
- the README generated for the runtime explains all installed bridge families

## Workstream 2: Hydrate Baseline Repo-Intelligence Artifacts During Bootstrap

### Problem

Bootstrap currently creates directories and a summary document, but it does not
persist the repo-intelligence artifacts the brainstorm and spec describe as core
runtime value.

### Target outcome

Every successful bootstrap writes a minimum viable baseline into
`.hforge/runtime/` so the runtime contains real repo knowledge before any task
flow starts.

### Baseline artifact set for this remediation

The first hydration pass should generate and persist:

- `repo/repo-map.json`
- `repo/recommendations.json`
- `repo/target-support.json`
- `repo/instruction-plan.json`
- `repo/scan-summary.json`
- `findings/validation-gaps.json`
- `findings/risk-signals.json`

This keeps the first increment practical by reusing the existing recommend,
scan, cartography, and instruction-synthesis surfaces before tackling deeper
module-index and dependency-graph expansion.

### Design changes

#### 1. Add a runtime baseline writer

Introduce a dedicated writer that runs during bootstrap/apply and collects:

- recommendation output from `recommendFromIntelligence()`
- repo map output from `cartograph-repo` logic
- scan output from `collectRepoFacts()`
- instruction-plan output from instruction synthesis

It should write those into the runtime's durable surfaces instead of leaving
them as transient CLI-only outputs.

#### 2. Normalize runtime artifact naming

Define a stable mapping from current intelligence producers to runtime
artifacts. For example:

- recommend result -> `repo/recommendations.json`
- repo map -> `repo/repo-map.json`
- raw scan -> `repo/scan-summary.json`
- target bridge plan -> `repo/instruction-plan.json`
- risk and validation slices -> `findings/*.json`

#### 3. Ensure bootstrap is the primary hydration path

`bootstrapWorkspace()` should plan and apply both target install surfaces and
runtime baseline generation in one pass so a fresh repo does not need multiple
manual commands to produce the claimed runtime.

#### 4. Keep the artifact set intentionally small

Do not block this remediation on the full future `.harness-forge/` folder
layout. Persist only the artifacts that existing repo-intelligence code can
produce reliably today, but write them into the canonical runtime tree so later
expansion remains additive.

### Likely file touch points

- `src/application/install/bootstrap-workspace.ts`
- `src/application/install/apply-install.ts`
- `src/application/install/generate-guidance.ts`
- `src/application/install/shared-runtime.ts`
- `src/application/recommendations/recommend-from-intelligence.ts`
- `scripts/intelligence/shared.mjs`
- `scripts/intelligence/shared/cartography.mjs`
- `scripts/intelligence/synthesize-instructions.mjs`
- `src/domain/intelligence/repo-intelligence.ts`
- `src/domain/intelligence/repo-map.ts`
- `src/domain/intelligence/instruction-plan.ts`
- `manifests/catalog/flow-artifacts.json`
- `docs/generated-artifacts.md`
- `docs/installation.md`
- `README.md`

### Validation

- add an integration test that bootstraps a temp repo and verifies baseline
  runtime files exist under `repo/` and `findings/`
- extend the contract tests so declared runtime artifacts include the new
  baseline files
- update manifest/runtime consistency validation to require these artifacts when
  the shared runtime is present

### Exit criteria

- a fresh bootstrap yields real runtime JSON artifacts, not only directories
  plus a summary README
- generated guidance points maintainers to the hydrated repo-intelligence files
- the runtime artifact catalog lists the baseline files as managed outputs

## Workstream 3: Finish the Practical Task-Pack and Working-Memory Slice

### Problem

The runtime foundation exists, but the primary user-facing value from the
brainstorm is still absent: task packs, adaptive clarification, compact working
memory, and portable review/export outputs.

### Target outcome

Operators can start a task, generate a structured task pack, persist compact
working memory, review current state, and export the result without manually
stitching prompts.

### Delivery phases

#### Phase 3A: Task-pack domain and templates

Create the first durable task-pack model and templates under the shared
runtime.

Minimum generated task contents:

- task summary
- requested outcome
- clarified requirements
- implementation notes
- impacted modules
- risks
- acceptance criteria
- test implications
- unresolved questions
- recommended next step

Primary surfaces:

- `.hforge/runtime/tasks/TASK-*/task-pack.json`
- `.hforge/runtime/tasks/TASK-*/task-pack.md`
- `.hforge/runtime/tasks/TASK-*/requirements.md`
- `.hforge/runtime/tasks/TASK-*/implementation-notes.md`

#### Phase 3B: Adaptive question flow and task preparation

Add a task-preparation command that:

- accepts a task brief
- loads baseline repo knowledge from WS2
- asks only high-value clarification questions
- records why each question matters
- generates the initial task pack

This can start with a deterministic question policy driven by task type and
missing inputs rather than a fully dynamic engine.

#### Phase 3C: Compact working memory lifecycle

Persist working memory as a separate runtime cache artifact linked to an active
task.

Minimum fields:

- current objective
- current plan
- files in focus
- confirmed facts
- open questions
- recent failed attempts
- next immediate step

Keep `.specify/state/flow-state.json` for feature-flow orchestration, but do
not reuse it as task working memory. The task cache should live under the shared
runtime so it can be consumed by multiple targets.

#### Phase 3D: Operator commands, review, and export

Expose the task flow through explicit commands:

- `hforge task prepare`
- `hforge task status`
- `hforge task compact`
- `hforge review`
- `hforge export`

The first export formats should be:

- markdown bundle
- JSON bundle

ZIP export can remain a follow-up once the internal bundle shape is stable.

### Likely file touch points

- `templates/tasks/implement-feature.md`
- `templates/tasks/fix-bug.md`
- `templates/workflows/research-plan-implement-validate.md`
- `src/application/flow/load-flow-state.ts`
- `src/application/flow/save-flow-state.ts`
- `src/application/runtime/command-catalog.ts`
- `src/cli/commands/flow.ts`
- `src/cli/commands/commands.ts`
- `src/cli/index.ts`
- new task/runtime application services under `src/application/runtime/` or
  `src/application/flow/`
- `docs/flow-orchestration.md`
- `docs/commands.md`
- `docs/generated-artifacts.md`
- `tests/contract/aio-v2-task-pack.contract.test.ts`
- `tests/integration/aio-v2-operator-modes.spec.ts`

### Validation

- replace `it.todo(...)` scaffolds for task-pack and operator-mode tests with
  executable coverage
- add contract assertions for required task-pack sections and working-memory
  shape
- add integration coverage for `prepare -> status -> compact -> export`
- update command-catalog tests or docs so the new commands are discoverable

### Exit criteria

- a user can create a task pack without manual prompt assembly
- working memory is runtime-local, compact, and linked to one task
- operators can inspect and export task context through supported commands

## Cross-Workstream Rules

- keep `.hforge/runtime/` as the canonical runtime path for this remediation;
  do not combine these fixes with a path migration
- avoid duplicating runtime knowledge into target bridge files; bridges should
  continue pointing back to the shared runtime
- prefer additive runtime artifacts over breaking changes to existing package
  surfaces where possible
- make generated artifacts reproducible from install planning, repo
  intelligence, and task preparation inputs

## Recommended Execution Order

1. complete WS1 runtime aggregation and merge behavior
2. land WS1 tests before starting WS2 writers
3. complete WS2 runtime hydration and artifact registration
4. validate bootstrap end to end against the hydrated runtime
5. implement WS3 task-pack and working-memory domain
6. add WS3 commands, review, and export surfaces
7. run release-aligned validation across contracts, integration tests, docs,
   and manifest/runtime consistency checks

## Validation Checklist

- `npm run build`
- `node scripts/ci/generate-compatibility-matrix.mjs --json`
- `node scripts/ci/validate-manifest-runtime-consistency.mjs`
- `node scripts/ci/validate-doc-command-alignment.mjs`
- `npx vitest run tests/contract/aio-v2-shared-runtime.contract.test.ts`
- `npx vitest run tests/integration/aio-v2-runtime-flow.spec.ts`
- `npx vitest run tests/contract/aio-v2-task-pack.contract.test.ts`
- `npx vitest run tests/integration/aio-v2-operator-modes.spec.ts`
- `npm run validate:release`

## Expected Outcome

After these three workstreams:

- the shared runtime is truly shared across installed targets
- bootstrap produces real repo-intelligence runtime content
- task preparation becomes a first-class operator workflow rather than an
  implied future phase

That closes the first three analysis findings while leaving the deeper
freshness/provenance and impact-analysis expansion as the next planned slice
rather than an unresolved prerequisite.
