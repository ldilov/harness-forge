# Phase 0 Research: Harness Forge AIO v2 Runtime Refactor

## Decision 1: Make `.hforge/` the canonical hidden AI layer

- **Decision**: Treat `.hforge/` as the authoritative AI layer for installed
  repositories, containing the canonical skills, rules, knowledge, templates,
  runtime artifacts, task packs, exports, and compact working memory.
- **Rationale**: The user’s core concern is repo cleanliness. In an ordinary
  product repo, large visible `skills/`, `rules/`, and `knowledge-bases/`
  trees read as product source even though they are agent tooling. Moving the
  canonical AI layer under `.hforge/` creates a clear product-versus-agent
  boundary.
- **Alternatives considered**:
  - Keep root-visible canonical content and rely on documentation to explain
    the difference: rejected because humans still see those folders as part of
    the repo’s primary surface.
  - Move everything to target-native folders only: rejected because the system
    still needs one cross-target system of record.

## Decision 2: Keep root and target-native surfaces as thin bridges only

- **Decision**: Preserve visible root and target-native files only where agent
  runtimes already inspect them, but constrain them to navigational bridge
  behavior rather than canonical content storage.
- **Rationale**: Codex, Claude Code, and similar runtimes still need entry
  surfaces they know how to discover. Thin bridges preserve compatibility while
  keeping the authoritative AI layer hidden and centralized.
- **Alternatives considered**:
  - Eliminate all visible bridges and expect agents to inspect `.hforge/`
    directly: rejected because many runtimes depend on root or target-native
    entrypoints.
  - Duplicate large hidden-layer content into visible bridge files: rejected
    because bridges would become second knowledge stores.

## Decision 3: Default to a local-first lifecycle and hidden-layer gitignore

- **Decision**: Treat the canonical hidden AI layer as local operational
  content by default, with version-control behavior that keeps it out of normal
  product-code review unless the operator intentionally shares selected
  surfaces.
- **Rationale**: The goal is to facilitate agentic development in product repos
  without making the repo look like an AI framework checkout. Local-first
  behavior fits that expectation and keeps routine commits focused on product
  code.
- **Alternatives considered**:
  - Commit the full hidden AI layer by default: rejected because it still
    burdens product repos with heavy AI-only review noise.
  - Make sharing impossible: rejected because teams still need bridge and
    export paths for collaboration and handoff.

## Decision 4: Split the hidden AI layer into typed surfaces

- **Decision**: Use a typed hidden layout with separate surfaces for library,
  runtime, tasks, cache, exports, generated helpers, and install state.
- **Rationale**: Not all AI artifacts have the same lifecycle. Skills and rules
  are durable and canonical, working memory is short-lived, runtime findings
  need trust metadata, and exports must remain intentionally shareable. A typed
  layout makes those boundaries explicit.
- **Alternatives considered**:
  - Store everything under one flat hidden folder: rejected because authority,
    freshness, and cleanup behavior would become ambiguous.
  - Create too many micro-surfaces immediately: rejected because the hidden
    layout still needs to stay practical and inspectable.

## Decision 5: Keep `.agents/skills/` as a discovery layer, but redirect it into hidden canonical content

- **Decision**: Preserve wrapper-style discovery surfaces where they provide
  runtime value, but make them point to canonical hidden-layer skills instead
  of root-visible skill directories.
- **Rationale**: The current discovery split is useful, but its canonical side
  should no longer live in the visible root. Redirecting the discovery layer
  into `.hforge/` preserves activation behavior without keeping bulky AI-only
  content exposed.
- **Alternatives considered**:
  - Remove wrapper skill discovery entirely: rejected because it would weaken
    runtime activation and compatibility guidance.
  - Keep wrapper and canonical skill trees both visible: rejected because it
    defeats the containment goal.

## Decision 6: Keep task packs, implementation notes, and working memory inside the hidden layer

- **Decision**: Treat task packs and compact working memory as hidden-layer
  artifacts alongside the rest of the AI runtime rather than exposing them as
  visible repo-root support files.
- **Rationale**: Task context is one of the main reasons the AI layer exists,
  but it is still AI support content rather than product source. Keeping task
  artifacts hidden preserves both cleanliness and lifecycle clarity.
- **Alternatives considered**:
  - Write task artifacts beside product code for convenience: rejected because
    it blurs the line between application content and AI support state.
  - Keep only transient in-memory task state: rejected because resumability and
    review need durable hidden artifacts.

## Decision 7: Preserve hidden repo intelligence with freshness and trust metadata

- **Decision**: Keep repo intelligence, risk findings, freshness metadata,
  provenance, and confidence labels inside the hidden runtime and treat them as
  inspectable but non-product artifacts.
- **Rationale**: Hiding the AI layer should not weaken trust. The runtime still
  needs to show what it knows, how fresh it is, and how much confidence it has
  in that knowledge.
- **Alternatives considered**:
  - Strip metadata because the content is hidden anyway: rejected because
    maintainers still need to judge trust when they inspect or export it.
  - Recompute everything ad hoc instead of persisting it: rejected because task
    preparation and refresh flows need durable runtime state.

## Decision 8: Use export bundles as the main sharing boundary

- **Decision**: Make portable exports, not the full hidden AI layer, the main
  collaboration and handoff surface for humans and agents outside the local
  runtime.
- **Rationale**: This preserves the local-first containment model while still
  supporting review, assistance, and cross-agent handoff. Exports can be
  intentionally shaped for the audience instead of exposing the entire hidden
  runtime.
- **Alternatives considered**:
  - Share the full hidden layer whenever collaboration is needed: rejected
    because that recreates the noise problem in a different location.
  - Avoid exports and require others to recreate context from scratch: rejected
    because it undermines the practical value of the runtime.

## Decision 9: Migrate in phases from root-exposed canonical content

- **Decision**: Introduce the hidden canonical layer first, rewire bridge and
  adapter behavior next, then retire or de-emphasize root-visible canonical
  content once compatibility and validation are stable.
- **Rationale**: Existing manifests, docs, target adapters, and tests assume
  the current exposed layout. A phased migration reduces breakage and keeps the
  refactor auditable.
- **Alternatives considered**:
  - Switch everything in one step: rejected because the current repo has too
    many coupled surfaces for a safe flag-day change.
  - Defer containment and keep the hidden-layer idea only conceptual: rejected
    because the user-facing boundary problem would remain unsolved.
