# Implementation Plan: Harness Forge AIO v2 Runtime Refactor

**Branch**: `007-aio-v2-runtime-refactor` | **Date**: `2026-03-27` | **Spec**: [spec.md](D:/Workspace/repos/harness-forge/specs/007-aio-v2-runtime-refactor/spec.md)  
**Input**: Feature specification from `D:/Workspace/repos/harness-forge/specs/007-aio-v2-runtime-refactor/spec.md`

## Summary

Refactor Harness Forge from a root-visible AI content pack into a hidden,
local-first AI layer rooted under `.hforge/`. The plan centers on four linked
outcomes:

1. Move the canonical AI operating layer under `.hforge/` so skills, rules,
   knowledge, templates, runtime artifacts, task packs, and compact memory are
   clearly separated from application source code.
2. Keep root and target-native files as thin discovery bridges that tell
   Codex, Claude Code, and other supported runtimes how to find the hidden
   authoritative layer.
3. Preserve one cross-agent system of record for repo intelligence, task
   preparation, working memory, and exports instead of allowing per-target
   drift.
4. Make the default lifecycle local-first and low-noise, so product repos stay
   clean while operators can still refresh, inspect, and intentionally share
   selected AI outputs.

The central design choice is that `.hforge/` becomes the canonical AI layer,
while visible repo-root surfaces become navigational bridges rather than the
primary knowledge library.

## Technical Context

**Language/Version**: TypeScript 5.x on Node.js 22 LTS for CLI, planning, and
validation surfaces; Markdown, JSON, YAML, and PowerShell helper surfaces for
packaged artifacts  
**Primary Dependencies**: Existing Harness Forge package model from
`package.json`, install planning and apply flows in `src/application/install/`,
target adapters under `targets/`, manifest catalogs, docs, and current
`.hforge/` runtime/state surfaces  
**Storage**: Hidden AI layer under `.hforge/`, including planned canonical
surfaces such as `.hforge/library/skills/`, `.hforge/library/rules/`,
`.hforge/library/knowledge/`, `.hforge/templates/`, `.hforge/runtime/`,
`.hforge/tasks/`, `.hforge/cache/`, `.hforge/exports/`, `.hforge/state/`, and
`.hforge/generated/`, plus thin repo-root and target-native bridges  
**Testing**: Contract and integration tests, manifest/runtime consistency,
docs and command alignment checks, package-surface validation, target-adapter
contract coverage, and release validation  
**Target Platform**: Installed local AI support layer inside ordinary product
repositories for Codex, Claude Code, and thinner portability targets  
**Project Type**: Packaged AI repo runtime with install/bootstrap, refresh,
task-preparation, export, and maintenance flows  
**Performance Goals**: Keep installs and refreshes practical for real repos,
avoid scanning or materializing unnecessary visible root content, and make task
context preparation focused enough to reduce prompt waste  
**Constraints**: `.hforge/` is the canonical AI layer; visible bridges must
remain thin; default lifecycle is local-first; product code and AI-layer
content must stay distinguishable; target support differences must stay honest;
exports and bridges must not become second sources of truth  
**Scale/Scope**: Repo-wide refactor touching install layout, manifests, target
bridges, docs, validation, task-pack storage, working memory, export behavior,
and migration strategy from the current root-exposed model

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Start from a spec because this work changes repo layout semantics, install
  behavior, target bridges, version-control expectations, and generated
  artifacts across many surfaces.
- Keep planning tied to validation and user-visible repo cleanliness, not only
  internal implementation detail.
- Prefer small, reversible checkpoints by separating hidden-layer containment,
  bridge rewiring, hidden task/runtime flows, and migration cleanup.

**Initial Constitution Check**: PASS

## Project Structure

### Documentation (this feature)

```text
specs/007-aio-v2-runtime-refactor/
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
`-- contracts/
    |-- shared-runtime-contract.md
    |-- discovery-bridge-contract.md
    |-- task-pack-contract.md
    |-- working-memory-contract.md
    |-- repo-intelligence-freshness-contract.md
    `-- visibility-policy-contract.md
```

### Source Code (anticipated touch points)

```text
src/application/install/
src/application/runtime/
src/application/flow/
src/application/maintenance/
src/domain/operations/
src/domain/state/
src/domain/intelligence/
src/domain/targets/
src/shared/
targets/
manifests/
docs/
templates/
tests/
.hforge/
```

**Structure Decision**: Move canonical AI content into typed hidden `.hforge/`
surfaces, keep only thin root and target-native discovery bridges visible, and
protect the new boundary with explicit visibility, bridge, and runtime
contracts instead of relying on convention alone.

## Architecture Overview

### 1. Hidden AI Layer Root

`.hforge/` becomes the authoritative AI layer for an installed repo. It
contains the durable knowledge library, task artifacts, runtime summaries,
cache surfaces, exports, and generated support outputs needed for agentic
development. Humans can inspect it when needed, but it is not presented as part
of the application's normal source tree.

### 2. Typed Hidden Surfaces

The hidden layer is split into typed surfaces so the lifecycle remains clear:

