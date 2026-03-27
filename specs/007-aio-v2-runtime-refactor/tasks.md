---

description: "Task list for Harness Forge AIO v2 Runtime Refactor"

---

# Tasks: Harness Forge AIO v2 Runtime Refactor

**Input**: Design documents from `/specs/007-aio-v2-runtime-refactor/`  
**Prerequisites**: `plan.md` (required), `spec.md` (required), `research.md`, `data-model.md`, `contracts/`

**Tests**: Tests are REQUIRED for this feature because the visibility boundary,
hidden canonical runtime, bridge routing, task-pack storage, working-memory
lifecycle, refresh behavior, and export flows all affect shipped behavior.

**Organization**: Tasks are grouped by user story to enable independent
implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this belongs to (for example `[US1]`)
- Include exact file paths in descriptions

## Path Conventions

- **Hidden AI layer and install/runtime layout**: `src/application/install/`,
  `src/domain/operations/`, `src/domain/state/`, `src/shared/`, `targets/`
- **Hidden knowledge and repo intelligence**: `src/domain/intelligence/`,
  `src/application/recommendations/`, `scripts/intelligence/`,
  `manifests/catalog/`
- **Task packs, working memory, and exports**: `src/application/runtime/`,
  `src/application/flow/`, `src/application/maintenance/`,
  `src/cli/commands/flow.ts`, `templates/tasks/`, `templates/workflows/`
- **Docs, validation, and lifecycle guidance**: `README.md`, `AGENTS.md`,
  `docs/`, `scripts/ci/`, `tests/contract/`, `tests/integration/`

## Phase 1: Setup (Containment Scaffolding)

**Purpose**: Prepare focused fixtures and test scaffolds for the hidden
AI-layer model before implementation begins.

