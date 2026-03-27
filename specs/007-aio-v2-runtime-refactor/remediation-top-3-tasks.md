---

description: "Focused task list for the top 3 implementation gaps in Harness Forge AIO v2 Runtime Refactor"

---

# Tasks: Harness Forge AIO v2 Runtime Refactor Remediation Top 3

**Input**: Design documents from `/specs/007-aio-v2-runtime-refactor/`,
especially `remediation-top-3-plan.md` plus the existing feature spec and plan  
**Prerequisites**: `plan.md` (required), `spec.md` (required),
`remediation-top-3-plan.md` (required), `research.md`, `data-model.md`,
`contracts/`

**Tests**: Tests are REQUIRED for this remediation because the work changes the
workspace runtime document shape, bootstrap/install behavior, task-pack
generation, working-memory lifecycle, and operator-facing commands.

**Organization**: Tasks are grouped by the original feature user stories while
focusing only on the first three implementation gaps from the consistency
analysis.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this belongs to (for example `[US1]`)
- Include exact file paths in descriptions

## Path Conventions

- **Shared runtime core**: `src/application/install/`, `src/domain/operations/`,
  `src/domain/state/`, `src/shared/`
- **Repo intelligence hydration**: `src/application/recommendations/`,
  `src/domain/intelligence/`, `scripts/intelligence/`, `manifests/catalog/`
- **Task-pack and working memory**: `src/application/runtime/`,
  `src/application/flow/`, `src/cli/commands/`, `templates/tasks/`,
  `templates/workflows/`
- **Validation and docs**: `tests/contract/`, `tests/integration/`,
  `scripts/ci/`, `docs/`, `README.md`

## Phase 1: Setup (Remediation Test Inputs)

**Purpose**: Prepare focused fixtures and test surfaces for the remediation
slice before changing runtime behavior.

