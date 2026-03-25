---

description: "Task list for Harness Forge Platform Depth, Intelligence, and Runtime Maturity"
---

# Tasks: Harness Forge Platform Depth, Intelligence, and Runtime Maturity

**Input**: Design documents from `/specs/003-platform-enhancements/`
**Prerequisites**: `plan.md` (required), `spec.md` (required), `research.md`, `data-model.md`, `contracts/`

**Tests**: Tests are REQUIRED for this feature because language-pack depth, repo intelligence, flow orchestration, maintenance commands, compatibility reporting, and release gates all change observable product behavior.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this belongs to (e.g. `[US1]`, `[US2]`, `[US3]`, `[US4]`)
- Include exact file paths in descriptions

## Path Conventions

- **Runtime code**: `src/`, `scripts/`, `manifests/`, `schemas/`, `targets/`
- **User-facing docs**: `README.md`, `docs/`, `AGENTS.md`
- **Pack and skill content**: `skills/`, `.agents/skills/`, `rules/`, `templates/workflows/`, `docs/catalog/`
- **Validation and fixtures**: `tests/contract/`, `tests/integration/`, `tests/fixtures/benchmarks/`, `scripts/ci/`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish the new catalogs, schemas, docs, fixture roots, and CLI entrypoints this enhancement wave will build on.

