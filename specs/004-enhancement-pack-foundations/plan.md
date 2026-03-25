# Implementation Plan: Harness Forge Enhancement Pack Foundations

**Branch**: `004-enhancement-pack-foundations` | **Date**: 2026-03-25 | **Spec**: [spec.md](D:/Workspace/repos/harness-forge/specs/004-enhancement-pack-foundations/spec.md)
**Input**: Feature specification from `D:\Workspace\repos\harness-forge\specs\004-enhancement-pack-foundations\spec.md`

## Summary

Turn the enhancement pack into a concrete, contract-driven extension of the
existing Harness Forge platform. This plan delivers four cooperating outcomes:

1. a canonical capability matrix that becomes the single source of truth for
   target support claims,
2. a repo cartography and instruction-synthesis pipeline that emits
   evidence-backed guidance instead of generic heuristics,
3. a local-first observability and evaluation model that measures usefulness,
   drift, and benchmark health,
4. a resumable parallel worktree supervisor that plans safe sharding and blocks
   unsafe merges.

The major design choice is to preserve the current TypeScript/Node CLI,
manifest-driven packaging model, and local state surfaces, while adding sharper
contracts and generated views on top of them. The feature deepens existing
docs, manifests, schemas, scripts, and runtime reporting instead of creating a
separate subsystem.

## Technical Context

**Language/Version**: TypeScript 5.x on Node.js 22 LTS; Markdown, JSON, YAML, PowerShell, and shell for package/runtime surfaces  
**Primary Dependencies**: Existing CLI/runtime stack in [package.json](D:/Workspace/repos/harness-forge/package.json), especially `commander`, `fast-glob`, `yaml`, `zod`, `ajv`, and Vitest  
**Storage**: Repository-managed manifests and docs, `.hforge/observability/`, `.specify/state/`, benchmark fixtures under `tests/fixtures/`, and generated local artifacts under `.hforge/generated/` or equivalent feature outputs  
**Testing**: Vitest contract and integration tests, schema validation, release smoke checks, CLI execution, benchmark-fixture regression checks, and quickstart verification steps  
**Target Platform**: Cross-platform local package/runtime with Codex and Claude Code as the strongest targets, and explicit degraded support for Cursor and OpenCode  
**Project Type**: CLI plus packaged knowledge/runtime governance platform  
**Performance Goals**: Scanning, summary generation, and merge-readiness checks should feel local and deterministic enough for interactive use and CI gating  
**Constraints**: Preserve support honesty; stay local-first; keep generated views traceable to canonical contracts; avoid surprising auto-writes in user repos; fail safe when overlap or confidence is weak  
**Scale/Scope**: Capability taxonomy and matrix, repo map and instruction plan, event and summary model, benchmark expectations, parallel plan/state, release validation, and front-door docs

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- The feature has a user-facing spec, acceptance scenarios, measurable success
  criteria, and explicit quality constraints.
- The plan stays tied to validation and reversible checkpoints rather than
  implementation work alone.
- The design builds on the existing TypeScript CLI and manifest architecture
  instead of introducing a parallel platform without migration value.
- Machine-readable contracts, generated documentation, and runtime reporting are
  all identified up front.
- Complexity is justified where support honesty, provenance, or safe parallel
  execution would otherwise be untestable.

**Gate Result**: PASS

## Project Structure

### Planning Artifacts (this feature)

```text
specs/004-enhancement-pack-foundations/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── contracts/
    ├── capability-matrix-contract.md
    ├── repo-map-contract.md
    ├── instruction-plan-contract.md
    ├── observability-contract.md
    └── parallel-plan-contract.md
```

### Source Code (repository root)

```text
docs/
├── target-support-matrix.md
├── observability.md
├── flow-orchestration.md
└── ...

manifests/
├── catalog/
│   ├── compatibility-matrix.json
│   └── ...
└── hooks/

schemas/
├── manifests/
└── runtime/

scripts/
├── ci/
├── intelligence/
└── runtime/

src/
├── application/
├── cli/
├── domain/
└── infrastructure/

.hforge/observability/
.specify/state/
tests/fixtures/benchmarks/
```

**Structure Decision**: Keep the existing single-project CLI/package layout,
but implement the enhancement pack as five cooperating slices:

- **Capability truth slice**: taxonomy, matrix, support-doc generation, and
  validation
