---

description: "Task list for Harness Forge Documentation, Knowledge Packs, and Package Surface"
---

# Tasks: Harness Forge Documentation, Knowledge Packs, and Package Surface

**Input**: Design documents from `/specs/002-docs-content-packaging/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are REQUIRED for this feature because documentation contracts, seeded knowledge inclusion, package surface guarantees, and release validation all change observable behavior and shipping guarantees.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this belongs to (e.g., [US1], [US2], [US3], [US4])
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/`, `docs/`, `rules/`, `templates/`, `scripts/`, `manifests/` at repository root
- **Seeded content**: canonical archive-derived content stored under `knowledge-bases/seeded/`
- **Validation contracts**: schemas under `schemas/` and release gates under `scripts/ci/`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish the packaging, seeded-content, and validation entrypoints this feature will rely on.

- [X] T001 Update publish surface and validation scripts in `package.json`
- [X] T002 Create the seeded knowledge base landing guide in `knowledge-bases/seeded/README.md`
- [X] T003 [P] Create the seeded archive coverage manifest scaffold in `manifests/catalog/seeded-knowledge-files.json`
- [X] T004 [P] Create the published package surface manifest scaffold in `manifests/catalog/package-surface.json`
- [X] T005 [P] Create the content metadata schema entrypoint in `schemas/content/content-metadata.schema.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Define the canonical contracts, inventories, and governance rules that all user stories depend on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T006 Define the content metadata schema in `schemas/content/content-metadata.schema.json`
- [X] T007 [P] Define the seeded knowledge coverage schema in `schemas/manifests/seeded-knowledge-files.schema.json`
- [X] T008 [P] Define the package surface schema in `schemas/manifests/package-surface.schema.json`
- [X] T009 Implement the seeded archive-to-package inventory in `manifests/catalog/seeded-knowledge-files.json`
- [X] T010 Implement the required publish surface inventory in `manifests/catalog/package-surface.json`
- [X] T011 [P] Create authored-versus-generated content governance in `docs/content-architecture.md`
- [X] T012 [P] Create generated artifact provenance guidance in `docs/generated-artifacts.md`
- [X] T013 [P] Create package and manifest governance guidance in `docs/manifests.md`
- [X] T014 Define the validator bundle shipping contract in `scripts/templates/README.md`

**Checkpoint**: Contracts, inventory manifests, and governance docs are ready; user story work can proceed in parallel.

---

## Phase 3: User Story 1 - Understand and Start Quickly (Priority: P1) 🎯 MVP

**Goal**: Deliver a clear product front door and onboarding guide set that helps a new user understand, install, and navigate Harness Forge quickly.

**Independent Test**: A new reader can open the root docs, identify the product purpose and supported targets, follow quickstart and installation guidance, and find command, agent, hook, language, troubleshooting, and migration docs without browsing runtime internals.

### Tests for User Story 1 (REQUIRED unless explicitly exempted) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T015 [P] [US1] Add documentation front-door contract coverage in `tests/contract/docs-front-door.contract.test.ts`
- [X] T016 [P] [US1] Add onboarding and quickstart integration coverage in `tests/integration/docs-quickstart.spec.ts`

### Implementation for User Story 1

- [X] T017 [US1] Rewrite the product front door in `README.md`
- [X] T018 [US1] Create the fast-start guide in `docs/quickstart.md`
- [X] T019 [US1] Create the full install, repair, uninstall, and rollback guide in `docs/installation.md`
- [X] T020 [US1] Consolidate target-neutral and target-specific guidance in `docs/targets.md` and `docs/install/targets.md`
- [X] T021 [US1] Create the language overview and maturity matrix in `docs/languages.md`
- [X] T022 [US1] Create the command catalog in `docs/commands.md`
- [X] T023 [US1] Create the agent catalog in `docs/agents.md`
- [X] T024 [US1] Create the hook lifecycle guide in `docs/hooks.md`
- [X] T025 [US1] Create the troubleshooting guide in `docs/troubleshooting.md`
- [X] T026 [US1] Create the versioning and migration overview in `docs/versioning-and-migration.md`

**Checkpoint**: User Story 1 should provide a complete, independently testable documentation front door and onboarding surface.

---

## Phase 4: User Story 2 - Receive Complete Packaged Runtime Content (Priority: P1)

**Goal**: Ensure the published package ships the full validator bundle and file-level seeded knowledge content for the in-scope starter languages.

**Independent Test**: A maintainer can inspect the package surface and verify that all non-directory files from the seeded TypeScript, Java, .NET, Lua, and PowerShell archives are either shipped directly or mapped to canonical package destinations, and that the full validator bundle remains present and usable.

### Tests for User Story 2 (REQUIRED unless explicitly exempted) ⚠️

- [X] T027 [P] [US2] Add package-surface contract coverage in `tests/contract/package-surface.contract.test.ts`
- [X] T028 [P] [US2] Add seeded archive coverage integration tests in `tests/integration/seeded-knowledge-coverage.spec.ts`

### Implementation for User Story 2

- [X] T029 [P] [US2] Vendor the full TypeScript seeded archive into `knowledge-bases/seeded/typescript/`
- [X] T030 [P] [US2] Vendor the full Java seeded archive into `knowledge-bases/seeded/java/`
- [X] T031 [P] [US2] Vendor the full .NET seeded archive into `knowledge-bases/seeded/dotnet/`
- [X] T032 [P] [US2] Vendor the full Lua seeded archive into `knowledge-bases/seeded/lua/`
- [X] T033 [P] [US2] Vendor the full PowerShell seeded archive into `knowledge-bases/seeded/powershell/`
- [X] T034 [US2] Map every seeded archive file to a shipped or transformed destination in `manifests/catalog/seeded-knowledge-files.json`
- [X] T035 [US2] Expand the published package file surface for seeded knowledge and validator assets in `package.json`
- [X] T036 [US2] Publish validator bundle usage and package guidance in `scripts/templates/README.md` and `docs/templates/authoring.md`
- [X] T037 [US2] Expand the language asset catalog for seeded package content in `manifests/catalog/language-assets.json`
- [X] T038 [US2] Create the seeded language pack overview in `docs/catalog/language-packs.md`
- [X] T039 [US2] Add offline/package verification steps for seeded assets in `docs/installation.md` and `specs/002-docs-content-packaging/quickstart.md`

**Checkpoint**: User Story 2 should provide independently testable validator-bundle completeness and file-level seeded archive inclusion guarantees.

---

## Phase 5: User Story 3 - Trust the Knowledge Pack and Documentation System (Priority: P2)

**Goal**: Turn the seeded archive content and existing runtime docs into a consistent, governed content system with real metadata, maturity guidance, and scenario-based knowledge.

**Independent Test**: A maintainer can inspect language docs, rule pack docs, runtime command and agent docs, and style guides and verify that the seeded languages expose real knowledge, clear maturity, and consistent content rules.

### Tests for User Story 3 (REQUIRED unless explicitly exempted) ⚠️

- [X] T040 [P] [US3] Add content metadata and language-pack completeness contract coverage in `tests/contract/content-metadata.contract.test.ts`
- [X] T041 [P] [US3] Add docs-and-rules consistency integration coverage in `tests/integration/language-pack-docs.spec.ts`

### Implementation for User Story 3

- [X] T042 [P] [US3] Create the command documentation style guide in `docs/style-guides/command-style-guide.md`
- [X] T043 [P] [US3] Create the agent documentation style guide in `docs/style-guides/agent-style-guide.md`
- [X] T044 [P] [US3] Create the rule documentation style guide in `docs/style-guides/rule-style-guide.md`
- [X] T045 [US3] Expand the rules index and language maturity matrix in `rules/README.md`
- [X] T046 [P] [US3] Promote seeded TypeScript and Java knowledge into `docs/catalog/languages/typescript.md` and `docs/catalog/languages/java.md`
- [X] T047 [P] [US3] Promote seeded .NET and Lua knowledge into `docs/catalog/languages/dotnet.md` and `docs/catalog/languages/lua.md`
- [X] T048 [P] [US3] Promote seeded PowerShell knowledge into `docs/catalog/languages/powershell.md` and `rules/powershell/README.md`
- [X] T049 [US3] Upgrade seeded rule pack documentation in `rules/typescript/README.md`, `rules/java/README.md`, `rules/dotnet/README.md`, `rules/lua/README.md`, and `rules/powershell/README.md`
- [X] T050 [US3] Normalize command metadata and operational sections in `commands/plan.md` and `commands/test.md`
- [X] T051 [US3] Normalize agent and context metadata in `agents/planner.md` and `contexts/dev.md`
- [X] T052 [US3] Create the pack-authoring guide in `docs/pack-authoring.md`
- [X] T053 [US3] Create the seeded scenario example index in `examples/README.md` and `examples/knowledge-bases/README.md`

**Checkpoint**: User Story 3 should provide a coherent, independently testable knowledge-pack and content-contract system.

---

## Phase 6: User Story 4 - Prevent Documentation and Package Drift Before Release (Priority: P3)

**Goal**: Add release gates that catch missing metadata, missing seeded file mappings, broken package surface, and authored/generated drift before publish.

**Independent Test**: A maintainer can run the release validation suite and receive actionable failures for missing seeded file coverage, missing validator assets, metadata contract violations, hidden target-surface omissions, or generated-content drift.

### Tests for User Story 4 (REQUIRED unless explicitly exempted) ⚠️

- [X] T054 [P] [US4] Add release-gate contract coverage in `tests/contract/release-gates.contract.test.ts`
- [X] T055 [P] [US4] Add documentation/package release integration coverage in `tests/integration/docs-package-release.spec.ts`

### Implementation for User Story 4

- [X] T056 [US4] Implement content metadata validation in `scripts/ci/validate-content-metadata.mjs`
- [X] T057 [US4] Implement seeded knowledge file coverage validation in `scripts/ci/validate-seeded-knowledge-coverage.mjs`
- [X] T058 [US4] Implement generated-source drift validation in `scripts/ci/validate-generated-sync.mjs`
- [X] T059 [US4] Implement hidden and target-scoped package surface validation in `scripts/ci/validate-packed-install-surface.mjs`
- [X] T060 [US4] Implement docs/content dependency validation in `scripts/ci/validate-pack-dependencies.mjs`
- [X] T061 [US4] Implement docs, validator, and seeded-content release smoke checks in `scripts/ci/release-smoke.mjs`
- [X] T062 [US4] Add localization governance and canonical-source rules in `docs/generated-artifacts.md` and `docs/content-architecture.md`
- [X] T063 [US4] Deepen the reference-project migration and rename guide in `docs/migration/reference-project.md`
- [X] T064 [US4] Add validation and release-gate usage guidance in `README.md` and `AGENTS.md`
- [X] T065 [US4] Wire documentation and package release gates into `package.json`

**Checkpoint**: User Story 4 should support independently testable pre-release drift and package-surface enforcement.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements that affect multiple user stories

- [X] T066 [P] Refresh catalog and profile references for new docs and seeded content in `manifests/catalog/index.json` and `manifests/profiles/core.json`
- [X] T067 [P] Add unit coverage for seeded knowledge mapping helpers in `tests/unit/seeded-knowledge-mapping.spec.ts`
- [X] T068 [P] Normalize non-seeded language overview docs in `docs/catalog/languages/go.md`, `docs/catalog/languages/python.md`, `docs/catalog/languages/rust.md`, `docs/catalog/languages/swift.md`, `docs/catalog/languages/php.md`, `docs/catalog/languages/perl.md`, `docs/catalog/languages/cpp.md`, and `docs/catalog/languages/kotlin.md`
- [X] T069 [P] Sync template and workflow references to shipped validator paths in `templates/tasks/implement-feature.md`, `templates/tasks/fix-bug.md`, `templates/workflows/research-plan-implement-validate.md`, and `templates/workflows/triage-reproduce-fix-verify.md`
- [X] T070 Run quickstart and release-surface validation in `specs/002-docs-content-packaging/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational and is required for the product front door
- **User Story 2 (Phase 4)**: Depends on Foundational and is recommended immediately after US1 because seeded file inclusion is now an explicit release requirement
- **User Story 3 (Phase 5)**: Depends on Foundational and benefits from seeded content imported in US2
- **User Story 4 (Phase 6)**: Depends on Foundational and is strongest after US1-US3 content surfaces exist
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: First delivery slice for the product front door and onboarding docs
- **User Story 2 (P1)**: Second critical slice because file-level archive inclusion and validator bundle completeness are explicit user requirements
- **User Story 3 (P2)**: Builds on imported seeded content and expands it into a governed content system
- **User Story 4 (P3)**: Builds on the completed content and package surfaces so release gates can verify real assets

