# Feature Specification: Harness Forge AIO v2 Runtime Refactor

**Feature Branch**: `007-aio-v2-runtime-refactor`  
**Created**: 2026-03-27  
**Status**: Draft  
**Input**: User description: "My idea is that this should be collection of AI Layer that contains skills, runtime, shortterm memory and rules and etc... But those should not be part of the code imagine u install them to facilitate agentic development in a react web app, why would the react web app has those folders exposed like that in the repo. Maybe they should be in .hforge and at the root directory of the repo we should just reference the resource inside .hforge so that the agents know that .hforge is their knowledge base, runtime, state machine"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Hide the AI Layer Behind Thin Root Bridges (Priority: P1)

As a product-repo maintainer, I want Harness Forge to install its AI operating
layer under `.hforge/` and leave only thin discovery bridges at the repo root,
so the repository still looks like application code rather than a bundle of
AI-only folders.

**Why this priority**: This is the clearest user-facing boundary problem in the
current direction. If a React app or service repo suddenly grows large visible
`skills/`, `rules/`, and `knowledge-bases/` trees, the product code surface
looks polluted and humans can no longer tell what belongs to the app versus the
agent tooling layer.

**Independent Test**: Install Harness Forge into a representative application
repo, inspect the root directory, and confirm that canonical AI content lives
under `.hforge/` while root-visible files are limited to discovery bridges and
target-native entrypoints.

**Acceptance Scenarios**:

1. **Given** a repository equipped with Harness Forge v2, **When** a maintainer
   inspects the root directory, **Then** they see the product code layout plus
   thin bridge files rather than exposed canonical AI content directories.
2. **Given** the same repository contains a hidden AI layer under `.hforge/`,
   **When** a maintainer inspects it, **Then** they can find the authoritative
   skills, rules, knowledge, templates, runtime artifacts, and working-memory
   surfaces there.
3. **Given** the repository is used for ordinary feature work, **When** humans
   review the repo layout, **Then** they can distinguish application code from
   AI-layer content without reading the full hidden runtime.

---

### User Story 2 - Keep One Hidden AI Layer as the Authoritative Cross-Agent Runtime (Priority: P1)

As a Harness Forge maintainer, I want `.hforge/` to be the single system of
record for repo intelligence, task packs, memory, rules, and templates, so
Codex, Claude Code, and adjacent runtimes do not drift into separate knowledge
systems.

**Why this priority**: Hiding the AI layer only helps if it remains coherent.
If the root bridges point to duplicated or partial content, the repo becomes
harder to trust and harder to operate across targets.

**Independent Test**: Inspect the hidden AI layer and supported root or
target-native bridges, then confirm they all reference one canonical runtime
instead of separate per-target knowledge copies.

**Acceptance Scenarios**:

1. **Given** a repository equipped for Codex, **When** the root and
   target-native bridges are inspected, **Then** they clearly route into the
   hidden `.hforge/` AI layer as the authoritative source.
2. **Given** the same repository is used with Claude Code or another supported
   runtime, **When** its discovery surface is inspected, **Then** it points to
   the same hidden AI layer rather than a second canonical library.
3. **Given** a runtime only supports translated or documentation-level
   behavior, **When** maintainers inspect the bridge or support notes, **Then**
   that limitation is visible and not misrepresented as full parity.

---

### User Story 3 - Generate Task Packs, Rules, and Working Memory Inside the Hidden Layer (Priority: P1)

As an operator using Harness Forge to guide coding agents, I want task packs,
rules, implementation notes, and compact working memory to live inside the
hidden AI layer, so the agent gets strong contextual help without turning the
product repo root into a second documentation tree.

**Why this priority**: The AI layer is valuable because it helps agents do real
work. If task guidance stays weak or scattered, hiding the content does not
solve the actual workflow problem.

**Independent Test**: Start representative feature, bugfix, and refactor tasks,
then confirm the hidden AI layer produces a task-specific context packet plus
compact working memory without requiring manual prompt assembly or exposed
root-level knowledge folders.

**Acceptance Scenarios**:

1. **Given** a user starts a new engineering task, **When** Harness Forge
   prepares context, **Then** it stores a task pack inside the hidden AI layer
   with requested outcome, requirements, impacted modules, risks, acceptance
   criteria, and testing implications.
2. **Given** the task spans multiple steps, **When** the user or agent revisits
   it later, **Then** the hidden working-memory surface shows the current
   objective, active plan, confirmed facts, open questions, recent failures,
   and next immediate step without relying on a full transcript.