- `.hforge/library/skills/` for canonical skill contracts and deeper
  references
- `.hforge/library/rules/` for common and language-specific guidance
- `.hforge/library/knowledge/` for seeded or structured knowledge packs
- `.hforge/templates/` for reusable task and workflow templates
- `.hforge/runtime/` for repo intelligence, support metadata, and runtime
  summaries
- `.hforge/tasks/` for active and durable task-pack outputs
- `.hforge/cache/` for compact short-term working memory
- `.hforge/exports/` for portable review and handoff bundles
- `.hforge/state/` and `.hforge/generated/` for install state, guidance, and
  generated helper catalogs

### 3. Thin Root and Target Bridges

Repo-root and target-native surfaces such as `AGENTS.md`, `.agents/skills/`,
`.codex/`, and `.claude/` remain visible only because the runtimes inspect
them. Their role is to direct agents into `.hforge/`, explain which hidden
surfaces are authoritative, and honestly describe target-specific limitations.

### 4. Hidden Runtime, Task Packs, and Working Memory

Repo intelligence, task packs, implementation notes, and compact working
memory all live in the hidden layer. This preserves practical operator value
while keeping the application repo root from turning into an AI-only content
library.

### 5. Local-First Sharing Model

The default lifecycle treats the hidden AI layer as local operational content.
Users can intentionally share thin bridges or export bundles, but the whole
canonical hidden layer is not forced into ordinary version-control review by
default.

### 6. Migration and Compatibility Strategy

The refactor migrates from the current root-exposed content model in phases:

- establish the hidden canonical layer
- rewire bridges and target adapters to reference it
- keep temporary compatibility behavior only where required for migration
- remove or de-emphasize root-visible canonical content once hidden-layer
  discovery is stable

## Phase 0 Research Focus

Phase 0 resolves the main design choices behind the hidden AI-layer model:

- make `.hforge/` the canonical AI layer instead of using root-visible
  `skills/`, `rules/`, and `knowledge-bases/` as the primary install target
- define a hidden layout that separates durable knowledge, task artifacts,
  cache, exports, and generated support files
- define how root and target-native bridge files stay visible but thin
- define local-first version-control behavior and the boundary between hidden
  canonical state and intentionally shared artifacts
- decide how task packs, rules, working memory, and refresh behavior fit inside
  the hidden AI layer without creating new duplication
- define the migration path from the current exposed layout to the contained
  layout without losing target compatibility

See [research.md](D:/Workspace/repos/harness-forge/specs/007-aio-v2-runtime-refactor/research.md) for outcomes.

## Phase 1 Design Focus

Phase 1 turns those decisions into durable design artifacts:

- define entities for AI-layer root, visibility policy, discovery bridges,
  hidden knowledge surfaces, repo-intelligence artifacts, task packs, working
  memory, exports, and compatibility profiles
- define contracts for the hidden shared runtime, bridges, task packs, working
  memory, repo-intelligence freshness, and visibility policy
- define a quickstart that validates repo cleanliness, hidden-layer authority,
  bridge discoverability, local-first lifecycle behavior, and export flows
- keep all new design artifacts under `specs/007...` because the repo’s helper
  scripts still point at stale `.specify/features` state

See [data-model.md](D:/Workspace/repos/harness-forge/specs/007-aio-v2-runtime-refactor/data-model.md), [quickstart.md](D:/Workspace/repos/harness-forge/specs/007-aio-v2-runtime-refactor/quickstart.md), and the [contracts](D:/Workspace/repos/harness-forge/specs/007-aio-v2-runtime-refactor/contracts) directory.

## Post-Design Constitution Check

- The plan remains spec-driven and tied to a concrete user-visible outcome:
  keeping application repos clean while preserving strong AI support.
- Design artifacts define how validation will protect the hidden-layer
  boundary, bridge honesty, and local-first behavior.
- The work is phased to make the migration from the current root-exposed model
  reversible and auditable.

**Post-Design Constitution Check**: PASS

## Complexity Tracking

| Complexity | Why It Exists | Simpler Option Rejected Because |
|------------|---------------|---------------------------------|
| Hidden `.hforge/` AI layer plus visible bridges | Runtimes still need visible entrypoints, but canonical AI content should not pollute product repo roots | Keeping all canonical content visible at the root confuses product code with AI support assets |
| Typed hidden surfaces for library, runtime, tasks, cache, and exports | Different AI artifacts have different lifecycle, trust, and sharing rules | Using one undifferentiated hidden folder would make authority and cleanup hard to reason about |
| Local-first default with intentional sharing | Product repos often want private AI assistance by default, but still need collaboration and handoff paths | Committing the full AI layer by default would create review noise and accidental coupling |
| Migration from root-exposed to hidden canonical content | Existing manifests, adapters, docs, and tests already assume visible root content | A flag-day switch would create too much breakage across the current package model |
| Export bundles distinct from the hidden runtime | Teams need handoff artifacts without making the whole AI layer visible | Treating exports as the canonical runtime would create stale second sources of truth |