- [X] T001 Update command and validation entrypoints in `package.json`
- [X] T002 Create the framework and compatibility catalog scaffolds in `manifests/catalog/framework-assets.json` and `manifests/catalog/compatibility-matrix.json`
- [X] T003 [P] Create the flow artifact catalog scaffold in `manifests/catalog/flow-artifacts.json`
- [X] T004 [P] Create the hook schema scaffold in `schemas/hooks/hook.schema.json`
- [X] T005 [P] Create the flow-state schema scaffold in `schemas/runtime/flow-state.schema.json`
- [X] T006 [P] Create the benchmark fixture inventory scaffold in `tests/fixtures/benchmarks/index.json`
- [X] T007 [P] Create lifecycle and authoring doc scaffolds in `docs/authoring/skills.md`, `docs/profile-guide.md`, `docs/target-support-matrix.md`, `docs/flow-orchestration.md`, `docs/quality-gates.md`, `docs/maintenance-lifecycle.md`, and `docs/observability.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Define the contracts, inventories, and shared runtime model all user stories depend on.

**⚠️ CRITICAL**: No user story work should begin until this phase is complete

- [X] T008 Define the hook manifest contract in `schemas/hooks/hook.schema.json` and `manifests/hooks/index.json`
- [X] T009 Define the flow-state contract in `schemas/runtime/flow-state.schema.json` and `.specify/state/agent-context.md`
- [X] T010 Define the framework asset catalog structure in `manifests/catalog/framework-assets.json`
- [X] T011 Define the compatibility matrix structure in `manifests/catalog/compatibility-matrix.json`
- [X] T012 Define the flow artifact catalog structure in `manifests/catalog/flow-artifacts.json`
- [X] T013 Define the benchmark scenario inventory in `tests/fixtures/benchmarks/index.json`
- [X] T014 [P] Define the skill authoring contract in `docs/authoring/skills.md`
- [X] T015 [P] Define the profile behavior guide scaffold in `docs/profile-guide.md`
- [X] T016 [P] Define the target support matrix scaffold in `docs/target-support-matrix.md`
- [X] T017 [P] Define the flow orchestration guide in `docs/flow-orchestration.md`
- [X] T018 [P] Define the quality-gates overview in `docs/quality-gates.md`
- [X] T019 [P] Define the maintenance and observability guide scaffolds in `docs/maintenance-lifecycle.md` and `docs/observability.md`

**Checkpoint**: Contracts, inventories, and shared runtime/docs scaffolds are ready; user story work can proceed in parallel.

---

## Phase 3: User Story 1 - Install a Deep, Operationally Useful Harness (Priority: P1) 🎯 MVP

**Goal**: Turn thin language packs into substantive, installable, workflow-rich language systems with real examples, framework guidance, and operational skills.

**Independent Test**: Install a supported language pack and confirm it exposes substantive language guidance, multiple real examples, at least one language-aware workflow, and at least one skill with clear activation, execution, validation, and escalation behavior.

### Tests for User Story 1 (REQUIRED unless explicitly exempted) ⚠️

- [X] T020 [P] [US1] Add structured pack depth contract coverage in `tests/contract/structured-pack-depth.contract.test.ts`
- [X] T021 [P] [US1] Add framework pack coverage contract tests in `tests/contract/framework-pack.contract.test.ts`
- [X] T022 [P] [US1] Add language-pack installation quality integration coverage in `tests/integration/language-pack-install-quality.spec.ts`
- [X] T023 [P] [US1] Add framework-pack surface integration coverage in `tests/integration/framework-pack-surface.spec.ts`

### Implementation for User Story 1

- [X] T024 [P] [US1] Deepen the Python pack in `docs/catalog/languages/python.md`, `skills/python-engineering/SKILL.md`, `.agents/skills/python-engineering/SKILL.md`, and `rules/python/README.md`
- [X] T025 [P] [US1] Deepen the Go pack in `docs/catalog/languages/go.md`, `skills/go-engineering/SKILL.md`, `.agents/skills/go-engineering/SKILL.md`, and `rules/golang/README.md`
- [X] T026 [P] [US1] Deepen the Kotlin pack in `docs/catalog/languages/kotlin.md`, `skills/kotlin-engineering/SKILL.md`, `.agents/skills/kotlin-engineering/SKILL.md`, and `rules/kotlin/README.md`
- [X] T027 [P] [US1] Deepen the Rust pack in `docs/catalog/languages/rust.md`, `skills/rust-engineering/SKILL.md`, `.agents/skills/rust-engineering/SKILL.md`, and `rules/rust/README.md`
- [X] T028 [P] [US1] Deepen the C++ pack in `docs/catalog/languages/cpp.md`, `skills/cpp-engineering/SKILL.md`, `.agents/skills/cpp-engineering/SKILL.md`, and `rules/cpp/README.md`
- [X] T029 [P] [US1] Deepen the PHP pack in `docs/catalog/languages/php.md`, `skills/php-engineering/SKILL.md`, `.agents/skills/php-engineering/SKILL.md`, and `rules/php/README.md`
- [X] T030 [P] [US1] Deepen the Swift pack in `docs/catalog/languages/swift.md`, `skills/swift-engineering/SKILL.md`, `.agents/skills/swift-engineering/SKILL.md`, and `rules/swift/README.md`
- [X] T031 [P] [US1] Deepen the Shell pack in `docs/catalog/languages/shell.md`, `skills/shell-engineering/SKILL.md`, `.agents/skills/shell-engineering/SKILL.md`, and `rules/shell/README.md`
- [X] T032 [P] [US1] Deepen the Perl pack in `docs/catalog/languages/perl.md`, `skills/perl-engineering/SKILL.md`, `.agents/skills/perl-engineering/SKILL.md`, and `rules/perl/README.md`
- [X] T033 [P] [US1] Add language-aware workflows for Python, Go, Kotlin, and Rust in `templates/workflows/implement-python-change.md`, `templates/workflows/implement-go-change.md`, `templates/workflows/implement-kotlin-change.md`, and `templates/workflows/implement-rust-change.md`
- [X] T034 [P] [US1] Add language-aware workflows for C++, PHP, Swift, Shell, and Perl in `templates/workflows/implement-cpp-change.md`, `templates/workflows/implement-php-change.md`, `templates/workflows/implement-swift-change.md`, `templates/workflows/implement-shell-change.md`, and `templates/workflows/implement-perl-change.md`
- [X] T035 [US1] Add the first framework-pack wave in `docs/catalog/frameworks/react.md`, `docs/catalog/frameworks/vite.md`, `docs/catalog/frameworks/express.md`, `docs/catalog/frameworks/fastapi.md`, `docs/catalog/frameworks/django.md`, `docs/catalog/frameworks/spring-boot.md`, `docs/catalog/frameworks/aspnet-core.md`, `docs/catalog/frameworks/gin.md`, `docs/catalog/frameworks/ktor.md`, and `docs/catalog/frameworks/symfony.md`
- [X] T036 [US1] Create the framework pack catalog in `docs/catalog/framework-packs.md` and `manifests/catalog/framework-assets.json`
- [X] T037 [US1] Expand language-pack maturity and installation guidance in `docs/languages.md`, `docs/catalog/language-packs.md`, and `README.md`
- [X] T038 [US1] Promote framework-aware bundle metadata in `manifests/bundles/frameworks.json`, `manifests/catalog/language-assets.json`, and `manifests/catalog/index.json`

**Checkpoint**: User Story 1 should provide independently testable deep language and framework pack surfaces.

---

## Phase 4: User Story 2 - Receive Adaptive Recommendations for the Current Repository (Priority: P1)

**Goal**: Add repo intelligence and evidence-backed recommendations that understand repo role, framework, risk, and maturity instead of relying mainly on extensions.

**Independent Test**: Point the system at representative repositories and confirm it identifies dominant repo characteristics, emits ranked recommendations with evidence, and differentiates framework-level contexts from generic language-only contexts.

### Tests for User Story 2 (REQUIRED unless explicitly exempted) ⚠️

- [X] T039 [P] [US2] Add repo-intelligence contract coverage in `tests/contract/repo-intelligence.contract.test.ts`
- [X] T040 [P] [US2] Add recommendation evidence integration coverage in `tests/integration/recommendation-evidence.spec.ts`
- [X] T041 [P] [US2] Add benchmark repo detection coverage in `tests/integration/repo-benchmarks.spec.ts`

### Implementation for User Story 2

- [X] T042 [US2] Implement repository scanning in `scripts/intelligence/scan-repo.mjs`
- [X] T043 [P] [US2] Implement framework detection in `scripts/intelligence/detect-frameworks.mjs`
- [X] T044 [P] [US2] Implement recommendation scoring in `scripts/intelligence/score-recommendations.mjs`
- [X] T045 [US2] Add the repo-intelligence domain model in `src/domain/intelligence/repo-intelligence.ts`
- [X] T046 [US2] Add the evidence-backed recommendation application service in `src/application/recommendations/recommend-from-intelligence.ts`
- [X] T047 [US2] Add the recommend command in `src/cli/commands/recommend.ts` and `src/cli/index.ts`
- [X] T048 [US2] Implement recommendation reporting in `src/infrastructure/diagnostics/recommendation-reporter.ts`
- [X] T049 [US2] Create benchmark fixtures for a TypeScript web app and Python service in `tests/fixtures/benchmarks/typescript-web-app/` and `tests/fixtures/benchmarks/python-service/`
- [X] T050 [US2] Create benchmark fixtures for a Java service and .NET API in `tests/fixtures/benchmarks/java-service/` and `tests/fixtures/benchmarks/dotnet-api/`
- [X] T051 [US2] Create benchmark fixtures for a Go CLI, monorepo, legacy repo, and security-sensitive service in `tests/fixtures/benchmarks/go-cli/`, `tests/fixtures/benchmarks/monorepo/`, `tests/fixtures/benchmarks/legacy-repo/`, and `tests/fixtures/benchmarks/security-service/`
- [X] T052 [US2] Document evidence-backed recommendation behavior in `docs/quickstart.md`, `docs/catalog/framework-packs.md`, and `AGENTS.md`

**Checkpoint**: User Story 2 should provide independently testable repo intelligence and adaptive recommendation behavior.

---

## Phase 5: User Story 3 - Use High-Signal Workload and Flow Orchestration Surfaces (Priority: P1)

**Goal**: Upgrade generic skills into operational systems, add workload-specialized skills, and make Speckit a recoverable flow orchestrator with artifact lineage.

**Independent Test**: Trigger core workload skills and the Speckit flow system from a cold start and confirm each one produces a consistent artifact, records its progress, and exposes the current step, blockers, and next action.

### Tests for User Story 3 (REQUIRED unless explicitly exempted) ⚠️

- [X] T053 [P] [US3] Add operational-skill contract coverage in `tests/contract/operational-skills.contract.test.ts`
- [X] T054 [P] [US3] Add workload-skill artifact integration coverage in `tests/integration/workload-skills.spec.ts`
- [X] T055 [P] [US3] Add Speckit flow-state integration coverage in `tests/integration/speckit-flow-state.spec.ts`

### Implementation for User Story 3

- [X] T056 [US3] Deepen the repo-onboarding skill in `skills/repo-onboarding/SKILL.md` and `skills/repo-onboarding/references/`
- [X] T057 [US3] Deepen the security-scan skill in `skills/security-scan/SKILL.md` and `skills/security-scan/references/`
- [X] T058 [US3] Deepen the release-readiness skill in `skills/release-readiness/SKILL.md` and `skills/release-readiness/references/`
- [X] T059 [US3] Deepen the documentation-lookup and architecture-decision-records skills in `skills/documentation-lookup/SKILL.md`, `skills/architecture-decision-records/SKILL.md`, and their `references/` directories
- [X] T060 [P] [US3] Add the incident-triage and dependency-upgrade-safety skills in `skills/incident-triage/SKILL.md` and `skills/dependency-upgrade-safety/SKILL.md`
- [X] T061 [P] [US3] Add the performance-profiling and test-strategy-and-coverage skills in `skills/performance-profiling/SKILL.md` and `skills/test-strategy-and-coverage/SKILL.md`
- [X] T062 [P] [US3] Add the api-contract-review and db-migration-review skills in `skills/api-contract-review/SKILL.md` and `skills/db-migration-review/SKILL.md`
- [X] T063 [P] [US3] Add the pr-triage-and-summary, observability-setup, and repo-modernization skills in `skills/pr-triage-and-summary/SKILL.md`, `skills/observability-setup/SKILL.md`, and `skills/repo-modernization/SKILL.md`
- [X] T064 [US3] Implement flow-state loading and persistence in `src/application/flow/load-flow-state.ts` and `src/application/flow/save-flow-state.ts`
- [X] T065 [US3] Implement the flow-status runtime script in `scripts/runtime/flow-status.mjs`
- [X] T066 [US3] Add the flow status CLI command in `src/cli/commands/flow.ts` and `src/cli/index.ts`
- [X] T067 [US3] Create the unified Speckit flow guide in `docs/flow-orchestration.md`
- [X] T068 [US3] Add artifact-lineage and issue-export conventions in `docs/generated-artifacts.md`, `docs/commands.md`, and `manifests/catalog/flow-artifacts.json`

**Checkpoint**: User Story 3 should provide independently testable workload skills and a recoverable flow orchestration surface.

---

## Phase 6: User Story 4 - Operate, Validate, and Evolve the Harness Safely Over Time (Priority: P2)

**Goal**: Add typed hooks, real operating profiles, stronger quality gates, knowledge-ingestion and maintenance commands, compatibility reporting, target parity honesty, and local-first observability.

**Independent Test**: Run the maintenance and validation surfaces against a release candidate and installed workspace, then confirm the system can detect shallow content, drift, incompatibilities, stale surfaces, and support gaps before release or upgrade.

### Tests for User Story 4 (REQUIRED unless explicitly exempted) ⚠️

- [X] T069 [P] [US4] Add runtime-governance contract coverage in `tests/contract/runtime-governance.contract.test.ts`
- [X] T070 [P] [US4] Add maintenance lifecycle integration coverage in `tests/integration/maintenance-lifecycle.spec.ts`
- [X] T071 [P] [US4] Add observability and drift integration coverage in `tests/integration/observability-drift.spec.ts`

### Implementation for User Story 4

- [X] T072 [US4] Implement the typed hook model in `schemas/hooks/hook.schema.json`, `manifests/hooks/index.json`, and `docs/hooks/catalog.md`
- [X] T073 [US4] Create real operating profiles in `manifests/profiles/core.json`, `manifests/profiles/developer.json`, `manifests/profiles/reviewer.json`, `manifests/profiles/security.json`, `manifests/profiles/release-manager.json`, `manifests/profiles/rapid-prototyping.json`, `manifests/profiles/legacy-modernization.json`, `manifests/profiles/research-first.json`, `manifests/profiles/game-dev-native.json`, and `manifests/profiles/ai-runtime.json`
- [X] T074 [US4] Document profile behavior and target compatibility in `docs/profile-guide.md` and `docs/target-support-matrix.md`
- [X] T075 [US4] Implement the compatibility matrix generator in `scripts/ci/generate-compatibility-matrix.mjs` and `manifests/catalog/compatibility-matrix.json`
- [X] T076 [US4] Implement placeholder and shallow-content validation in `scripts/ci/validate-no-placeholders.mjs` and `scripts/ci/validate-skill-depth.mjs`
- [X] T077 [US4] Implement framework-coverage and doc-command alignment validation in `scripts/ci/validate-framework-coverage.mjs` and `scripts/ci/validate-doc-command-alignment.mjs`
- [X] T078 [US4] Implement manifest-to-runtime consistency validation in `scripts/ci/validate-manifest-runtime-consistency.mjs`
- [X] T079 [US4] Implement knowledge import and normalization scripts in `scripts/knowledge/import-pack.mjs`, `scripts/knowledge/normalize-pack.mjs`, `scripts/knowledge/report-coverage.mjs`, and `scripts/knowledge/report-drift.mjs`
- [X] T080 [US4] Add the doctor and audit CLI commands in `src/cli/commands/doctor.ts` and `src/cli/commands/audit.ts`
- [X] T081 [P] [US4] Add the sync and diff-install CLI commands in `src/cli/commands/sync.ts` and `src/cli/commands/diff-install.ts`
- [X] T082 [P] [US4] Add the upgrade-surface and prune CLI commands in `src/cli/commands/upgrade-surface.ts` and `src/cli/commands/prune.ts`
- [X] T083 [US4] Implement local-first observability storage and reporting in `src/infrastructure/observability/local-metrics-store.ts` and `scripts/runtime/report-effectiveness.mjs`
- [X] T084 [US4] Document maintenance lifecycle and observability in `docs/maintenance-lifecycle.md` and `docs/observability.md`
- [X] T085 [US4] Expand Cursor and OpenCode support honesty in `targets/cursor/adapter.json`, `targets/opencode/adapter.json`, and `docs/target-support-matrix.md`
- [X] T086 [US4] Update the front door and command catalog for lifecycle, compatibility, and validation behavior in `README.md`, `docs/commands.md`, and `package.json`

**Checkpoint**: User Story 4 should provide independently testable lifecycle safety, compatibility, and evidence surfaces.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements that affect multiple user stories

- [X] T087 [P] Sync package-surface and bundle manifests for new skills, framework packs, maintenance commands, and flow surfaces in `manifests/catalog/package-surface.json`, `manifests/bundles/core.json`, and `manifests/catalog/index.json`
- [X] T088 [P] Wire the new quality gates, compatibility generation, knowledge pipeline, and recommendation surfaces into `scripts/ci/release-smoke.mjs` and `package.json`
- [X] T089 [P] Create the benchmark scenario guide in `tests/fixtures/benchmarks/README.md` and `docs/benchmark-scenarios.md`
- [X] T090 [P] Refresh assistant guidance for workload skills, profiles, repo intelligence, and flow recovery in `AGENTS.md` and `docs/agents.md`
- [X] T091 Run end-to-end validation for benchmark recommendations, flow recovery, maintenance commands, and release gates in `specs/003-platform-enhancements/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies; can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion; blocks all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational and delivers the first deep content slice
- **User Story 2 (Phase 4)**: Depends on Foundational and benefits from pack/framework metadata from US1
- **User Story 3 (Phase 5)**: Depends on Foundational and benefits from recommendation and pack depth surfaces from US1-US2
- **User Story 4 (Phase 6)**: Depends on Foundational and is strongest once deep content, recommendation logic, and flow surfaces exist
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: First delivery slice for real language and framework depth
- **User Story 2 (P1)**: Second critical slice for adaptive, evidence-backed setup
- **User Story 3 (P1)**: Third critical slice for operational skills and flow orchestration
- **User Story 4 (P2)**: Lifecycle safety, compatibility honesty, and evidence follow once the operational surfaces exist

