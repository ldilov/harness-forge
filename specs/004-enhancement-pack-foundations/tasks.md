---

description: "Task list for Harness Forge Enhancement Pack Foundations"
---

# Tasks: Harness Forge Enhancement Pack Foundations

**Input**: Design documents from `/specs/004-enhancement-pack-foundations/`
**Prerequisites**: `plan.md` (required), `spec.md` (required), `research.md`, `data-model.md`, `contracts/`

**Tests**: Tests are REQUIRED for this feature because canonical support truth, repo-map generation, local observability, and parallel planning all change observable product behavior and release-gate outcomes.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this belongs to (e.g. `[US1]`, `[US2]`, `[US3]`, `[US4]`)
- Include exact file paths in descriptions

## Path Conventions

- **Runtime code**: `src/`, `scripts/`, `manifests/`, `schemas/`, `targets/`
- **User-facing docs**: `README.md`, `docs/`, `AGENTS.md`
- **Skills and knowledge**: `skills/`, `knowledge-bases/`, `templates/`
- **Validation and fixtures**: `tests/contract/`, `tests/integration/`, `tests/fixtures/benchmarks/`, `scripts/ci/`

## Phase 1: Setup (Shared Scaffolding)

**Purpose**: Establish the new catalogs, schemas, docs, templates, and script entrypoints this feature builds on.

