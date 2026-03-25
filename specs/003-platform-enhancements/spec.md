# Feature Specification: Harness Forge Platform Depth, Intelligence, and Runtime Maturity

**Feature Branch**: `003-platform-enhancements`  
**Created**: 2026-03-25  
**Status**: Draft  
**Input**: User description: "Create specification from the attached Harness Forge enhancement requirements."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Install a Deep, Operationally Useful Harness (Priority: P1)

As an engineering user installing Harness Forge for real project work, I want
the shipped language packs, skills, and workflows to contain substantive
guidance rather than thin placeholders, so the installed harness changes the
quality of agent behavior in practice.

**Why this priority**: The current platform already has a strong structural
backbone. The biggest value gap is depth and operational usefulness after
installation.

**Independent Test**: Install a supported language pack and confirm it exposes
substantive language guidance, multiple real examples, at least one
language-aware workflow, and at least one skill with clear activation,
execution, validation, and escalation behavior.

**Acceptance Scenarios**:

1. **Given** a user installs a first-class language pack, **When** they inspect
   its docs, rules, skills, and workflows, **Then** they find enough actionable
   depth to guide implementation and review work without falling back to generic
   assistant behavior.
2. **Given** a user opens a shipped language skill from a cold start, **When**
   they follow it, **Then** it tells them when to use it, what sources to load,
   what order to follow, what output to produce, and when to escalate.
3. **Given** a user installs a structured pack, **When** they review its
   examples, **Then** the examples represent real repository situations rather
   than placeholder or purely illustrative content.

---

### User Story 2 - Receive Adaptive Recommendations for the Current Repository (Priority: P1)

As a user onboarding Harness Forge into an unfamiliar repository, I want the
system to inspect the repository and recommend the right bundles, skills,
profiles, and validation surfaces with evidence, so setup is fast and grounded
in the actual repo rather than guesswork.

**Why this priority**: Recommendation quality is a major multiplier. The system
should adapt to the repo’s real role, framework, risk, and maturity rather than
rely mainly on file extensions.

**Independent Test**: Point the system at several representative repositories
and confirm it identifies the dominant repo characteristics, emits ranked
recommendations with evidence, and differentiates framework-level contexts from
generic language-only contexts.

**Acceptance Scenarios**:

1. **Given** a repository with a recognizable framework and test stack,
   **When** recommendation runs, **Then** the system identifies those signals
   and explains why the recommended bundles, skills, and profiles are relevant.
2. **Given** a repository whose language alone is not enough to describe the
   workload, **When** recommendation runs, **Then** the system accounts for repo
   role, build system, deployment surface, and risk signals before advising the
   user.
3. **Given** a repository that has changed over time, **When** the user asks for
   updated guidance, **Then** the system can suggest newly relevant bundles,
   validations, or maintenance actions instead of reusing stale assumptions.

---

### User Story 3 - Use High-Signal Workload and Flow Orchestration Surfaces (Priority: P1)

As a user performing higher-order engineering work such as onboarding, release
readiness, incident triage, migration review, or complex spec-driven delivery,
I want Harness Forge to provide workload-specific skills and a stateful flow
surface, so agents can follow consistent operating models instead of ad hoc
prompting.

**Why this priority**: The next leap in usefulness comes from workflow-rich,
artifact-producing behavior rather than more generic files.

**Independent Test**: Trigger core workload skills and the Speckit flow system
from a cold start and confirm each one produces a consistent artifact, records
its progress, and exposes the current step, blockers, and next action.

**Acceptance Scenarios**:

1. **Given** a user starts a complex multi-step delivery flow, **When** they
   enter at any stage, **Then** they can see the current state, the latest
   artifact, open blockers, and the next recommended command or action.
2. **Given** a user invokes an upgraded operational skill such as onboarding,
   security review, or release readiness, **When** the skill runs, **Then** it
   produces a structured output contract rather than a loose suggestion list.
3. **Given** a user needs a cross-language workload skill, **When** they invoke
   it, **Then** it works across multiple stacks and includes failure-handling
   guidance when the repo state is incomplete or risky.

---

### User Story 4 - Operate, Validate, and Evolve the Harness Safely Over Time (Priority: P2)

As a maintainer of Harness Forge or a long-lived harness installation, I want
quality gates, lifecycle commands, compatibility reporting, and optional local
observability, so I can detect drift, maintain support claims honestly, and
improve the platform using evidence instead of intuition.

**Why this priority**: Harness Forge is positioned as a platform, not a one-time
install. It needs lifecycle safety, compatibility clarity, and measurable
effectiveness.

**Independent Test**: Run the maintenance and validation surfaces against a
release candidate and installed workspace, then confirm the system can detect
shallow content, drift, incompatibilities, stale surfaces, and support gaps
before release or upgrade.

**Acceptance Scenarios**:

1. **Given** a release candidate contains placeholder-grade content, broken
   references, or unsupported support claims, **When** validation runs,
   **Then** the release is blocked with actionable diagnostics.
2. **Given** an installed workspace drifts from the intended package surface,
   **When** lifecycle inspection runs, **Then** the user can see what is stale,
   what is missing, what changed, and what action is recommended.
3. **Given** maintainers want to understand which surfaces help or fail most
   often, **When** optional local observability is enabled, **Then** they can
   inspect usage, failure categories, and effectiveness trends without relying
   on external telemetry.

---

### Edge Cases

- A structured language pack technically exists but remains too shallow to be
  operationally useful.
- A repo mixes multiple languages and frameworks, making extension-only
  detection misleading.
- A target is nominally supported but lacks parity in runtime behavior,
  hook behavior, or lifecycle ownership.
- A profile claims to represent an operating mode but does not materially alter
  behavior after installation.
- A workload skill can be discovered but lacks deterministic outputs from a cold
  start.
- Installed workspace files drift from the package surface after upgrades,
  repairs, or partial manual edits.
- A framework pack exists without enough detection signals to distinguish it
  from a generic language pack.
- Optional diagnostic tracking is enabled in a way that would surprise users if
  it were not clearly local-first and opt-in.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The platform MUST deepen every first-class structured language
  pack so it provides substantive guidance, multiple real examples, at least one
  language-aware workflow, and at least one operational skill.
- **FR-002**: Structured language packs MUST explain architecture norms, testing
  expectations, common failure modes, operational pitfalls, and review guidance
  in a way that materially improves agent behavior.
- **FR-003**: No first-class structured language pack may rely on placeholder
  wording or placeholder-grade primary examples as its main example surface.
- **FR-004**: The platform MUST upgrade the current generic skills that are
  intended to support onboarding, security review, release readiness,
  documentation lookup, and architecture decision capture into detailed,
  artifact-producing operational skills.
- **FR-005**: Each substantial skill MUST define trigger conditions, the first
  repo signals to inspect, prioritization logic, step-by-step execution flow,
  required outputs, failure conditions, and escalation guidance.
- **FR-006**: The platform MUST add workload-specialized skills for cross-stack
  engineering tasks such as incident response, upgrade safety, performance
  investigation, test strategy, API contract review, migration review, pull
  request triage, observability setup, and modernization.
- **FR-007**: Each workload-specialized skill MUST be usable across more than
  one language or stack and MUST include at least one concrete output contract
  and one failure-handling path.
- **FR-008**: The platform MUST provide a repo-intelligence capability that
  infers dominant repo characteristics beyond file extensions, including repo
  role, framework signals, build signals, test signals, deployment signals,
  documentation maturity, and risk-sensitive surfaces.
- **FR-009**: Recommendation outputs MUST include evidence and confidence for
  bundles, profiles, skills, and missing validation surfaces rather than
  returning an unexplained list.
- **FR-010**: The recommendation system MUST distinguish framework-level
  repositories from generic language-only repositories when sufficient evidence
  exists.
- **FR-011**: Speckit MUST expose a coherent end-to-end flow model across the
  major spec, planning, analysis, implementation, and checklist stages so users
  can understand current state and next action.
- **FR-012**: The flow system MUST preserve artifact lineage between generated
  specifications, plans, tasks, implementation steps, and exported work items.
- **FR-013**: Users MUST be able to recover the current flow state even when
  they enter the process midstream.
- **FR-014**: The platform MUST add framework packs as first-class surfaces for
  the major supported language ecosystems, with detection guidance, review
  deltas, example scenarios, and clear loading order.
- **FR-015**: The platform MUST treat hooks as a typed, manifest-driven runtime
  subsystem with clear compatibility, execution semantics, and diagnosable
  failure behavior.
- **FR-016**: The platform MUST elevate profiles into real operating modes that
  materially affect installed behavior, validation strictness, skill emphasis,
  and review depth.
- **FR-017**: Quality gates MUST validate not only package assembly but also
  content usefulness, placeholder absence, reference integrity, compatibility
  completeness, and drift between documented and shipped behavior.
- **FR-018**: The platform MUST provide a repeatable knowledge-ingestion and
  normalization model so adding or evolving packs does not depend on bespoke
  manual work.
- **FR-019**: The platform MUST support optional local-first observability that
  records which bundles, skills, hooks, workflows, and validation surfaces are
  used and where failures occur.
- **FR-020**: Any observability surface MUST be opt-in and MUST not require
  external transmission to be useful.
- **FR-021**: The platform MUST provide stateful maintenance capabilities for
  install inspection, health diagnosis, drift review, recommendation refresh,
  surface repair, and safe removal of no-longer-needed content.
- **FR-022**: Cross-target support claims MUST reflect actual runtime maturity,
  and targets with thinner behavior MUST be clearly identified as limited rather
  than silently treated as fully equivalent.
