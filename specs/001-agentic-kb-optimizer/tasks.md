---

description: "Task list for Harness Forge Agentic AI Platform"
---

# Tasks: Harness Forge Agentic AI Platform

**Input**: Design documents from `/specs/001-agentic-kb-optimizer/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are REQUIRED for this feature because installation, migration,
template validation, and target compatibility all change observable behavior and
must be verified before release.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/`, and top-level catalog directories at repository root
- **CLI assets**: target adapters in `targets/`, manifests in `manifests/`, validators in `scripts/`
- **Content assets**: `agents/`, `commands/`, `contexts/`, `rules/`, `skills/`, `templates/`, `docs/`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize the TypeScript CLI, verification tooling, and baseline repository structure.

- [X] T001 Create the runtime and asset directory skeleton in `src/cli/index.ts`
- [X] T002 Initialize package metadata, CLI bin, and workspace scripts in `package.json`
- [X] T003 [P] Configure the TypeScript compiler, module resolution, and path aliases in `tsconfig.json`
- [X] T004 [P] Configure linting and formatting in `eslint.config.js`
- [X] T005 [P] Configure Vitest and coverage thresholds in `vitest.config.ts`
- [X] T006 [P] Configure cross-platform smoke test runners in `scripts/ci/smoke-runner.mjs`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish the shared catalog, planning, state, filesystem, and diagnostics primitives that all user stories depend on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T007 Define the shared catalog and target schema bundle in `schemas/manifests/catalog.schema.json`
- [X] T008 [P] Implement manifest types and catalog loaders in `src/domain/manifests/index.ts`
- [X] T009 [P] Implement the target adapter contract and registry in `src/domain/targets/adapter.ts`
- [X] T010 Implement install selection, plan, and operation models in `src/domain/operations/install-plan.ts`
- [X] T011 Implement the install state and backup snapshot store in `src/domain/state/install-state.ts`
- [X] T012 [P] Implement the filesystem apply engine and merge strategies in `src/infrastructure/filesystem/apply-operation.ts`
- [X] T013 [P] Implement diagnostics reporting and plan summaries in `src/infrastructure/diagnostics/reporter.ts`
- [X] T014 Implement shared environment and path validation in `src/application/install/validate-environment.ts`
- [X] T015 Seed the baseline catalog index and target registry stubs in `manifests/catalog/index.json`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Install a Target-Ready Workspace (Priority: P1) 🎯 MVP

**Goal**: Deliver safe Codex and Claude Code installation with previewable plans, apply flow, diagnostics, and usage guidance.

**Independent Test**: On a clean workspace, a user can preview and apply a Codex or Claude Code install, receive target-specific guidance, and confirm status without manual file edits.

### Tests for User Story 1 (REQUIRED unless explicitly exempted) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T016 [P] [US1] Add CLI contract tests for `init`, `install`, `status`, and `doctor` in `tests/contract/cli-install.contract.test.ts`
- [X] T017 [P] [US1] Add integration smoke tests for Codex and Claude Code baseline installs in `tests/integration/install-target-ready.spec.ts`

### Implementation for User Story 1

- [X] T018 [P] [US1] Define Codex target adapter assets in `targets/codex/adapter.json`
- [X] T019 [P] [US1] Define Claude Code target adapter assets in `targets/claude-code/adapter.json`
- [X] T020 [P] [US1] Implement `init` and `install` command handlers in `src/cli/commands/install.ts`
- [X] T021 [US1] Implement the install planner service and dry-run output in `src/application/install/plan-install.ts`
- [X] T022 [US1] Implement the apply-and-verify workflow in `src/application/install/apply-install.ts`
- [X] T023 [US1] Implement post-install guidance generation in `src/application/install/generate-guidance.ts`
- [X] T024 [US1] Implement workspace `status` and `doctor` commands in `src/cli/commands/status.ts`
- [X] T025 [US1] Implement baseline profiles and target-ready bundle manifests in `manifests/profiles/core.json`
- [X] T026 [US1] Implement the POSIX bootstrap wrapper and self-test in `install.sh`
- [X] T027 [US1] Implement the PowerShell bootstrap wrapper and self-test in `install.ps1`
- [X] T028 [US1] Add target installation and troubleshooting docs in `docs/install/targets.md`

**Checkpoint**: User Story 1 should support a complete, independently testable baseline install for Codex and Claude Code.

---

## Phase 4: User Story 2 - Add Relevant Knowledge Packs (Priority: P1)

**Goal**: Let users select only the language, framework, and capability packs they need, with deterministic dependency resolution and recommendations.

**Independent Test**: Starting from a baseline install, a user can add selected language packs, preview the resolved bundle set, and confirm that only the requested compatible guidance is installed.

### Tests for User Story 2 (REQUIRED unless explicitly exempted) ⚠️

- [X] T029 [P] [US2] Add contract tests for bundle selection, dependency resolution, and conflicts in `tests/contract/catalog-bundles.contract.test.ts`
- [X] T030 [P] [US2] Add integration tests for selective knowledge-pack install and recommendations in `tests/integration/install-knowledge-packs.spec.ts`