### Within Each User Story

- Tests MUST be written and FAIL before implementation unless the plan documents a justified exception
- Inventory and mapping tasks before content promotion tasks
- Content promotion before validation and release-gate hardening
- Story complete before moving to the next priority slice in a sequential delivery model

### Parallel Opportunities

- Setup tasks `T003-T005` can run in parallel
- Foundational tasks `T007-T013` can run in parallel
- Seeded language vendoring tasks `T029-T033` can run in parallel
- Style guide tasks `T042-T044` can run in parallel
- Seeded language doc promotion tasks `T046-T048` can run in parallel
- Release validation tasks `T056-T061` can run in parallel once their required content exists

---

## Parallel Example: User Story 2

```bash
# Import seeded language archives together:
Task: "Vendor the full TypeScript seeded archive into knowledge-bases/seeded/typescript/"
Task: "Vendor the full Java seeded archive into knowledge-bases/seeded/java/"
Task: "Vendor the full .NET seeded archive into knowledge-bases/seeded/dotnet/"
Task: "Vendor the full Lua seeded archive into knowledge-bases/seeded/lua/"
Task: "Vendor the full PowerShell seeded archive into knowledge-bases/seeded/powershell/"
```

## Parallel Example: User Story 3

```bash
# Build documentation standards and seeded language docs in parallel:
Task: "Create the command documentation style guide in docs/style-guides/command-style-guide.md"
Task: "Create the agent documentation style guide in docs/style-guides/agent-style-guide.md"
Task: "Create the rule documentation style guide in docs/style-guides/rule-style-guide.md"
Task: "Promote seeded TypeScript and Java knowledge into docs/catalog/languages/typescript.md and docs/catalog/languages/java.md"
Task: "Promote seeded .NET and Lua knowledge into docs/catalog/languages/dotnet.md and docs/catalog/languages/lua.md"
```