- **FR-023**: The platform MUST expose a machine-readable compatibility view
  covering target, bundle, hook, skill, profile, workflow, language, and
  framework relationships.
- **FR-024**: The platform MUST provide realistic scenario or benchmark
  repositories so recommendation quality, skill quality, and workflow quality
  can be regression-tested against representative repo types.
- **FR-025**: The platform MUST support a learning loop that helps maintainers
  turn recurring misses, defect classes, false positives, and missing surfaces
  into candidate improvements for rules, skills, hooks, and packs.
- **FR-026**: Every top-level capability added by this feature MUST be
  documented in a front-door surface that explains what it is, why it exists,
  when to use it, how it behaves across targets, and how it is validated.

### Key Entities *(include if feature involves data)*

- **Structured Language Pack**: A first-class language-specific guidance unit
  containing rules, examples, review guidance, workflows, and skills.
- **Operational Skill**: A reusable capability with explicit activation logic,
  repo inspection order, deterministic output contract, and failure handling.
- **Workload Skill**: A cross-language operational skill centered on a recurring
  engineering task rather than a programming language.
- **Repo Intelligence Result**: The evidence-backed description of repository
  characteristics, recommended surfaces, and confidence signals.
- **Framework Pack**: A framework-specific extension of a language pack that
  adds detection signals, architecture norms, and review deltas.
- **Flow State**: The recoverable representation of the current orchestration
  stage, latest artifact, blockers, and next expected action.
- **Hook Manifest**: A typed description of a hook’s compatibility, trigger,
  execution semantics, and diagnostics behavior.
- **Operating Profile**: A curated behavior mode that changes bundle emphasis,
  skill selection, validation strictness, and runtime guidance.
- **Compatibility Matrix**: A machine-readable map of which surfaces are
  supported, limited, or incompatible across targets and pack combinations.
- **Maintenance State**: The inspectable record of installed surfaces, drift,
  stale content, recommendations, and repair opportunities.
- **Effectiveness Signal**: A local-first usage or failure observation that
  helps maintainers understand which shipped surfaces provide value.

## Quality & Architecture Constraints *(mandatory)*

- **QC-001**: The design MUST strengthen semantic depth without collapsing the
  existing separation between packaged assets, runtime surfaces, target
  adapters, and validation contracts.
- **QC-002**: New skills, packs, hooks, profiles, and flow surfaces MUST follow
  a single authoring contract per content type rather than introducing multiple
  parallel conventions.
- **QC-003**: New support claims for targets, frameworks, or operating modes
  MUST be evidence-backed and fail-safe when depth is not yet sufficient.
- **QC-004**: Validation for this feature MUST treat placeholder-grade content,
  shallow operational surfaces, broken references, and compatibility drift as
  release-blocking quality failures.
- **QC-005**: Adaptive behavior and observability MUST remain understandable,
  inspectable, and locally diagnosable by maintainers without hidden
  auto-mutation.
- **QC-006**: Speckit flow orchestration MUST remain recoverable and traceable
  across generated artifacts and lifecycle stages.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every first-class structured language pack in scope for this
  feature exposes substantive guidance, multiple real examples, at least one
  operational skill, and at least one language-aware workflow before release.
- **SC-002**: Recommendation output for benchmark repositories includes evidence
  and confidence for the top recommendations and correctly distinguishes
  framework-specific repos from generic language-only repos in the majority of
  tested scenarios.
- **SC-003**: Core operational skills in scope for this feature can produce
  their promised artifact from a cold start without requiring the user to invent
  the workflow on the fly.
- **SC-004**: Users can recover the current orchestration stage, latest
  generated artifact, blockers, and next recommended action for an active flow
  without manual reconstruction.
- **SC-005**: Release validation blocks shipment whenever critical content is
  placeholder-grade, compatibility claims drift from shipped behavior, or a
  required operational surface is too shallow to meet its contract.
- **SC-006**: Maintainers can inspect local usage, failure, drift, and support
  signals well enough to identify the highest-value improvement candidates for a
  future release.

## Assumptions

- The current platform architecture, package surface model, and target-adapter
  model remain the foundation; this feature focuses on deepening content,
  intelligence, orchestration, lifecycle, and evidence.
- Existing first-class target support for Codex and Claude Code remains the
  strongest runtime baseline, while other harnesses may require explicit limited
  support treatment where parity is not yet real.
- The enhancement requirements describe one strategic feature program that can
  still be implemented in waves under a single specification and later broken
  into executable tasks.
- Benchmark and scenario repositories are treated as product validation assets,
  not just optional internal fixtures, because they are needed to prove
  recommendation and skill quality.
- Local-first observability is acceptable so long as it remains opt-in,
  inspectable, and non-surprising to maintainers and end users.