### Implementation for User Story 2

- [X] T031 [US2] Implement the bundle resolution and dependency-conflict engine in `src/application/planning/resolve-bundles.ts`
- [X] T032 [P] [US2] Seed baseline and capability bundle manifests in `manifests/bundles/core.json`
- [X] T033 [P] [US2] Seed starter language bundle manifests from supplied archives in `manifests/bundles/languages-seeded.json`
- [X] T034 [P] [US2] Scaffold remaining v1 language bundle manifests and asset indexes in `manifests/bundles/languages-v1.json`
- [X] T035 [P] [US2] Seed framework bundle manifests and dependencies in `manifests/bundles/frameworks.json`
- [X] T036 [US2] Implement catalog, add, and remove command handlers in `src/cli/commands/catalog.ts`
- [X] T037 [US2] Implement repo-signal and usage-cue recommendations in `src/application/recommendations/recommend-bundles.ts`
- [X] T038 [US2] Register packaged language asset indexes for seeded and scaffolded bundles in `manifests/catalog/language-assets.json`
- [X] T039 [US2] Add knowledge-pack selection and expansion docs in `docs/catalog/language-packs.md`

**Checkpoint**: User Story 2 should support independently testable knowledge-pack selection, recommendation, and conflict handling.

---

## Phase 5: User Story 3 - Start Work from Templates and Workflows (Priority: P2)

**Goal**: Deliver a first-class template and workflow catalog with discoverability, validation, and direct access to the supplied shell and PowerShell validators.

**Independent Test**: A user can list and inspect installed task and workflow templates, validate the catalog through CLI and direct scripts, and obtain a workflow graph or recommendation for a chosen task.

### Tests for User Story 3 (REQUIRED unless explicitly exempted) ⚠️

- [X] T040 [P] [US3] Add contract tests for template and workflow catalog commands in `tests/contract/template-catalog.contract.test.ts`
- [X] T041 [P] [US3] Add integration tests for template validation and workflow graph output in `tests/integration/template-workflows.spec.ts`

### Implementation for User Story 3

- [X] T042 [P] [US3] Define the template and workflow schema set in `schemas/templates/template-catalog.schema.json`
- [X] T043 [P] [US3] Add starter task templates in `templates/tasks/implement-feature.md`
- [X] T044 [P] [US3] Add starter workflow templates in `templates/workflows/research-plan-implement-validate.md`
- [X] T045 [P] [US3] Vendor shell validation utilities from the supplied bundle in `scripts/templates/shell/check-template-frontmatter.sh`
- [X] T046 [P] [US3] Vendor PowerShell validation utilities from the supplied bundle in `scripts/templates/powershell/Check-TemplateFrontmatter.ps1`
- [X] T047 [US3] Implement template and workflow command handlers in `src/cli/commands/template.ts`
- [X] T048 [US3] Implement template validation and workflow graph services in `src/application/validation/validate-templates.ts`
- [X] T049 [US3] Implement assistant-facing template recommendation resolution in `src/application/recommendations/recommend-templates.ts`
- [X] T050 [US3] Add template authoring and usage docs in `docs/templates/authoring.md`

**Checkpoint**: User Story 3 should provide independently testable template discovery, validation, and workflow-guided execution.

---

## Phase 6: User Story 4 - Maintain and Upgrade the Platform Safely (Priority: P3)

**Goal**: Enable safe upgrade, repair, restore, uninstall, and migration from the reference package, plus release-time validation of shipped assets.

**Independent Test**: A maintainer can back up state, simulate upgrade and repair, run migration mapping from the reference footprint, and validate packaged artifacts before release.

### Tests for User Story 4 (REQUIRED unless explicitly exempted) ⚠️

- [X] T051 [P] [US4] Add contract tests for backup, restore, upgrade, repair, and migration commands in `tests/contract/maintenance.contract.test.ts`
- [X] T052 [P] [US4] Add integration smoke tests for migration, repair, and uninstall flows in `tests/integration/maintenance-flows.spec.ts`

### Implementation for User Story 4

- [X] T053 [US4] Implement backup, restore, repair, and uninstall command handlers in `src/cli/commands/maintenance.ts`
- [X] T054 [US4] Implement install-state diff and drift reconciliation in `src/application/install/reconcile-state.ts`
- [X] T055 [US4] Implement the reference-package migration scanner and mapping planner in `src/application/migration/scan-reference-install.ts`
- [X] T056 [P] [US4] Implement packed-artifact completeness validation in `scripts/ci/validate-packed-install-surface.mjs`
- [X] T057 [P] [US4] Implement bundle dependency and capability validators in `scripts/ci/validate-pack-dependencies.mjs`
- [X] T058 [P] [US4] Implement tarball release smoke and upgrade checks in `scripts/ci/release-smoke.mjs`
- [X] T059 [US4] Add migration and maintenance guides in `docs/migration/reference-project.md`

**Checkpoint**: User Story 4 should support independently testable maintenance, migration, and release validation workflows.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements that affect multiple user stories