- [X] T001 Create remediation fixture inputs for multi-target bootstrap and task preparation in `tests/fixtures/runtime/multi-target-install/package.json` and `tests/fixtures/runtime/task-briefs.json`
- [X] T002 [P] Extend remediation test scaffolds in `tests/contract/aio-v2-shared-runtime.contract.test.ts`, `tests/contract/aio-v2-task-pack.contract.test.ts`, and `tests/integration/aio-v2-operator-modes.spec.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Define the runtime document and artifact categories that all three
fixes depend on.

**⚠️ CRITICAL**: No user story remediation should begin until this phase is complete

- [X] T003 Register remediation runtime artifact families in `manifests/catalog/flow-artifacts.json`, `manifests/catalog/package-surface.json`, and `docs/generated-artifacts.md`
- [X] T004 [P] Introduce workspace-level shared-runtime domain types in `src/domain/operations/install-plan.ts`, `src/domain/intelligence/repo-intelligence.ts`, and `src/domain/intelligence/instruction-plan.ts`
- [X] T005 [P] Add shared-runtime serialization and baseline artifact path constants in `src/application/install/shared-runtime.ts`, `src/application/install/apply-install.ts`, and `src/shared/constants.ts`

**Checkpoint**: The runtime document shape and managed artifact set are defined;
user story remediation can proceed in dependency order.

---

## Phase 3: User Story 1 - Make the Shared Runtime Truly Shared and Hydrate Baseline Repo Intelligence (Priority: P1) 🎯 MVP

**Goal**: Fix the multi-target overwrite risk and make bootstrap write real
repo-intelligence artifacts into the shared runtime.

**Independent Test**: Bootstrap a workspace for multiple targets and confirm
one runtime document records all installed bridges while baseline repo and
findings artifacts are written under `.hforge/runtime/`.

### Tests for User Story 1

- [X] T006 [P] [US1] Add multi-target shared-runtime contract coverage in `tests/contract/aio-v2-shared-runtime.contract.test.ts` and `tests/contract/runtime-governance.contract.test.ts`
- [X] T007 [P] [US1] Add multi-target bootstrap and reconcile integration coverage in `tests/integration/aio-v2-runtime-flow.spec.ts` and `tests/integration/install-target-ready.spec.ts`

### Implementation for User Story 1

- [X] T008 [US1] Refactor runtime planning to emit workspace summaries plus per-target bridge contributions in `src/domain/operations/install-plan.ts`, `src/application/install/shared-runtime.ts`, and `src/application/install/plan-install.ts`
- [X] T009 [US1] Merge shared-runtime contributions during apply and reconcile them against installed targets in `src/application/install/apply-install.ts`, `src/application/install/reconcile-state.ts`, and `src/domain/state/install-state.ts`
- [X] T010 [P] [US1] Hydrate baseline repo-intelligence artifacts during bootstrap and install in `src/application/install/bootstrap-workspace.ts`, `src/application/install/shared-runtime.ts`, and `src/application/recommendations/recommend-from-intelligence.ts`
- [X] T011 [P] [US1] Persist repo map, scan, instruction-plan, and findings runtime artifacts in `scripts/intelligence/shared.mjs`, `scripts/intelligence/shared/cartography.mjs`, and `scripts/intelligence/synthesize-instructions.mjs`
- [X] T012 [US1] Update runtime discovery and artifact guidance in `README.md`, `docs/installation.md`, `docs/install/targets.md`, and `docs/generated-artifacts.md`

**Checkpoint**: User Story 1 remediation should yield one workspace-level
runtime index that survives multi-target installs and includes baseline repo
knowledge instead of only a summary shell.

---

## Phase 4: User Story 2 - Deliver Task Packs and Compact Working Memory (Priority: P1)

**Goal**: Turn the hydrated runtime into a practical task-preparation system
with structured task packs and compact working memory.

**Independent Test**: Start a task from a brief, answer clarification prompts,
then confirm the runtime stores a structured task pack plus compact
working-memory state without relying on manual prompt assembly.

### Tests for User Story 2

- [ ] T013 [P] [US2] Replace task-pack contract TODOs with executable assertions in `tests/contract/aio-v2-task-pack.contract.test.ts` and `tests/contract/template-catalog.contract.test.ts`
- [ ] T014 [P] [US2] Add task prepare, task status, and compact-memory integration coverage in `tests/integration/aio-v2-operator-modes.spec.ts` and `tests/integration/speckit-flow-state.spec.ts`

### Implementation for User Story 2

- [ ] T015 [US2] Create task-pack and working-memory runtime services in `src/application/runtime/task-pack-service.ts`, `src/application/runtime/working-memory-service.ts`, and `src/shared/constants.ts`
- [ ] T016 [P] [US2] Define task-pack and working-memory templates in `templates/tasks/implement-feature.md`, `templates/tasks/fix-bug.md`, and `templates/workflows/research-plan-implement-validate.md`
- [ ] T017 [US2] Implement task preparation, clarification capture, and memory persistence in `src/application/flow/load-flow-state.ts`, `src/application/flow/save-flow-state.ts`, `src/application/runtime/task-pack-service.ts`, and `src/application/runtime/working-memory-service.ts`
- [ ] T018 [P] [US2] Expose task prepare, task status, and task compact command surfaces in `src/cli/commands/flow.ts`, `src/application/runtime/command-catalog.ts`, and `docs/commands.md`
- [ ] T019 [US2] Align task-output reporting and generated runtime artifact tracking in `src/application/install/generate-guidance.ts`, `src/application/install/apply-install.ts`, and `docs/generated-artifacts.md`
- [ ] T020 [US2] Document task-pack and working-memory operator behavior in `docs/flow-orchestration.md`, `docs/maintenance-lifecycle.md`, and `docs/templates/authoring.md`

**Checkpoint**: User Story 2 remediation should let operators generate a task
pack, inspect current task state, and compact working memory without using free-form scratch notes.

---

## Phase 5: User Story 4 - Add Review and Export Operator Flows (Priority: P2)

**Goal**: Complete the practical operator slice with review and export commands
that package the new task outputs for humans and agents.

**Independent Test**: Generate a task pack, then run review/export flows and
confirm the resulting bundle is inspectable, portable, and derived from the
runtime rather than manual reconstruction.

### Tests for User Story 4

- [ ] T021 [P] [US4] Add review and export operator coverage in `tests/integration/aio-v2-operator-modes.spec.ts` and `tests/contract/cli-install.contract.test.ts`

### Implementation for User Story 4

- [ ] T022 [US4] Create review-pack and export-bundle runtime services in `src/application/runtime/review-pack-service.ts`, `src/application/runtime/export-bundle-service.ts`, and `src/shared/constants.ts`
- [ ] T023 [P] [US4] Register review and export CLI commands in `src/cli/index.ts`, `src/cli/commands/flow.ts`, and `src/cli/commands/commands.ts`
- [ ] T024 [P] [US4] Publish review and export command guidance in `src/application/runtime/command-catalog.ts`, `docs/commands.md`, and `docs/generated-artifacts.md`
- [ ] T025 [US4] Align front-door operator guidance with the practical task flow in `README.md`, `docs/installation.md`, and `docs/install/targets.md`

**Checkpoint**: User Story 4 remediation should make the new task runtime
usable for review and handoff, not only for internal state generation.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and cross-surface consistency for the remediation
slice.

- [ ] T026 [P] Normalize remediation release validation in `scripts/ci/validate-manifest-runtime-consistency.mjs`, `scripts/ci/validate-doc-command-alignment.mjs`, and `scripts/ci/validate-packed-install-surface.mjs`
- [ ] T027 [P] Refresh maintainer-facing remediation guidance in `docs/generated-artifacts.md`, `docs/maintenance-lifecycle.md`, and `docs/repo-cartography.md`
- [ ] T028 Run end-to-end remediation validation via `package.json`, `tests/contract/aio-v2-shared-runtime.contract.test.ts`, `tests/contract/aio-v2-task-pack.contract.test.ts`, and `tests/integration/aio-v2-operator-modes.spec.ts`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies; can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion; blocks all story remediation
- **User Story 1 (Phase 3)**: Depends on Foundational and establishes the
  multi-target runtime plus baseline runtime hydration
- **User Story 2 (Phase 4)**: Depends on User Story 1 because task packs and
  working memory must consume the stabilized and hydrated runtime
- **User Story 4 (Phase 5)**: Depends on User Story 2 because review and export
  should package task-pack outputs rather than invent parallel operator state
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Fixes the critical runtime overwrite issue and makes
  bootstrap produce real runtime content
- **User Story 2 (P1)**: Adds the practical task-pack and working-memory value
  that the brainstorm treats as the primary product output
- **User Story 4 (P2)**: Completes the operator slice with review and export
  flows on top of the new task runtime

### Within Each User Story

- Tests should be written and fail before implementation
- Runtime data-model changes should land before install/apply logic consumes them
- Hydrated runtime artifacts should exist before task-pack generation depends on them
- Review/export flows should build on task-pack surfaces rather than duplicate them
- Docs and validation should update after the corresponding runtime behavior exists

### Parallel Opportunities

- Setup task `T002` can run in parallel once remediation fixtures exist
- Foundational tasks `T004-T005` can run in parallel after `T003`
- User Story 1 test tasks `T006-T007` can run in parallel
- User Story 1 tasks `T010-T011` can run in parallel after `T009`
- User Story 2 test tasks `T013-T014` can run in parallel
- User Story 2 tasks `T016` and `T018` can run in parallel after `T015`
- User Story 4 tasks `T023-T024` can run in parallel after `T022`
- Polish tasks `T026-T027` can run in parallel

---

## Parallel Example: User Story 1

```bash
# After the workspace-level runtime document shape is in place, these can run in parallel:
Task: "Merge shared-runtime contributions during apply and reconcile them against installed targets in src/application/install/apply-install.ts, src/application/install/reconcile-state.ts, and src/domain/state/install-state.ts"
Task: "Hydrate baseline repo-intelligence artifacts during bootstrap and install in src/application/install/bootstrap-workspace.ts, src/application/install/shared-runtime.ts, and src/application/recommendations/recommend-from-intelligence.ts"
```

## Parallel Example: User Story 2

```bash
# After runtime task-pack services exist, these can run in parallel:
Task: "Define task-pack and working-memory templates in templates/tasks/implement-feature.md, templates/tasks/fix-bug.md, and templates/workflows/research-plan-implement-validate.md"
Task: "Expose task prepare, task status, and task compact command surfaces in src/cli/commands/flow.ts, src/application/runtime/command-catalog.ts, and docs/commands.md"
```

## Parallel Example: User Story 4

```bash
# After review/export runtime services exist, these can run in parallel:
Task: "Register review and export CLI commands in src/cli/index.ts, src/cli/commands/flow.ts, and src/cli/commands/commands.ts"
Task: "Publish review and export command guidance in src/application/runtime/command-catalog.ts, docs/commands.md, and docs/generated-artifacts.md"
```

## Implementation Strategy

### MVP First

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Confirm the runtime is multi-target safe and bootstrap writes real runtime artifacts

### Incremental Delivery

1. Complete Setup + Foundational -> remediation contract, runtime document, and artifact registration are ready
2. Add User Story 1 -> validate shared-runtime aggregation and baseline hydration
3. Add User Story 2 -> validate task-pack generation and compact working memory
4. Add User Story 4 -> validate review/export operator flows
5. Finish with cross-cutting validation and documentation alignment

### Parallel Team Strategy

With multiple contributors:

1. One contributor completes Setup + Foundational
2. After Phase 2:
   - Contributor A: User Story 1 runtime aggregation and bootstrap hydration
   - Contributor B: User Story 2 task-pack templates and runtime services
3. After User Story 2 stabilizes:
   - Contributor C: User Story 4 review/export flows and command surfaces
4. Final pass: Polish and release-aligned validation

---

## Notes

- This file is a focused remediation backlog for the top three analysis
  findings and intentionally does not replace the broader `tasks.md`
- `[US1]`, `[US2]`, and `[US4]` map to the original feature specification user stories
- The suggested remediation MVP is **User Story 1**, because the workspace-level
  runtime and bootstrap hydration are prerequisites for the later practical task flow