3. **Given** a rule, constraint, or durable finding becomes stable project
   knowledge, **When** the task is compacted or closed, **Then** that knowledge
   is promoted into the correct long-term hidden artifact instead of remaining
   only in temporary memory.

---

### User Story 4 - Keep the Hidden AI Layer Local-First, Refreshable, and Shareable Without Polluting the Product Repo (Priority: P2)

As a repository owner, I want the hidden AI layer to behave like a local AI
operating substrate that can be refreshed, exported, or selectively shared
without forcing bulky AI-only content into routine application code review, so
the repo stays clean while still supporting collaboration and handoff.

**Why this priority**: Product repositories need a clear lifecycle boundary.
Teams may want local-first AI assistance most of the time, and only share thin
bridges or exported context when it is actually useful.

**Independent Test**: Install, refresh, and export from a representative repo,
then confirm the hidden layer stays authoritative and refreshable while humans
can collaborate through bridges or exports without committing the entire AI
content library by default.

**Acceptance Scenarios**:

1. **Given** a default install into an application repo, **When** version
   control behavior is reviewed, **Then** the hidden AI layer is treated as
   local operational content unless the operator explicitly opts into sharing
   selected surfaces.
2. **Given** the repository changes after initial analysis, **When** the
   refresh flow runs, **Then** the hidden AI layer updates affected knowledge
   and marks stale artifacts accordingly without requiring exposed root
   knowledge copies.
3. **Given** a user needs to hand task context to another person or runtime,
   **When** they export the relevant output, **Then** the export contains the
   essential context without requiring the full hidden AI layer to become part
   of the visible product repo surface.

---

### Edge Cases

- A bridge file remains at the root but points to stale or missing hidden AI
  layer content, leaving the agent with a dead entrypoint.
- A product repo contains strict tooling, bundling, or indexing rules that
  accidentally treat `.hforge/` as product source, generated assets, or build
  input.
- A maintainer manually copies AI-layer content back to the repo root, creating
  two apparent sources of truth for skills, rules, or templates.
- A runtime only supports root-level or target-native entrypoints, requiring
  bridges that stay visible even though the authoritative content is hidden.
- Working memory grows into a transcript archive inside `.hforge/` and stops
  behaving like a compact resumability surface.
- A repository owner wants local-only AI assistance, but another teammate
  expects the full hidden AI layer to be present after clone without running
  install.
- An export bundle goes stale and is later confused with live runtime state.
- A hidden AI layer accumulates too many durable artifacts and becomes hard to
  inspect unless surfaces stay typed, structured, and clearly authoritative.

## Requirements *(mandatory)*

### Functional Requirements

#### AI Layer Visibility and Containment

- **FR-001**: Harness Forge v2 MUST install its canonical AI operating layer
  under `.hforge/` so the primary skills, rules, knowledge, templates, runtime
  state, and working-memory artifacts are not exposed as root-level product
  directories.
- **FR-002**: The authoritative AI layer MUST contain the durable knowledge
  library, task artifacts, templates, rules, and short-term memory surfaces
  required for agentic work.
- **FR-003**: Root-visible Harness Forge surfaces MUST be limited to thin
  discovery bridges, target-native entrypoints, and other intentionally exposed
  minimal guidance surfaces.
- **FR-004**: Root discovery bridges MUST explicitly state that `.hforge/` is
  the authoritative knowledge base, runtime, and state machine for the
  installed AI layer.
- **FR-005**: The product MUST avoid installing bulky canonical AI-only content
  at the repo root in a way that could be mistaken for application source,
  business logic, or first-class product folders.
- **FR-006**: The default installation model MUST keep the hidden AI layer out
  of routine version-control tracking unless the operator explicitly chooses to
  share selected surfaces.
- **FR-007**: The installed repo layout MUST make it easy for a human to
  distinguish product code, target-native bridge files, and hidden AI-layer
  content.

#### Hidden Shared Runtime and Discovery Bridges

- **FR-008**: `.hforge/` MUST act as the single system of record for shared
  repo intelligence, rules, templates, task packs, working memory, findings,
  and decisions.
- **FR-009**: Target-specific surfaces for Codex, Claude Code, and other
  supported runtimes MUST behave as discovery or translation bridges rather
  than separate canonical knowledge stores.
- **FR-010**: The product MUST generate bridge surfaces in the locations each
  supported runtime already inspects, including root instruction files,
  target-native entrypoints, and agent-facing activation surfaces when needed.
- **FR-011**: Bridge surfaces MUST remain small, navigational, and auditable,
  and MUST reference authoritative hidden-layer content rather than duplicating
  large canonical knowledge bodies.