- [X] T001 Update script and command scaffolding in `package.json` and `src/cli/index.ts`
- [X] T002 Create schema scaffolds in `schemas/manifests/harness-capability-matrix.schema.json`, `schemas/runtime/repo-map.schema.json`, `schemas/runtime/instruction-plan.schema.json`, `schemas/runtime/observability-event.schema.json`, `schemas/runtime/observability-summary.schema.json`, `schemas/runtime/benchmark-expectation.schema.json`, `schemas/runtime/worktree-plan.schema.json`, and `schemas/runtime/worktree-state.schema.json`
- [X] T003 [P] Create canonical catalog scaffolds in `manifests/catalog/capability-taxonomy.json` and `manifests/catalog/harness-capability-matrix.json`
- [X] T004 [P] Create intelligence and runtime script scaffolds in `scripts/intelligence/cartograph-repo.mjs`, `scripts/intelligence/classify-boundaries.mjs`, `scripts/intelligence/synthesize-instructions.mjs`, `scripts/runtime/record-event.mjs`, `scripts/runtime/summarize-observability.mjs`, `scripts/runtime/render-observability-report.mjs`, `scripts/runtime/create-parallel-plan.mjs`, `scripts/runtime/check-parallel-status.mjs`, and `scripts/runtime/check-merge-readiness.mjs`
- [X] T005 [P] Create documentation scaffolds in `docs/repo-cartography.md`, `docs/targets/capability-families.md`, `docs/targets/translation-vs-emulation.md`, `docs/observability/event-taxonomy.md`, `docs/observability/eval-model.md`, `docs/observability/benchmark-authoring.md`, `docs/parallel-worktrees.md`, and `docs/flow-orchestration/parallel-execution.md`
- [X] T006 [P] Create instruction and workflow template scaffolds in `templates/instructions/root-agents-template.md`, `templates/instructions/scoped-agents-template.md`, `templates/instructions/cursor-rule-template.mdc`, and `templates/workflows/parallel-implement-and-merge.md`
- [X] T007 [P] Create skill and knowledge-base scaffolds in `skills/repo-cartographer/SKILL.md`, `skills/observability-and-eval/SKILL.md`, `skills/parallel-worktree-supervisor/SKILL.md`, and `knowledge-bases/operations/observability-and-evals/README.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Define the core types, registry wiring, and shared fixture plumbing that every user story depends on.

**⚠️ CRITICAL**: No user story work should begin until this phase is complete

- [X] T008 Define capability domain types in `src/domain/capabilities/capability-taxonomy.ts` and `src/domain/capabilities/capability-record.ts`
- [X] T009 Define repo cartography domain types in `src/domain/intelligence/repo-map.ts` and `src/domain/intelligence/instruction-plan.ts`
- [X] T010 Define observability and benchmark domain types in `src/domain/observability/event.ts`, `src/domain/observability/summary.ts`, and `src/domain/observability/benchmark-expectation.ts`
- [X] T011 Define parallel planning domain types in `src/domain/parallel/parallel-plan.ts`, `src/domain/parallel/shard-state.ts`, and `src/domain/parallel/merge-readiness.ts`
- [X] T012 Wire new catalogs, schemas, and generated artifact paths into `src/domain/manifests/index.ts` and `src/shared/constants.ts`
- [X] T013 [P] Extend shared filesystem and reporting helpers for new generated artifacts in `src/shared/fs.ts` and `src/infrastructure/diagnostics/reporter.ts`
- [X] T014 [P] Expand benchmark fixture registry plumbing in `tests/fixtures/benchmarks/index.json` and `tests/fixtures/benchmarks/README.md`

**Checkpoint**: Core contracts, registry wiring, and fixture plumbing are ready; user story work can proceed in priority order.

---

## Phase 3: User Story 1 - Trust Target Support Claims Before Installing or Depending on Them (Priority: P1) 🎯 MVP

**Goal**: Establish a canonical, evidence-backed capability system that drives support docs, recommendation support checks, and release gating.

**Independent Test**: Review supported targets through the public support surface, recommendation flow, and release validation output, then confirm they all express the same capability status, confidence, and fallback expectations for each target.

### Tests for User Story 1

- [X] T015 [P] [US1] Add capability matrix contract coverage in `tests/contract/capability-matrix.contract.test.ts`
- [X] T016 [P] [US1] Add target support doc generation integration coverage in `tests/integration/target-support-matrix.spec.ts`
- [X] T017 [P] [US1] Add capability drift release-gate coverage in `tests/integration/capability-drift.spec.ts`

### Implementation for User Story 1

- [X] T018 [US1] Define the capability taxonomy and canonical support data in `manifests/catalog/capability-taxonomy.json` and `manifests/catalog/harness-capability-matrix.json`
- [X] T019 [US1] Add the capability matrix schema and manifest bindings in `schemas/manifests/harness-capability-matrix.schema.json` and `src/domain/manifests/index.ts`
- [X] T020 [US1] Implement support document generation in `scripts/ci/generate-target-support-docs.mjs`
- [X] T021 [US1] Implement capability matrix validation in `scripts/ci/validate-capability-matrix.mjs`
- [X] T022 [US1] Update target adapters and compatibility mappings to consume canonical capability truth in `targets/claude-code/adapter.json`, `targets/codex/adapter.json`, `targets/cursor/adapter.json`, `targets/opencode/adapter.json`, and `manifests/catalog/compatibility-matrix.json`
- [X] T023 [US1] Integrate capability truth into recommendation and diagnostic output in `src/application/recommendations/recommend-from-intelligence.ts` and `src/infrastructure/diagnostics/recommendation-reporter.ts`
- [X] T024 [US1] Refresh operator docs for support honesty in `docs/target-support-matrix.md`, `docs/install/targets.md`, `docs/targets/capability-families.md`, `docs/targets/translation-vs-emulation.md`, and `README.md`
- [X] T025 [US1] Wire capability generation and validation into release gates in `package.json` and `scripts/ci/release-smoke.mjs`

**Checkpoint**: User Story 1 should provide one canonical support truth source and aligned operator-facing support guidance.

---

## Phase 4: User Story 2 - Receive Repo-Aware Instruction Guidance Instead of Generic Advice (Priority: P1)

**Goal**: Add repo cartography and target-aware instruction synthesis that emit evidence-backed guidance rather than generic heuristics.

**Independent Test**: Run the cartography and instruction synthesis flow against representative repositories, then confirm it produces a stable repo map, justifies any scoped instruction surfaces with evidence, and avoids adding unnecessary scoped guidance where root-level guidance is enough.

### Tests for User Story 2

- [ ] T026 [P] [US2] Add repo map contract coverage in `tests/contract/repo-map.contract.test.ts`
- [ ] T027 [P] [US2] Add instruction plan contract coverage in `tests/contract/instruction-plan.contract.test.ts`
- [ ] T028 [P] [US2] Add cartography and instruction synthesis integration coverage in `tests/integration/repo-cartography.spec.ts` and `tests/integration/instruction-synthesis.spec.ts`

### Implementation for User Story 2

- [ ] T029 [US2] Add repo-map and instruction-plan schemas in `schemas/runtime/repo-map.schema.json` and `schemas/runtime/instruction-plan.schema.json`
- [ ] T030 [US2] Implement shared boundary classification helpers in `scripts/intelligence/classify-boundaries.mjs` and `scripts/intelligence/shared/cartography.mjs`
- [ ] T031 [US2] Implement repo cartography output in `scripts/intelligence/cartograph-repo.mjs` and extend `scripts/intelligence/scan-repo.mjs`
- [ ] T032 [US2] Implement instruction synthesis dry-run, write, and diff modes in `scripts/intelligence/synthesize-instructions.mjs`
- [ ] T033 [US2] Extend recommendation scoring to consume repo maps, quality gaps, and capability constraints in `scripts/intelligence/score-recommendations.mjs`, `src/domain/intelligence/repo-intelligence.ts`, and `src/application/recommendations/recommend-from-intelligence.ts`
- [ ] T034 [US2] Add CLI entrypoints for cartography and instruction synthesis in `src/cli/commands/cartograph.ts`, `src/cli/commands/synthesize-instructions.ts`, and `src/cli/index.ts`
- [ ] T035 [US2] Add instruction templates and synthesized guidance defaults in `templates/instructions/root-agents-template.md`, `templates/instructions/scoped-agents-template.md`, `templates/instructions/cursor-rule-template.mdc`, and `skills/repo-cartographer/SKILL.md`
- [ ] T036 [US2] Add benchmark fixtures and expected repo maps in `tests/fixtures/benchmarks/ts-monorepo-web-api/`, `tests/fixtures/benchmarks/dotnet-service-with-migrations/`, `tests/fixtures/benchmarks/python-fastapi-worker/`, `tests/fixtures/benchmarks/cpp-unreal-plugin/`, `tests/fixtures/benchmarks/mixed-repo-frontend-backend-infra/`, `tests/fixtures/benchmarks/repo-with-generated-code/`, and `tests/fixtures/benchmarks/repo-without-tests/`
- [ ] T037 [US2] Document repo cartography and instruction synthesis in `docs/repo-cartography.md`, `docs/quickstart.md`, `docs/targets.md`, and `docs/benchmark-scenarios.md`

**Checkpoint**: User Story 2 should provide stable repo-map output and inspectable, provenance-backed instruction recommendations.

---

## Phase 5: User Story 3 - Measure Whether Recommendations and Workflows Are Actually Helping (Priority: P1)

**Goal**: Upgrade local observability into append-safe events, derived summaries, benchmark expectations, and operator guidance that explain usefulness and drift.

**Independent Test**: Generate local event records and summary outputs from representative installs, recommendations, benchmark runs, and flow recoveries, then confirm maintainers can inspect acceptance rates, drift warnings, failure patterns, and target-specific benchmark outcomes without external services.

### Tests for User Story 3

- [ ] T038 [P] [US3] Add observability contract coverage in `tests/contract/observability.contract.test.ts`
- [ ] T039 [P] [US3] Add observability summary integration coverage in `tests/integration/observability-summary.spec.ts`
- [ ] T040 [P] [US3] Add benchmark expectation and drift integration coverage in `tests/integration/eval-knowledge.spec.ts`

### Implementation for User Story 3

- [ ] T041 [US3] Add event, summary, and benchmark expectation schemas in `schemas/runtime/observability-event.schema.json`, `schemas/runtime/observability-summary.schema.json`, and `schemas/runtime/benchmark-expectation.schema.json`
- [ ] T042 [US3] Implement local event recording and summary generation in `scripts/runtime/record-event.mjs`, `scripts/runtime/summarize-observability.mjs`, and `scripts/runtime/render-observability-report.mjs`
- [ ] T043 [US3] Extend local observability storage and event emission in `src/infrastructure/observability/local-metrics-store.ts`, `scripts/runtime/report-effectiveness.mjs`, `scripts/runtime/flow-status.mjs`, `src/cli/commands/recommend.ts`, `src/cli/commands/doctor.ts`, `src/cli/commands/audit.ts`, and `src/cli/commands/diff-install.ts`
- [ ] T044 [US3] Register benchmark expectations and summary deltas in `tests/fixtures/benchmarks/index.json` and the expectation files under `tests/fixtures/benchmarks/`
- [ ] T045 [US3] Add observability and evaluation knowledge content in `knowledge-bases/operations/observability-and-evals/README.md`, `knowledge-bases/operations/observability-and-evals/event-design.md`, `knowledge-bases/operations/observability-and-evals/recommendation-quality.md`, and `knowledge-bases/operations/observability-and-evals/benchmark-patterns.md`
- [ ] T046 [US3] Add the observability-and-eval skill in `skills/observability-and-eval/SKILL.md`
- [ ] T047 [US3] Expand front-door observability docs in `docs/observability.md`, `docs/observability/event-taxonomy.md`, `docs/observability/eval-model.md`, and `docs/observability/benchmark-authoring.md`
- [ ] T048 [US3] Wire observability reports into release validation and command guidance in `package.json`, `scripts/ci/release-smoke.mjs`, and `docs/commands.md`

**Checkpoint**: User Story 3 should provide local event capture, reproducible summaries, benchmark expectations, and operator-ready evaluation guidance.

---

## Phase 6: User Story 4 - Plan Safe Parallel Execution Without Merge Chaos (Priority: P2)

**Goal**: Add a conservative parallel planner, resumable shard state, merge-readiness checks, and front-door operator surfaces for safe parallel execution.

**Independent Test**: Convert representative feature backlogs into execution plans, then confirm the system produces shard plans for low-overlap work, recommends single-threaded execution for risky work, preserves shard state between interruptions, and blocks merge completion when readiness checks fail.

### Tests for User Story 4

- [ ] T049 [P] [US4] Add parallel plan contract coverage in `tests/contract/parallel-plan.contract.test.ts`
- [ ] T050 [P] [US4] Add parallel planning and merge-readiness integration coverage in `tests/integration/parallel-planning.spec.ts` and `tests/integration/merge-readiness.spec.ts`

### Implementation for User Story 4

- [ ] T051 [US4] Add worktree plan and state schemas in `schemas/runtime/worktree-plan.schema.json` and `schemas/runtime/worktree-state.schema.json`
- [ ] T052 [US4] Implement parallel planning domain logic in `src/domain/parallel/parallel-plan.ts`, `src/domain/parallel/shard-state.ts`, and `src/domain/parallel/merge-readiness.ts`
- [ ] T053 [US4] Implement plan creation and status scripts in `scripts/runtime/create-parallel-plan.mjs` and `scripts/runtime/check-parallel-status.mjs`
- [ ] T054 [US4] Implement merge-readiness reporting in `scripts/runtime/check-merge-readiness.mjs`
- [ ] T055 [US4] Add CLI operator surfaces for parallel planning in `src/cli/commands/flow.ts` and `src/cli/index.ts`
- [ ] T056 [US4] Integrate parallel state with flow recovery in `src/application/flow/load-flow-state.ts`, `src/application/flow/save-flow-state.ts`, `.specify/state/flow-state.json`, and `manifests/catalog/flow-artifacts.json`
- [ ] T057 [US4] Add the parallel-worktree-supervisor skill and workflow template in `skills/parallel-worktree-supervisor/SKILL.md` and `templates/workflows/parallel-implement-and-merge.md`
- [ ] T058 [US4] Document parallel execution and merge safety in `docs/parallel-worktrees.md`, `docs/flow-orchestration/parallel-execution.md`, `docs/flow-orchestration.md`, and `README.md`
- [ ] T059 [US4] Emit parallel supervisor events and expected benchmark outcomes in `scripts/runtime/record-event.mjs`, `tests/fixtures/benchmarks/index.json`, and the expectation files under `tests/fixtures/benchmarks/`

**Checkpoint**: User Story 4 should provide conservative parallel planning, resumable shard state, and actionable merge blocking output.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements that affect multiple user stories

- [ ] T060 [P] Sync package-surface and catalog coverage for new schemas, skills, docs, and workflows in `manifests/catalog/index.json` and `manifests/catalog/package-surface.json`
- [ ] T061 [P] Refresh assistant and operator guidance for capability truth, cartography, observability, and parallel planning in `AGENTS.md`, `docs/agents.md`, and `docs/commands.md`
- [ ] T062 [P] Update release and quickstart validation guidance in `specs/004-enhancement-pack-foundations/quickstart.md`, `docs/quality-gates.md`, and `docs/benchmark-scenarios.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies; can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion; blocks all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational and establishes the canonical support truth required by later target-aware behavior
- **User Story 2 (Phase 4)**: Depends on Foundational and benefits from capability truth from US1 for target-aware synthesis
- **User Story 3 (Phase 5)**: Depends on Foundational and benefits from implemented recommendation and synthesis flows from US1-US2
- **User Story 4 (Phase 6)**: Depends on Foundational and benefits from flow, observability, and benchmark surfaces from US1-US3
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: First delivery slice for canonical support truth and release honesty
- **User Story 2 (P1)**: Second critical slice for repo-aware guidance and instruction synthesis
- **User Story 3 (P1)**: Third critical slice for local evidence, summaries, and evaluation guidance
- **User Story 4 (P2)**: Final major slice for safe parallel execution and merge blocking