- [X] T001 Create hidden-layer install fixtures in `tests/fixtures/runtime/contained-install/package.json` and `tests/fixtures/runtime/local-first-gitignore/.gitignore`
- [X] T002 [P] Create hidden AI-layer and bridge test scaffolds in `tests/contract/aio-v2-hidden-ai-layer.contract.test.ts` and `tests/integration/aio-v2-install-layout.spec.ts`
- [X] T003 [P] Extend hidden task, memory, and export test scaffolds in `tests/contract/aio-v2-task-pack.contract.test.ts`, `tests/integration/aio-v2-operator-modes.spec.ts`, and `tests/integration/maintenance-lifecycle.spec.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Define hidden-layer artifact families, path semantics, schemas,
and target metadata that every user story depends on.

**⚠️ CRITICAL**: No user story work should begin until this phase is complete

- [X] T004 Register hidden AI-layer artifact families in `manifests/catalog/flow-artifacts.json`, `manifests/catalog/package-surface.json`, and `docs/generated-artifacts.md`
- [X] T005 [P] Define hidden AI-layer constants and install-plan storage fields in `src/shared/constants.ts`, `src/domain/operations/install-plan.ts`, and `src/domain/state/install-state.ts`
- [X] T006 [P] Extend intelligence schemas for hidden authoritative surfaces in `src/domain/intelligence/repo-intelligence.ts`, `src/domain/intelligence/repo-map.ts`, and `src/domain/intelligence/instruction-plan.ts`
- [X] T007 [P] Align target support and bridge metadata baselines in `src/domain/targets/adapter.ts`, `manifests/catalog/harness-capability-matrix.json`, and `manifests/catalog/compatibility-matrix.json`

**Checkpoint**: Hidden-layer artifact registration, storage semantics, and
target metadata are ready; story work can proceed in dependency order.

---

## Phase 3: User Story 1 - Hide the AI Layer Behind Thin Root Bridges (Priority: P1) 🎯 MVP

**Goal**: Move canonical AI-only content under `.hforge/` and leave only thin,
runtime-appropriate bridges visible at the repo root.

**Independent Test**: Install Harness Forge into a representative application
repo, inspect the root directory, and confirm that canonical AI content lives
under `.hforge/` while root-visible files are limited to discovery bridges and
target-native entrypoints.

### Tests for User Story 1

- [X] T008 [P] [US1] Add containment and bridge contract coverage in `tests/contract/aio-v2-hidden-ai-layer.contract.test.ts` and `tests/contract/runtime-governance.contract.test.ts`
- [X] T009 [P] [US1] Add install-layout and bridge-routing integration coverage in `tests/integration/aio-v2-install-layout.spec.ts` and `tests/integration/aio-v2-runtime-flow.spec.ts`

### Implementation for User Story 1

- [X] T010 [US1] Refactor install path planning to write canonical skills, rules, and knowledge under hidden destinations in `src/application/install/plan-install.ts`, `src/application/install/apply-install.ts`, and `src/shared/constants.ts`
- [X] T011 [US1] Rewrite target adapter path mappings for hidden canonical content and thin visible bridges in `targets/codex/adapter.json`, `targets/claude-code/adapter.json`, `targets/cursor/adapter.json`, and `targets/opencode/adapter.json`
- [X] T012 [P] [US1] Update root bridge templates to reference `.hforge/` authoritative surfaces in `templates/instructions/root-agents-template.md`, `templates/instructions/scoped-agents-template.md`, and `templates/instructions/cursor-rule-template.mdc`
- [X] T013 [P] [US1] Repoint wrapper discovery guidance toward hidden canonical content in `.agents/skills/`, `docs/agents.md`, and `docs/authoring/enhanced-skill-import.md`
- [X] T014 [US1] Document root cleanliness and hidden-layer authority in `README.md`, `AGENTS.md`, `docs/installation.md`, and `docs/install/targets.md`
- [X] T015 [US1] Align bundle and catalog mappings with hidden canonical destinations in `manifests/bundles/languages-seeded.json`, `manifests/bundles/languages-v1.json`, and `manifests/catalog/language-assets.json`

**Checkpoint**: User Story 1 should yield a clean application-repo root plus
thin discovery bridges into the hidden canonical AI layer.

---

## Phase 4: User Story 2 - Keep One Hidden AI Layer as the Authoritative Cross-Agent Runtime (Priority: P1)

**Goal**: Make `.hforge/` the one cross-target system of record and ensure
every supported runtime routes into it honestly.

**Independent Test**: Inspect the hidden AI layer and supported root or
target-native bridges, then confirm they all reference one canonical runtime
instead of separate per-target knowledge copies.

### Tests for User Story 2

- [ ] T016 [P] [US2] Add hidden-runtime authority and visibility-policy contract coverage in `tests/contract/aio-v2-hidden-ai-layer.contract.test.ts`, `tests/contract/package-lifecycle.contract.test.ts`, and `tests/contract/visibility-policy.contract.test.ts`
- [ ] T017 [P] [US2] Add multi-target hidden-layer integration coverage in `tests/integration/install-target-ready.spec.ts`, `tests/integration/aio-v2-runtime-flow.spec.ts`, and `tests/integration/agent-command-catalog.spec.ts`

### Implementation for User Story 2

- [ ] T018 [US2] Model `AILayerRoot` and `VisibilityPolicy` in runtime planning and install state in `src/domain/operations/install-plan.ts`, `src/domain/state/install-state.ts`, and `src/application/install/shared-runtime.ts`
- [ ] T019 [US2] Merge multi-target bridge contributions into one hidden authoritative runtime in `src/application/install/bootstrap-workspace.ts`, `src/application/install/shared-runtime.ts`, and `src/application/install/reconcile-state.ts`
- [ ] T020 [P] [US2] Materialize typed hidden surfaces for library, runtime, tasks, cache, exports, state, and generated outputs in `src/application/install/shared-runtime.ts`, `src/application/install/apply-install.ts`, and `src/application/install/generate-guidance.ts`
- [ ] T021 [P] [US2] Add hidden-authority and duplicate-visible-surface validation in `scripts/ci/validate-manifest-runtime-consistency.mjs`, `scripts/ci/validate-packed-install-surface.mjs`, and `tests/contract/runtime-governance.contract.test.ts`
- [ ] T022 [US2] Update authoritative hidden-layer guidance in `docs/generated-artifacts.md`, `docs/maintenance-lifecycle.md`, and `docs/versioning-and-migration.md`

**Checkpoint**: User Story 2 should establish `.hforge/` as the one
authoritative AI runtime and make cross-target bridge behavior auditable.

---

## Phase 5: User Story 3 - Generate Task Packs, Rules, and Working Memory Inside the Hidden Layer (Priority: P1)

**Goal**: Make hidden task packs and compact hidden working memory the primary
context surfaces for active engineering work.

**Independent Test**: Start representative feature, bugfix, and refactor
tasks, then confirm the hidden AI layer produces a task-specific context packet
plus compact working memory without requiring manual prompt assembly or exposed
root-level knowledge folders.

### Tests for User Story 3

- [ ] T023 [P] [US3] Add hidden task-pack and working-memory contract coverage in `tests/contract/aio-v2-task-pack.contract.test.ts`, `tests/contract/template-catalog.contract.test.ts`, and `tests/contract/visibility-policy.contract.test.ts`
- [ ] T024 [P] [US3] Add hidden task lifecycle integration coverage in `tests/integration/aio-v2-operator-modes.spec.ts` and `tests/integration/speckit-flow-state.spec.ts`

### Implementation for User Story 3

- [ ] T025 [US3] Create hidden task-pack and working-memory services in `src/application/runtime/task-pack-service.ts`, `src/application/runtime/working-memory-service.ts`, and `src/shared/constants.ts`
- [ ] T026 [P] [US3] Move canonical task and workflow templates into hidden-layer destinations in `templates/tasks/implement-feature.md`, `templates/tasks/fix-bug.md`, and `templates/workflows/research-plan-implement-validate.md`
- [ ] T027 [US3] Persist task packs under `.hforge/tasks` and compact memory under `.hforge/cache` in `src/application/flow/load-flow-state.ts`, `src/application/flow/save-flow-state.ts`, and `src/cli/commands/flow.ts`
- [ ] T028 [P] [US3] Resolve hidden-layer rules, skills, and knowledge during task preparation in `src/application/runtime/command-catalog.ts`, `src/application/recommendations/recommend-from-intelligence.ts`, and `docs/flow-orchestration.md`
- [ ] T029 [US3] Promote durable task learnings from cache into hidden runtime artifacts in `src/application/runtime/working-memory-service.ts`, `src/application/install/generate-guidance.ts`, and `docs/templates/authoring.md`

**Checkpoint**: User Story 3 should provide hidden task packs and compact
hidden working memory that agents can use without polluting the product repo
surface.

---

## Phase 6: User Story 4 - Keep the Hidden AI Layer Local-First, Refreshable, and Shareable Without Polluting the Product Repo (Priority: P2)

**Goal**: Make the hidden AI layer refreshable and exportable while keeping the
default lifecycle local-first and low-noise for product repos.

**Independent Test**: Install, refresh, and export from a representative repo,
then confirm the hidden layer stays authoritative and refreshable while humans
can collaborate through bridges or exports without committing the entire AI
content library by default.

### Tests for User Story 4

- [ ] T030 [P] [US4] Add local-first lifecycle and export contract coverage in `tests/contract/package-lifecycle.contract.test.ts`, `tests/contract/cli-install.contract.test.ts`, and `tests/contract/visibility-policy.contract.test.ts`
- [ ] T031 [P] [US4] Add refresh and export integration coverage in `tests/integration/maintenance-lifecycle.spec.ts` and `tests/integration/aio-v2-operator-modes.spec.ts`

### Implementation for User Story 4

- [ ] T032 [US4] Implement local-first visibility policy and gitignore guidance in `src/application/install/bootstrap-workspace.ts`, `src/application/install/apply-install.ts`, and `.gitignore`
- [ ] T033 [P] [US4] Implement export-bundle and selective-sharing services in `src/application/runtime/export-bundle-service.ts`, `src/application/runtime/review-pack-service.ts`, and `src/cli/commands/flow.ts`
- [ ] T034 [P] [US4] Wire refresh and maintenance flows to hidden-layer freshness behavior in `src/application/maintenance/sync-install.ts`, `src/application/maintenance/audit-install.ts`, and `src/application/maintenance/diff-install.ts`
- [ ] T035 [US4] Publish local-first sharing and export guidance in `README.md`, `docs/commands.md`, `docs/installation.md`, and `docs/maintenance-lifecycle.md`
- [ ] T036 [US4] Align support and troubleshooting docs with hidden-layer sharing boundaries in `docs/target-support-matrix.md`, `docs/troubleshooting.md`, and `docs/observability.md`

**Checkpoint**: User Story 4 should make the hidden AI layer practical to use
privately by default while still supporting refresh, collaboration, and handoff.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements that affect multiple user stories.

- [ ] T037 [P] Normalize hidden-layer release validation in `scripts/ci/validate-doc-command-alignment.mjs`, `scripts/ci/validate-manifest-runtime-consistency.mjs`, and `scripts/ci/validate-packed-install-surface.mjs`
- [ ] T038 [P] Refresh maintainer-facing hidden-layer docs in `docs/generated-artifacts.md`, `docs/versioning-and-migration.md`, and `docs/repo-cartography.md`
- [ ] T039 Run end-to-end hidden AI-layer validation via `package.json`, `tests/contract/aio-v2-hidden-ai-layer.contract.test.ts`, and `tests/integration/aio-v2-operator-modes.spec.ts`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies; can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion; blocks all user
  stories
- **User Story 1 (Phase 3)**: Depends on Foundational and establishes the
  hidden containment model plus thin bridge layout
- **User Story 2 (Phase 4)**: Depends on User Story 1 because hidden runtime
  authority depends on the new containment and bridge model
- **User Story 3 (Phase 5)**: Depends on User Stories 1-2 because task packs
  and working memory must live inside the authoritative hidden layer
- **User Story 4 (Phase 6)**: Depends on User Stories 1-3 because local-first
  sharing, refresh, and export behavior build on the hidden runtime and task
  model
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: First delivery slice for hidden-layer containment and
  thin root bridges
- **User Story 2 (P1)**: Second delivery slice for one authoritative hidden
  runtime across targets
- **User Story 3 (P1)**: Third delivery slice for hidden task packs and compact
  hidden working memory
- **User Story 4 (P2)**: Final delivery slice for local-first lifecycle,
  refresh, and export behavior

### Within Each User Story

- Tests should be written and fail before implementation
- Hidden-layer path and authority baselines should land before docs and bridge
  guidance depend on them
- Runtime authority should stabilize before task packs, refresh behavior, and
  exports build on top of it
- Export and sharing guidance should update after the corresponding lifecycle
  behavior exists

### Parallel Opportunities

- Setup tasks `T002-T003` can run in parallel
- Foundational tasks `T005-T007` can run in parallel after `T004`
- User Story 1 test tasks `T008-T009` can run in parallel
- User Story 1 tasks `T012-T013` can run in parallel after `T011`
- User Story 2 test tasks `T016-T017` can run in parallel
- User Story 2 tasks `T020-T021` can run in parallel after `T019`
- User Story 3 test tasks `T023-T024` can run in parallel
- User Story 3 tasks `T026-T028` can run in parallel after `T025`
- User Story 4 test tasks `T030-T031` can run in parallel
- User Story 4 tasks `T033-T034` can run in parallel after `T032`
- Polish tasks `T037-T038` can run in parallel

---

## Parallel Example: User Story 1

```bash
# After hidden canonical path mapping is stable, these can run in parallel:
Task: "Update root bridge templates to reference .hforge authoritative surfaces in templates/instructions/root-agents-template.md, templates/instructions/scoped-agents-template.md, and templates/instructions/cursor-rule-template.mdc"
Task: "Repoint wrapper discovery guidance toward hidden canonical content in .agents/skills/, docs/agents.md, and docs/authoring/enhanced-skill-import.md"
```

## Parallel Example: User Story 2

```bash
# After the hidden authoritative runtime model exists, these can run in parallel:
Task: "Materialize typed hidden surfaces for library, runtime, tasks, cache, exports, state, and generated outputs in src/application/install/shared-runtime.ts, src/application/install/apply-install.ts, and src/application/install/generate-guidance.ts"
Task: "Add hidden-authority and duplicate-visible-surface validation in scripts/ci/validate-manifest-runtime-consistency.mjs, scripts/ci/validate-packed-install-surface.mjs, and tests/contract/runtime-governance.contract.test.ts"
```

## Parallel Example: User Story 3

```bash
# After hidden task and memory services exist, these can run in parallel:
Task: "Move canonical task and workflow templates into hidden-layer destinations in templates/tasks/implement-feature.md, templates/tasks/fix-bug.md, and templates/workflows/research-plan-implement-validate.md"
Task: "Resolve hidden-layer rules, skills, and knowledge during task preparation in src/application/runtime/command-catalog.ts, src/application/recommendations/recommend-from-intelligence.ts, and docs/flow-orchestration.md"
```

## Parallel Example: User Story 4

```bash
# After the local-first visibility policy is wired, these can run in parallel:
Task: "Implement export-bundle and selective-sharing services in src/application/runtime/export-bundle-service.ts, src/application/runtime/review-pack-service.ts, and src/cli/commands/flow.ts"
Task: "Wire refresh and maintenance flows to hidden-layer freshness behavior in src/application/maintenance/sync-install.ts, src/application/maintenance/audit-install.ts, and src/application/maintenance/diff-install.ts"
```

## Implementation Strategy

### MVP First

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Confirm the repo root stays clean and thin bridges
   route into the hidden canonical AI layer

### Incremental Delivery

1. Complete Setup + Foundational -> hidden-layer artifact, path, and target
   baselines are ready
2. Add User Story 1 -> validate hidden containment and thin root bridges
3. Add User Story 2 -> validate one authoritative hidden runtime across targets
4. Add User Story 3 -> validate hidden task packs and working-memory behavior
5. Add User Story 4 -> validate local-first lifecycle, refresh, and export
   flows

### Parallel Team Strategy

With multiple contributors:

1. One contributor completes Setup + Foundational
2. After Phase 2:
   - Contributor A: User Story 1 hidden containment and bridge rewiring
   - Contributor B: User Story 2 authoritative hidden runtime and visibility policy
3. After User Stories 1-2 stabilize:
   - Contributor C: User Story 3 task packs and compact hidden memory
4. After User Story 3 stabilizes:
   - Contributor D: User Story 4 local-first lifecycle, refresh, and export flows
5. Final pass: Phase 7 polish and end-to-end validation

---

## Notes

- `[P]` tasks use different write surfaces and can proceed without waiting on
  the same files.
- `[US1]` through `[US4]` map directly to the updated hidden-layer feature
  specification.
- This task list supersedes the earlier root-exposed content model and is
  aligned to the regenerated hidden `.hforge/` plan, research, data-model, and
  contracts.
- The recommended MVP scope for this feature is **User Story 1**, because
  hidden containment and thin bridge routing are the minimum safe foundation
  for every later runtime, task-pack, refresh, and export behavior.