- **FR-012**: Scoped or nested bridges MUST only exist when module-specific
  guidance materially improves task execution relative to root guidance alone.
- **FR-013**: Cross-target support guidance MUST make it explicit whether a
  capability is native, translated, partial, documentation-only, or
  unsupported.
- **FR-014**: If a bridge depends on hidden-layer content that is missing,
  stale, or unavailable, the operator-facing guidance MUST make that failure or
  degraded state visible.

#### Repo Intelligence, Durable Knowledge, and Freshness

- **FR-015**: The hidden AI layer MUST maintain a structured understanding of
  the repo, including layout, module boundaries, dependency relationships,
  architecture anchors, conventions, entry points, and risk-sensitive areas.
- **FR-016**: The hidden AI layer MUST capture human-provided rules,
  constraints, preferences, and project goals as explicit durable inputs rather
  than relying only on inferred repository structure.
- **FR-017**: Durable repo knowledge MUST remain separate from short-term
  working state so stable project understanding is not mixed with active-task
  cache artifacts.
- **FR-018**: Generated hidden-layer artifacts MUST preserve freshness,
  provenance, confidence, and review-state metadata so maintainers can judge
  trust.
- **FR-019**: The refresh flow MUST compare current repo state to prior hidden
  runtime state, update affected areas when possible, and mark dependent
  artifacts stale when they can no longer be trusted fully.
- **FR-020**: Risk-aware context generation MUST elevate security-sensitive,
  migration-sensitive, data-sensitive, performance-sensitive, and
  integration-sensitive areas when they are adjacent to a requested change.

#### Task Packs, Rules, Notes, and Working Memory

- **FR-021**: The primary output of task preparation MUST be a structured task
  pack stored inside the hidden AI layer rather than an exposed root-level note
  collection.
- **FR-022**: Each task pack MUST include the task summary, requested outcome,
  clarified requirements, relevant architectural context, impacted modules,
  constraints, risks, acceptance criteria, test implications, unresolved
  questions, and recommended next steps or sequence.
- **FR-023**: Rules, skills, templates, and knowledge referenced during task
  preparation MUST resolve from the hidden AI layer as the canonical source.
- **FR-024**: The question flow for new work MUST be adaptive, ask only
  high-value clarification questions, and explain why each question matters to
  scope, compatibility, risk, or user experience.
- **FR-025**: Implementation notes generated for a task MUST be evidence-based,
  typed or categorized, and explicit about source, confidence, and affected
  modules.
- **FR-026**: The hidden AI layer MUST provide a compact short-term memory
  model for active work that records current objective, active plan, files in
  focus, confirmed facts, open questions, recent failed attempts, and next
  immediate step.
- **FR-027**: Short-term memory MUST remain concise, avoid raw logs or full
  transcripts, and distinguish confirmed facts from inference and unresolved
  questions.
- **FR-028**: When task knowledge becomes durable, the hidden AI layer MUST
  promote it into the correct long-term artifact rather than leaving it
  stranded in short-term cache.
- **FR-029**: The runtime MUST support memory compaction so stale failures,
  repeated facts, and obsolete plan fragments do not accumulate indefinitely.

#### Operating Modes, Sharing, and Exports

- **FR-030**: The product MUST present clear operator modes for install or
  bootstrap, refresh, task preparation, review, and export.
- **FR-031**: The hidden AI layer MUST support portable outputs for review and
  handoff so users can share essential context without exposing or committing
  the entire canonical AI content library.
- **FR-032**: Exported outputs MUST contain enough context to explain the task,
  constraints, risks, and expected outcomes without requiring the receiver to
  reconstruct the whole hidden runtime manually.
- **FR-033**: Operator guidance MUST explain which hidden-layer artifacts are
  authoritative, which are cache-like, and which are safe to ignore, refresh,
  or export.
- **FR-034**: The product MUST support a local-first lifecycle in which the
  hidden AI layer can be installed, refreshed, and used privately in a product
  repo without forcing the full AI content surface into normal application code
  review.
- **FR-035**: The product MUST allow selected bridge surfaces or outputs to be
  shared intentionally without redefining the hidden AI layer itself as product
  code.

#### Governance, Trust, and Scope Discipline

- **FR-036**: Generated artifacts MUST express whether content is machine
  inferred, user confirmed, agent proposed, approved, stale, or superseded so
  reviewers can judge trust and actionability.
- **FR-037**: The refactor MUST prefer artifact types that directly help plan,
  implement, review, explain, or risk-assess a change and MUST avoid generic
  artifact growth that does not improve those workflows.
