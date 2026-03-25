# Quickstart: Validate Harness Forge Enhancement Pack Foundations

## Purpose

This quickstart verifies that the enhancement pack produces one honest support
truth source, repo-aware guidance planning, richer local observability, and a
safe parallel work planning surface.

## Prerequisites

- Repository checkout available locally
- Node.js and npm available
- PowerShell available for helper scripts
- Benchmark fixtures present under `tests/fixtures/benchmarks/`

## 1. Generate and validate target capability truth

Example commands:

```bash
node scripts/ci/generate-target-support-docs.mjs
node scripts/ci/validate-capability-matrix.mjs
```

Expected result:

- one canonical capability source drives support documentation
- degraded support claims include explicit fallback behavior
- support drift is detected before release validation passes

## 2. Produce a repo map for a representative fixture

Example commands:

```bash
node scripts/intelligence/cartograph-repo.mjs tests/fixtures/benchmarks/ts-monorepo-web-api --json
node scripts/intelligence/classify-boundaries.mjs tests/fixtures/benchmarks/ts-monorepo-web-api --json
```

Expected result:

- the repo map identifies workspace type, dominant languages, frameworks,
  service boundaries, critical paths, high-risk paths, and quality gaps
- generated or vendor areas do not dominate the recommendation output

## 3. Review instruction synthesis in dry-run and diff modes

Example commands:

```bash
node scripts/intelligence/synthesize-instructions.mjs tests/fixtures/benchmarks/ts-monorepo-web-api --dry-run --json
node scripts/intelligence/synthesize-instructions.mjs tests/fixtures/benchmarks/ts-monorepo-web-api --diff
```

Expected result:

- the system recommends root-only or scoped guidance based on repo shape
- each instruction recommendation includes why it exists, supporting evidence,
  and confidence
- unsupported target surfaces are not presented as native

## 4. Record and summarize local observability

Example commands:

```bash
node scripts/runtime/record-event.mjs --help
node scripts/runtime/summarize-observability.mjs --json
node scripts/runtime/render-observability-report.mjs
```

Expected result:

- local raw events can be summarized into readable reports
- summaries expose recommendation acceptance, benchmark pass rates, drift
  warnings, and flow recovery metrics
- no external service is required to inspect or delete observability data

## 5. Create and inspect a parallel execution plan

Example commands:

```bash
node scripts/runtime/create-parallel-plan.mjs specs/004-enhancement-pack-foundations/tasks.md --json
node scripts/runtime/check-parallel-status.mjs --json
node scripts/runtime/check-merge-readiness.mjs --json
```

Expected result:

- low-overlap work receives a shard plan with validation gates and merge
  criteria
- risky overlap produces a blocked or single-thread recommendation
- merge-readiness output explains exactly why a merge is blocked when it is not
  safe

## 6. Run release validation

Example commands:

```bash
npm run build
npm run test
npm run validate:release
```

Expected result:

- target support drift is caught
- benchmark expectations remain aligned with generated outputs
- unsafe or overstated degraded support is rejected before release

## Ready State

This feature is ready when:

- support documentation is derived from canonical capability truth
- repo cartography and instruction synthesis are deterministic and
  provenance-backed
- local summaries explain whether recommendations and workflows are improving
- parallel planning is resumable and safely blocks risky merges