### Within Each User Story

- Tests SHOULD be written and fail before implementation unless a documented exception is required
- Content contracts before content expansion
- Runtime scanning before recommendation presentation
- Flow-state persistence before flow-status reporting
- Validation and maintenance commands after their governed surfaces exist

### Parallel Opportunities

- Setup tasks `T003-T007` can run in parallel
- Foundational tasks `T014-T019` can run in parallel
- Language-pack deepening tasks `T024-T032` can run in parallel by language
- Language-workflow tasks `T033-T034` can run in parallel
- Repo-intelligence tasks `T043-T044` can run in parallel after `T042`
- Benchmark fixture tasks `T049-T051` can run in parallel
- Workload skill creation tasks `T060-T063` can run in parallel
- Maintenance command tasks `T081-T082` can run in parallel

---

## Parallel Example: User Story 1

```bash
# Deepen multiple structured packs in parallel:
Task: "Deepen the Python pack in docs/catalog/languages/python.md, skills/python-engineering/SKILL.md, .agents/skills/python-engineering/SKILL.md, and rules/python/README.md"
Task: "Deepen the Go pack in docs/catalog/languages/go.md, skills/go-engineering/SKILL.md, .agents/skills/go-engineering/SKILL.md, and rules/golang/README.md"
Task: "Deepen the Kotlin pack in docs/catalog/languages/kotlin.md, skills/kotlin-engineering/SKILL.md, .agents/skills/kotlin-engineering/SKILL.md, and rules/kotlin/README.md"
Task: "Deepen the Rust pack in docs/catalog/languages/rust.md, skills/rust-engineering/SKILL.md, .agents/skills/rust-engineering/SKILL.md, and rules/rust/README.md"
```