- **FR-038**: The initial scope of this direction MUST prioritize hidden AI
  layer containment, bridge discoverability, task packs, working memory,
  refresh behavior, and export flows ahead of advanced automation or broader
  ecosystem integrations.

### Key Entities *(include if feature involves data)*

- **AI Layer Root**: The hidden `.hforge/` surface that contains the canonical
  knowledge base, runtime artifacts, templates, rules, task packs, and
  short-term memory for agentic work in a repo.
- **Root Discovery Bridge**: A thin root-visible or target-native file that
  tells an agent how to find and interpret the authoritative hidden AI layer.
- **Hidden Knowledge Surface**: A typed durable area inside `.hforge/` that
  stores skills, rules, knowledge, templates, findings, or decisions.
- **Repo Intelligence Artifact**: A structured hidden-layer record describing
  repository topology, boundaries, conventions, risk areas, and related trust
  metadata.
- **Task Pack**: A hidden-layer task-specific context bundle containing the
  requested outcome, requirements, risks, affected modules, and validation
  expectations for a unit of work.
- **Working Memory Artifact**: A concise hidden-layer active-task cache that
  records current objective, plan, facts, open questions, failures, and next
  step.
- **Compatibility Profile**: The target-specific statement of what a runtime
  supports natively, what is translated, and what remains partial or
  documentation-only.
- **Export Bundle**: A portable handoff artifact derived from the hidden AI
  layer that shares the essential context for review or collaboration without
  exposing the whole canonical runtime.
- **Visibility Policy**: The rule set that determines what remains hidden in
  `.hforge/`, what appears as a thin bridge at the root, and what can be
  intentionally shared.

## Quality & Architecture Constraints *(mandatory)*

- **QC-001**: The canonical AI layer MUST remain hidden behind `.hforge/` and
  must not masquerade as product source code.
- **QC-002**: Discovery bridges MUST stay thin, navigational, and auditable
  rather than duplicating large volumes of canonical knowledge.
- **QC-003**: `.hforge/` MUST remain the authoritative system of record for the
  shared AI operating layer across supported runtimes.
- **QC-004**: The default operator experience MUST remain local-first and avoid
  polluting normal application code review with the full AI content library.
- **QC-005**: Working memory MUST behave like a small disposable cache, not a
  long-term storage surface or transcript archive.
- **QC-006**: Freshness, provenance, confidence, and trust status MUST remain
  visible enough that stale or weakly supported knowledge is not mistaken for a
  confirmed rule.
- **QC-007**: The product MUST remain honest about target differences and must
  never imply capability parity that a runtime cannot actually support.
- **QC-008**: Export and sharing flows MUST remain distinct from the hidden
  canonical runtime so portable outputs do not become accidental second sources
  of truth.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In representative application-repo installs, canonical AI-only
  content is stored under `.hforge/` rather than exposed as bulky root-level
  skills, rules, or knowledge directories.
- **SC-002**: A maintainer can inspect a root discovery bridge and determine in
  one short read that `.hforge/` is the authoritative knowledge base, runtime,
  and state machine for the installed AI layer.
- **SC-003**: Supported agent runtimes can discover the hidden AI layer through
  thin root or target-native bridges without requiring duplicated canonical
  knowledge copies at the repo root.
- **SC-004**: The default installation model keeps the hidden AI layer out of
  routine product-code review and ordinary version-control tracking unless the
  operator intentionally chooses to share selected surfaces.
- **SC-005**: Task packs and working-memory artifacts are generated inside the
  hidden AI layer and remain concise enough to help active work without
  becoming transcript archives.
- **SC-006**: Maintainers can inspect freshness, provenance, confidence, and
  trust status on hidden-layer artifacts well enough to distinguish inferred
  guidance from confirmed project knowledge.
- **SC-007**: Users can export task or review context from the hidden AI layer
  for handoff without needing to commit or expose the entire canonical AI
  runtime surface.

## Assumptions

- `.hforge/` is the intended hidden namespace for the installed AI layer and is
  an acceptable product-facing location for canonical agentic content.
- Supported runtimes will continue to require some visible root-level or
  target-native bridge files, even if the authoritative content is hidden.
- The default operator expectation is local-first AI assistance, with sharing
  happening through intentionally exposed bridges or exported bundles rather
  than by committing the entire canonical AI content library.
- Some repositories may still choose to share selected AI-layer surfaces, but
  the default design should optimize for a clean application-code root.
- Migration from the current root-exposed content model can happen in phases as
  long as the final system of record moves into `.hforge/`.