- **Cartography slice**: repo scan, boundary classification, repo map, and
  instruction planning
- **Evidence slice**: raw events, derived summaries, benchmark expectations,
  and reports
- **Parallel execution slice**: strategy scoring, shard plan/state, and
  merge-readiness evaluation
- **Docs and release slice**: front-door documentation, generated support
  surfaces, and release gates that keep all of the above aligned

This keeps contracts explicit and avoids a rewrite.

## Architecture Overview

### 1. Capability Truth Model

- Introduce a canonical capability taxonomy and target-capability matrix that
  capture support level, support mode, evidence, validation metadata,
  confidence, notes, and fallback behavior.
- Treat existing support docs and compatibility views as derived or validated
  outputs, not parallel sources of truth.
- Expose the same capability truth to docs generation, recommendation scoring,
  runtime diagnostics, and release validation.

### 2. Repo Cartography and Instruction Synthesis

- Split repo intelligence into structured outputs:
  - a **repo map** that captures topology, risks, and quality gaps
  - an **instruction plan** that explains which guidance surfaces should exist
    and why
- Keep instruction synthesis target-aware, recommendation-first, and
  provenance-backed.
- Add dry-run and diff-friendly surfaces so users can inspect suggested
  guidance before any write happens.

### 3. Observability and Evaluation

- Extend the current local diagnostic model from coarse effectiveness signals to
  append-safe events plus reproducible summaries and reports.
- Let benchmark fixtures assert not only recommendations but also target
  warnings, instruction scopes, observability signals, and parallelization
  decisions.
- Preserve the current local-first privacy posture by keeping all value in
  inspectable local artifacts.

### 4. Parallel Worktree Supervision

- Add a conservative planning layer that scores whether work is safe to split.
- When sharding is safe, emit a human-inspectable plan with dependencies,
  validation gates, expected artifacts, and merge criteria.
- When sharding is not safe, emit a blocked or single-thread recommendation and
  explain why.
- Keep shard state resumable and integrate it with the broader flow lineage.

### 5. Release and Front-Door Integration

- Update front-door docs so operators can discover capability truth, cartography,
  observability, and parallel planning without reading implementation files.
- Add release checks that fail on support drift, stale generated support docs,
  benchmark expectation drift, or unsafe parallel-planning regressions.

## Phase 0: Research Focus

- Decide how capability truth relates to the existing compatibility matrix and
  target support docs.
- Decide how repo scan output should be split between topology facts and
  instruction recommendations.
- Decide how provenance should be expressed across recommendations and
  synthesized instruction scopes.
- Decide how to evolve `.hforge/observability/effectiveness-signals.json`
  toward richer events and summaries without losing local simplicity.
- Decide how benchmark fixtures should assert support warnings, quality gaps,
  synthesized scopes, and parallelization decisions together.
- Decide how parallel planning and shard state should connect to the existing
  `.specify/state/flow-state.json` recovery model.

## Phase 1: Design Focus

- Define entities for capability taxonomy, capability records, repo maps,
  instruction plans, observability events and summaries, benchmark expectations,
  parallel plans, shard state, and merge-readiness findings.
- Define contracts for canonical capability truth, repo-map output,
  instruction-plan output, observability event/summary output, and parallel
  planning/state.
- Define quickstart validation steps that exercise all four enhancement areas on
  representative fixtures.
- Update agent context with the new runtime concepts without disturbing the
  existing implementation-stage feature flow.

## Post-Design Constitution Check

**Expected Result**: PASS. The feature remains spec-driven, validation-linked,
and reversible. Added complexity is concentrated in explicit contracts and
generated views, which is justified because support honesty, provenance, and
safe parallel execution cannot be verified reliably through ad hoc docs alone.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Canonical capability matrix plus derived support views | Support claims must remain honest across docs, recommendations, and release gates | Hand-maintained docs and manifests drift too easily |
| Separate repo-map and instruction-plan outputs | Facts and guidance have different validation and change rates | A single mixed output would blur topology discovery with editorial recommendations |
| Raw events plus derived summaries | Maintainers need both auditability and readable rollups | A single mutable summary file would be harder to trust or reproduce |
| Conservative parallel supervisor | Unsafe overlap must fail closed, not optimistically | A faster but optimistic planner would damage trust when merges conflict |