## Parallel Example: User Story 2

```bash
# Build intelligence and fixtures together:
Task: "Implement framework detection in scripts/intelligence/detect-frameworks.mjs"
Task: "Implement recommendation scoring in scripts/intelligence/score-recommendations.mjs"
Task: "Create benchmark fixtures for a TypeScript web app and Python service in tests/fixtures/benchmarks/typescript-web-app/ and tests/fixtures/benchmarks/python-service/"
Task: "Create benchmark fixtures for a Java service and .NET API in tests/fixtures/benchmarks/java-service/ and tests/fixtures/benchmarks/dotnet-api/"
```

## Parallel Example: User Story 3

```bash
# Add workload-specialized skills in parallel:
Task: "Add the incident-triage and dependency-upgrade-safety skills in skills/incident-triage/SKILL.md and skills/dependency-upgrade-safety/SKILL.md"
Task: "Add the performance-profiling and test-strategy-and-coverage skills in skills/performance-profiling/SKILL.md and skills/test-strategy-and-coverage/SKILL.md"
Task: "Add the api-contract-review and db-migration-review skills in skills/api-contract-review/SKILL.md and skills/db-migration-review/SKILL.md"
Task: "Add the pr-triage-and-summary, observability-setup, and repo-modernization skills in skills/pr-triage-and-summary/SKILL.md, skills/observability-setup/SKILL.md, and skills/repo-modernization/SKILL.md"
```