- [X] T060 [P] Update the top-level product overview and catalog docs in `README.md`
- [X] T061 Refine shared command and utility composition in `src/shared/index.ts`
- [X] T062 [P] Add additional unit coverage for edge-case validation and path safety in `tests/unit/edge-cases.spec.ts`
- [X] T063 Harden path normalization and manifest sanitization in `src/infrastructure/filesystem/normalize-target-path.ts`
- [X] T064 [P] Sync agent guidance and command references in `AGENTS.md`
- [ ] T065 Run quickstart validation against the smoke harness in `specs/001-agentic-kb-optimizer/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational and is the recommended MVP slice
- **User Story 2 (Phase 4)**: Depends on Foundational; can proceed after the shared catalog and install engine exist
- **User Story 3 (Phase 5)**: Depends on Foundational; can proceed in parallel with US2 if template command work is staffed separately
- **User Story 4 (Phase 6)**: Depends on Foundational and benefits from the install-state behavior introduced in US1
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: First recommended delivery slice and MVP
- **User Story 2 (P1)**: Builds on the shared catalog and planner; can follow US1 for smoother demo flow
- **User Story 3 (P2)**: Reuses catalog and recommendation foundations but remains independently testable once its own commands and validators exist
- **User Story 4 (P3)**: Builds on install-state and planner behaviors, so it is safest after US1 core flows are stable

### Within Each User Story

- Tests MUST be written and FAIL before implementation unless the plan documents a justified exception
- Schemas and contracts before command handlers
- Command handlers before end-to-end integration work
- Core behavior before docs and observability refinements
- Story complete before moving to the next priority slice in a sequential delivery model

### Parallel Opportunities

- T003, T004, T005, and T006 can run in parallel during setup
- T008, T009, T012, and T013 can run in parallel during foundational work
- T018 and T019 can run in parallel for target adapters
- T032 through T035 can run in parallel for bundle manifest seeding
- T042 through T046 can run in parallel for template schemas, templates, and validator vendoring
- T056 through T058 can run in parallel for release validation tooling

---

## Parallel Example: User Story 1

```bash
# Launch baseline install tests together:
Task: "Add CLI contract tests for init, install, status, and doctor in tests/contract/cli-install.contract.test.ts"
Task: "Add integration smoke tests for Codex and Claude Code baseline installs in tests/integration/install-target-ready.spec.ts"

# Launch target adapter definitions together:
Task: "Define Codex target adapter assets in targets/codex/adapter.json"
Task: "Define Claude Code target adapter assets in targets/claude-code/adapter.json"
```

## Parallel Example: User Story 2

```bash
# Launch bundle seed tasks together:
Task: "Seed baseline and capability bundle manifests in manifests/bundles/core.json"
Task: "Seed starter language bundle manifests from supplied archives in manifests/bundles/languages-seeded.json"
Task: "Scaffold remaining v1 language bundle manifests and asset indexes in manifests/bundles/languages-v1.json"
Task: "Seed framework bundle manifests and dependencies in manifests/bundles/frameworks.json"
```

## Parallel Example: User Story 3

```bash
# Launch template catalog assets together:
Task: "Define the template and workflow schema set in schemas/templates/template-catalog.schema.json"
Task: "Add starter task templates in templates/tasks/implement-feature.md"
Task: "Add starter workflow templates in templates/workflows/research-plan-implement-validate.md"
Task: "Vendor shell validation utilities from the supplied bundle in scripts/templates/shell/check-template-frontmatter.sh"
Task: "Vendor PowerShell validation utilities from the supplied bundle in scripts/templates/powershell/Check-TemplateFrontmatter.ps1"
```

## Parallel Example: User Story 4

```bash
# Launch release validation tooling together:
Task: "Implement packed-artifact completeness validation in scripts/ci/validate-packed-install-surface.mjs"
Task: "Implement bundle dependency and capability validators in scripts/ci/validate-pack-dependencies.mjs"
Task: "Implement tarball release smoke and upgrade checks in scripts/ci/release-smoke.mjs"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Run the baseline install contract and integration tests
5. Demo Codex and Claude Code target-ready installation flow

### Incremental Delivery

1. Complete Setup + Foundational -> foundation ready
2. Add User Story 1 -> validate target-ready install -> demo
3. Add User Story 2 -> validate bundle selection and recommendation -> demo
4. Add User Story 3 -> validate template catalog and workflow guidance -> demo
5. Add User Story 4 -> validate migration and maintenance workflows -> release hardening

### Parallel Team Strategy

With multiple contributors:

1. One contributor completes Setup + Foundational
2. After Phase 2:
   - Contributor A: User Story 1
   - Contributor B: User Story 2
   - Contributor C: User Story 3
3. Once install-state behavior is stable:
   - Contributor D: User Story 4
4. Final pass: Phase 7 polish, docs, and quickstart validation

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps each task to a user story for traceability
- Each user story is independently completable and testable
- The recommended MVP scope is Phase 3 / User Story 1 only
- Bundle seeding tasks should preserve the supplied archives as the source of truth for starter language content
- Template and workflow tasks must keep direct references to the supplied shell and PowerShell validator scripts