### Within Each User Story

- Contract and integration tests should be written and fail before implementation
- Schemas and domain models should land before generators or CLI/report surfaces
- Fixture expectations should be added before release-gate wiring depends on them
- Front-door docs should be updated after the runtime behavior they describe exists

### Parallel Opportunities

- Setup tasks `T003-T007` can run in parallel
- Foundational tasks `T013-T014` can run in parallel
- User Story 1 test tasks `T015-T017` can run in parallel
- User Story 2 test tasks `T026-T028` can run in parallel
- User Story 3 test tasks `T038-T040` can run in parallel
- User Story 4 test tasks `T049-T050` can run in parallel

---

## Parallel Example: User Story 1

```bash
# After capability schemas and catalogs exist, these can run in parallel:
Task: "Implement support document generation in scripts/ci/generate-target-support-docs.mjs"
Task: "Implement capability matrix validation in scripts/ci/validate-capability-matrix.mjs"
Task: "Refresh operator docs for support honesty in docs/target-support-matrix.md, docs/install/targets.md, docs/targets/capability-families.md, docs/targets/translation-vs-emulation.md, and README.md"
```

## Parallel Example: User Story 2

```bash
# After repo-map contracts exist, these can run in parallel:
Task: "Implement shared boundary classification helpers in scripts/intelligence/classify-boundaries.mjs and scripts/intelligence/shared/cartography.mjs"
Task: "Add instruction templates and synthesized guidance defaults in templates/instructions/root-agents-template.md, templates/instructions/scoped-agents-template.md, templates/instructions/cursor-rule-template.mdc, and skills/repo-cartographer/SKILL.md"
Task: "Add benchmark fixtures and expected repo maps in tests/fixtures/benchmarks/ts-monorepo-web-api/, tests/fixtures/benchmarks/dotnet-service-with-migrations/, tests/fixtures/benchmarks/python-fastapi-worker/, tests/fixtures/benchmarks/cpp-unreal-plugin/, tests/fixtures/benchmarks/mixed-repo-frontend-backend-infra/, tests/fixtures/benchmarks/repo-with-generated-code/, and tests/fixtures/benchmarks/repo-without-tests/"
```