## Implementation Strategy

### MVP First

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. Complete Phase 4: User Story 2
5. **STOP and VALIDATE**: Confirm deep language packs and evidence-backed recommendations both work

### Incremental Delivery

1. Complete Setup + Foundational → contracts and inventories are ready
2. Add User Story 1 → validate language and framework depth
3. Add User Story 2 → validate repo intelligence and benchmark recommendations
4. Add User Story 3 → validate operational skills and flow-state recovery
5. Add User Story 4 → validate lifecycle, compatibility, knowledge pipeline, and observability

### Parallel Team Strategy

With multiple contributors:

1. One contributor completes Setup + Foundational
2. After Phase 2:
   - Contributor A: User Story 1 language/framework depth
   - Contributor B: User Story 2 repo intelligence and benchmark fixtures
3. After US1 and US2 stabilize:
   - Contributor C: User Story 3 workload skills and flow orchestration
   - Contributor D: User Story 4 maintenance, quality gates, compatibility, and observability
4. Final pass: Phase 7 polish and end-to-end validation

---

## Notes

- `[P]` tasks use different files and can proceed without waiting on the same write surface
- `[US1]` through `[US4]` map directly to the feature specification user stories
- This regenerated task list now reflects the planning artifacts, especially the repo-intelligence, flow-state, hook-manifest, compatibility-matrix, and benchmark-fixture contracts
- The recommended MVP scope for this feature is **User Story 1 + User Story 2**, because deep content without adaptive setup remains incomplete, and intelligence without deep content would still produce shallow outcomes
