# Phase 0 Research: Harness Forge Platform Depth, Intelligence, and Runtime Maturity

## Decision 1: Preserve the current package architecture and deepen it instead of introducing a new platform layer

**Decision**: Keep the existing TypeScript CLI, manifest-driven packaging, and
published content surfaces as the system backbone. Add new capabilities by
deepening existing surfaces (`skills/`, `.agents/skills/`, `rules/`,
`templates/workflows/`, `manifests/`, `scripts/`, `docs/`) rather than
introducing a parallel platform format.

**Rationale**: The current repo is already shaped like a small platform with
install planning, target adapters, manifest contracts, and shipped knowledge
surfaces. The gap described by the requirements is depth and operational
richness, not the absence of a core architecture.

**Alternatives considered**:

- Build a new runtime layer separate from the current content surfaces:
  rejected because it would increase migration cost and duplicate existing
  capabilities.
- Replace existing skills and rules with a single unified prompt system:
  rejected because the repo already depends on separate discovery surfaces and
  package contracts.

## Decision 2: Model repo intelligence as an evidence pipeline, not a single recommendation heuristic

**Decision**: Split repo intelligence into three stages: raw scan,
framework/workload detection, and evidence-backed recommendation scoring. Keep
evidence visible in both JSON and human-readable output.

**Rationale**: The requirements emphasize that recommendation quality must move
from extension-driven guesses to repo-aware reasoning. A staged pipeline keeps
the evidence inspectable and lets maintainers debug why a recommendation
appeared.

**Alternatives considered**:

- Add more extension heuristics to the current recommendation logic:
  rejected because it would still hide reasoning and remain too shallow.
- Store only the final bundle list:
  rejected because users and maintainers need confidence and justification.

## Decision 3: Treat workload skills as operational contracts with required artifacts

**Decision**: Every upgraded or newly added workload skill must define a stable
output contract, trigger conditions, repo signals to inspect first, explicit
failure modes, and escalation behavior. Supporting references live alongside the
skill where depth is needed.

**Rationale**: The main criticism in the requirements is that several current
skills read like short prompts rather than reusable operating systems. Required
artifact contracts are the simplest way to force deterministic value.

**Alternatives considered**:

- Keep skills as short wrappers and rely on general agent reasoning:
  rejected because it does not materially change behavior under pressure.
- Make skills entirely script-driven:
  rejected because many skills are judgment-heavy and need guided reasoning with
  optional helper scripts.

## Decision 4: Use flow state as the canonical recovery surface for Speckit

**Decision**: Represent active Speckit progress as a small, local state record
with explicit stage, latest artifact, blockers, next command, and artifact
lineage. Expose it through both docs and CLI/runtime surfaces.

**Rationale**: The requirements call out that Speckit should feel like the
actual orchestration spine, and users must be able to re-enter at any stage.
That requires durable state, not only a folder full of artifacts.

**Alternatives considered**:

- Infer current stage only from file timestamps:
  rejected because it is ambiguous and fragile.
- Store only a human-readable note:
  rejected because maintainers and scripts both need a machine-readable state.

## Decision 5: Treat hooks as governed runtime policies, not target-specific glue alone

**Decision**: Introduce typed hook manifests with target compatibility,
execution semantics, timeout/failure policy, and observability fields. Allow
targets to mark hooks as supported, emulated, or unsupported.

**Rationale**: Hooks already exist conceptually, but the requirements make it
clear that they need first-class runtime ownership, predictable policy, and
clear parity boundaries across harnesses.

**Alternatives considered**:

- Keep hooks as undocumented target-specific scripts:
  rejected because parity and failure semantics stay opaque.
- Standardize only the docs, not the runtime metadata:
  rejected because install and validation behavior would still drift.

## Decision 6: Profiles must become behavioral overlays, not labels

**Decision**: Profiles will define default bundles, preferred skills,
recommended hooks, validation strictness, review depth, and risk posture, and
they must visibly change the installed guidance surface.

**Rationale**: The requirements explicitly call out that current profiles are
too lightweight. Making them behavioral overlays ensures they have observable
value and can be validated.

**Alternatives considered**:

- Keep profiles as named bundle groups only:
  rejected because it does not materially alter behavior.
- Collapse profiles into recommendations only:
  rejected because users need stable operating modes they can choose
  intentionally.

## Decision 7: Observability should be local-first, opt-in, and diagnostic rather than analytics-oriented

**Decision**: Record effectiveness signals locally, focusing on bundle usage,
skill invocation, hook execution, validation failures, recommendation
acceptance, and target mix. Do not require any external service or transmission
for the feature to be useful.

**Rationale**: The requirements want measurable improvement but also explicitly
call for local-first privacy. Diagnostics-oriented observability satisfies both.

**Alternatives considered**:

- No observability:
  rejected because maintainers would still optimize from memory and anecdote.
- Cloud-first telemetry:
  rejected because it violates the local-first privacy direction.

## Decision 8: Benchmark repos are product validation assets, not optional internal tests

**Decision**: Add benchmark fixtures for representative repo types and use them
to validate recommendation quality, onboarding quality, release readiness, and
operational-skill behavior as part of regression testing.

**Rationale**: The requirements emphasize that the package should prove value on
real repo archetypes. Fixtures need to be part of the product validation model,
not side experiments.

**Alternatives considered**:

- Use only unit tests over manifest data:
  rejected because they cannot prove recommendation quality or artifact quality.
- Validate manually against ad hoc repos:
  rejected because it is not repeatable enough for regression protection.

## Decision 9: Cross-target parity must be explicit and machine-readable

**Decision**: Generate a compatibility matrix that covers target, bundle, hook,
skill, profile, workflow, language, and framework relationships. Targets with
partial support must be shown as limited rather than treated as equal.

**Rationale**: The requirements explicitly call out uneven target support. A
machine-readable compatibility model is the safest way to keep docs and runtime
claims aligned.

**Alternatives considered**:

- Keep parity described only in docs:
  rejected because it drifts as soon as the system grows.
- Hide partial support behind generic adapters:
  rejected because it produces misleading support claims.