## Parallel Example: User Story 3

```bash
# After observability schemas exist, these can run in parallel:
Task: "Implement local event recording and summary generation in scripts/runtime/record-event.mjs, scripts/runtime/summarize-observability.mjs, and scripts/runtime/render-observability-report.mjs"
Task: "Add observability and evaluation knowledge content in knowledge-bases/operations/observability-and-evals/README.md, knowledge-bases/operations/observability-and-evals/event-design.md, knowledge-bases/operations/observability-and-evals/recommendation-quality.md, and knowledge-bases/operations/observability-and-evals/benchmark-patterns.md"
Task: "Expand front-door observability docs in docs/observability.md, docs/observability/event-taxonomy.md, docs/observability/eval-model.md, and docs/observability/benchmark-authoring.md"
```

## Parallel Example: User Story 4

```bash
# After parallel plan schemas and domain types exist, these can run in parallel:
Task: "Implement plan creation and status scripts in scripts/runtime/create-parallel-plan.mjs and scripts/runtime/check-parallel-status.mjs"
Task: "Implement merge-readiness reporting in scripts/runtime/check-merge-readiness.mjs"
Task: "Add the parallel-worktree-supervisor skill and workflow template in skills/parallel-worktree-supervisor/SKILL.md and templates/workflows/parallel-implement-and-merge.md"
```

## Implementation Strategy

### MVP First

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Confirm canonical capability truth, generated support docs, and release support checks all agree

### Incremental Delivery

1. Complete Setup + Foundational → contracts, schemas, and registry wiring are ready
2. Add User Story 1 → validate support honesty and release gating
3. Add User Story 2 → validate repo cartography and instruction synthesis
4. Add User Story 3 → validate local-first events, summaries, and benchmark expectations
5. Add User Story 4 → validate safe parallel planning and merge blocking

### Parallel Team Strategy

With multiple contributors:

1. One contributor completes Setup + Foundational
2. After Phase 2:
   - Contributor A: User Story 1 capability truth and support docs
   - Contributor B: User Story 2 repo cartography and instruction synthesis
3. After US1 and US2 stabilize:
   - Contributor C: User Story 3 observability, eval knowledge, and benchmark expectations
   - Contributor D: User Story 4 parallel planning, shard state, and merge readiness
4. Final pass: Phase 7 polish and release validation

---

## Notes

- `[P]` tasks use different files and can proceed without waiting on the same write surface
- `[US1]` through `[US4]` map directly to the feature specification user stories
- The recommended MVP scope for this feature is **User Story 1**, because canonical support truth is the minimum safe foundation for the later target-aware and release-gated features