## Parallel Example: User Story 4

```bash
# Build release gates together once content surfaces are in place:
Task: "Implement content metadata validation in scripts/ci/validate-content-metadata.mjs"
Task: "Implement seeded knowledge file coverage validation in scripts/ci/validate-seeded-knowledge-coverage.mjs"
Task: "Implement generated-source drift validation in scripts/ci/validate-generated-sync.mjs"
Task: "Implement hidden and target-scoped package surface validation in scripts/ci/validate-packed-install-surface.mjs"
Task: "Implement docs, validator, and seeded-content release smoke checks in scripts/ci/release-smoke.mjs"
```

## Implementation Strategy

### MVP First

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. Complete Phase 4: User Story 2
5. **STOP and VALIDATE**: Confirm the front door docs and file-level seeded package inclusion both work

### Incremental Delivery

1. Complete Setup + Foundational → foundation ready
2. Add User Story 1 → validate docs front door
3. Add User Story 2 → validate seeded archive inclusion and validator bundle completeness
4. Add User Story 3 → validate content contracts and language-pack trustworthiness
5. Add User Story 4 → validate pre-release drift and package gates

### Parallel Team Strategy

With multiple contributors:

1. One contributor completes Setup + Foundational
2. After Phase 2:
   - Contributor A: User Story 1
   - Contributor B: User Story 2
3. After seeded content is imported:
   - Contributor C: User Story 3
4. After core content surfaces stabilize:
   - Contributor D: User Story 4
5. Final pass: Phase 7 polish and quickstart validation

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] labels map each task to a specific user story for traceability
- The clarified seeded-file inclusion requirement is encoded directly into User Story 2 and User Story 4 tasks
- The recommended MVP scope for this feature is **User Story 1 + User Story 2**, because front-door docs without guaranteed seeded knowledge inclusion would not satisfy the clarified package requirement
