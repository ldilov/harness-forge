# Phase 0 Research: Harness Forge Enhancement Pack Foundations

## Decision 1: Make capability truth the canonical support source and derive support views from it

**Decision**: Introduce a dedicated capability taxonomy and target-capability
matrix as the authoritative source for support claims. Existing support docs and
compatibility views should be generated from, or validated against, that source
instead of operating as parallel truth surfaces.

**Rationale**: The repo already has
[docs/target-support-matrix.md](D:/Workspace/repos/harness-forge/docs/target-support-matrix.md)
and
[manifests/catalog/compatibility-matrix.json](D:/Workspace/repos/harness-forge/manifests/catalog/compatibility-matrix.json),
but the enhancement pack requires deeper modeling of capability families,
support modes, fallback behavior, and confidence. Treating capability truth as
canonical is the cleanest way to keep docs, recommendations, and release gates
aligned.

**Alternatives considered**:

- Keep extending the existing compatibility matrix only:
  rejected because it is too broad and relationship-oriented to serve as the
  best canonical surface for evidence-backed target-capability truth.
- Keep support details primarily in docs:
  rejected because narrative tables drift faster than machine-checked contracts.

## Decision 2: Require evidence, confidence, and fallback behavior on every degraded support claim

**Decision**: Every target-capability record must carry evidence, confidence,
validation metadata, and fallback behavior whenever the support is not native
and complete.

**Rationale**: The enhancement pack is explicit that partial parity must stay
honest. Without confidence and fallback behavior, "partial" becomes a vague
label that does not help installation, recommendation, or operator decisions.

**Alternatives considered**:

- Store only support level and notes:
  rejected because it is too weak for automated validation and recommendation
  downgrading.
- Add confidence only to recommendations, not support records:
  rejected because support truth itself needs to be auditable.

## Decision 3: Split cartography into repo facts and instruction recommendations

**Decision**: Treat repo cartography as two related outputs:

- a **repo map** for stable, evidence-backed topology facts
- an **instruction plan** for target-aware guidance recommendations

**Rationale**: Repo structure and guidance intent change at different rates.
Keeping them separate makes the facts benchmarkable and the recommendations
reviewable without forcing guidance changes every time a factual scan output
changes slightly.

**Alternatives considered**:

- Emit a single mixed report:
  rejected because it would blur observation with advice.
- Write instruction files directly during scan:
  rejected because it makes review and rollback harder.

## Decision 4: Make instruction synthesis recommendation-first and conservative

**Decision**: Instruction synthesis should default to dry-run and diff-friendly
recommendations, and it should only justify scoped instruction surfaces when
the maintenance value is high enough.

**Rationale**: The requirements warn against instruction bloat. The system is
more trustworthy when it explains why a scope is recommended before writing
files, especially in mixed-language or security-sensitive repos.

**Alternatives considered**:

- Aggressively generate nested instruction files by default:
  rejected because it would create noise and maintenance debt.
- Restrict synthesis to root-only guidance:
  rejected because some repos genuinely need scoped guidance.

## Decision 5: Evolve observability from one coarse local signal file to append-safe events plus derived summaries

**Decision**: Keep observability local-first, but expand it into two layers:

- raw, append-safe events for auditability
- derived summaries and reports for operator readability

The current
[.hforge/observability/effectiveness-signals.json](D:/Workspace/repos/harness-forge/.hforge/observability/effectiveness-signals.json)
becomes a compatibility or seed surface rather than the only observability
artifact.

**Rationale**: The current signal file proves the repo already values local
diagnostics, but the enhancement pack needs richer analysis such as acceptance
rates, drift warnings, benchmark health, and recovery timing. Those are easier
to compute reliably from raw events than from a mutable summary.

**Alternatives considered**:

- Keep a single summary file only:
  rejected because summaries are harder to audit and reproduce.
- Introduce external telemetry:
  rejected because it conflicts with the local-first requirement.

## Decision 6: Treat benchmark expectations as cross-cutting product contracts

**Decision**: Benchmark fixtures should assert repo-map facts, recommendations,
target warnings, instruction scopes, observability events, and parallelization
decisions together, not in isolated test silos.

**Rationale**: The enhancement pack ties support honesty, recommendations,
evaluation quality, and parallel planning together. Cross-cutting expectations
are the best way to catch regressions that look acceptable in one subsystem but
break the overall experience.

**Alternatives considered**:

- Keep fixture expectations recommendation-only:
  rejected because it would miss target-drift and planning regressions.
- Test each subsystem independently without shared fixtures:
  rejected because integration failures would escape too easily.

## Decision 7: Make the parallel supervisor fail safe by default

**Decision**: The parallel planner must prefer a blocked or single-threaded
recommendation whenever overlap risk, migration risk, config risk, or target
support maturity is unclear.

**Rationale**: The enhancement pack frames parallelism as a trust problem, not
just a throughput problem. Users will trust the feature only if it avoids
unsafe optimism.

**Alternatives considered**:

- Bias toward splitting whenever any shard boundary exists:
  rejected because merge chaos is costlier than a conservative no-split.
- Leave safety checks to final merge only:
  rejected because the plan itself should guide whether splitting is worth it.

## Decision 8: Integrate parallel state with existing flow recovery instead of creating a separate orchestration silo

**Decision**: Keep `.specify/state/flow-state.json` as the main re-entry
surface, and link parallel plan/state artifacts into that lineage instead of
creating a disconnected supervisor-only recovery model.

**Rationale**: The repo already treats flow state as the primary recovery
surface in
[docs/flow-orchestration.md](D:/Workspace/repos/harness-forge/docs/flow-orchestration.md).
Parallel execution should deepen that model, not compete with it.

**Alternatives considered**:

- Create a separate supervisor state root with its own recovery rules:
  rejected because it would fragment recovery and confuse operators.
- Keep parallel plans entirely ephemeral:
  rejected because interruption recovery is a key feature requirement.
