# Phase 0 Research: Harness Forge Documentation, Knowledge Packs, and Package Surface

## Decision 1: Treat authored repository content as canonical; generated and localized outputs are governed derivatives

**Decision**: `docs/`, `rules/`, `templates/`, `commands/`, `agents/`,
`contexts/`, `hooks/`, `examples/`, and manifest-authored content remain the
canonical human-authored source. Any generated schema mirrors, indexes, or
localized outputs must declare provenance and be validated against their
canonical source.

**Rationale**: The supplied docs refactor plan explicitly calls out authored vs
generated confusion as a current weakness. The reference project also shows how
easy it is for broad multilingual and target-specific surfaces to drift if they
do not have a documented source hierarchy.

**Alternatives considered**:

- Treat `schemas/` and other mirrors as co-equal sources:
  rejected because it increases drift risk and makes ownership unclear.
- Keep authored/generated boundaries implicit:
  rejected because package validation and release review become ambiguous.

## Decision 2: The shipped validator bundle is required product content, not optional tooling

**Decision**: The contents of `task-workflow-template-scripts.zip` are a
mandatory shipped product bundle. The shell scripts, PowerShell scripts,
`required-sections.json`, and bundle README must all be present in the
published artifact and remain directly referenceable from templates and docs.

**Rationale**: The user explicitly required inclusion of this bundle in the
package. The archive README also frames these scripts as the baseline
validation/indexing system for template and workflow content, which makes them
core to product correctness rather than dev-only utilities.

**Alternatives considered**:

- Re-implement the behavior and omit the original bundle surface:
  rejected because it weakens traceability to the supplied business input.
- Ship only the scripts but omit config or README:
  rejected because templates and maintainers need the full contract, not just
  executable fragments.

## Decision 3: Seeded language archives must become concrete knowledge, examples, and review guidance

**Decision**: The supplied TypeScript, Java, .NET, Lua, and PowerShell
knowledge-base archives are the primary seed inputs for first-class language
coverage in this feature. Their rules, docs, review checklists, frameworks
notes, and scenario examples must be promoted into real project content instead
of being represented as empty directories or placeholder pack names.

**Rationale**: The user specifically asked to see “actual knowledge in the
project not just empty folders.” The archive contents already include concrete
examples and documentation slices that can ground real product docs and language
pack maturity.

**Alternatives considered**:

- Keep seeded languages as manifest entries only:
  rejected because it does not deliver real knowledge value.
- Add only language README stubs:
  rejected because it preserves the “empty folder” problem.

## Decision 4: Package-surface validation must cover hidden and target-scoped content

**Decision**: Package-surface verification must include root docs, visible
runtime content, hidden target-scoped areas, and compatibility files that are
required for supported harnesses.

**Rationale**: The reference project’s `files` surface demonstrates that
important product behavior lives in hidden folders such as `.codex/`,
`.cursor/`, `.claude-plugin/`, and `.opencode/`, plus root compatibility files
like `AGENTS.md` and `CLAUDE.md`. A package check that ignores hidden content
would miss real breakage.

**Alternatives considered**:

- Validate only visible top-level content:
  rejected because it misses required harness-specific package assets.
- Validate only manifest-declared visible paths:
  rejected because some compatibility surfaces are target-specific and not
  naturally visible in a simplified package tree.

## Decision 5: Content contracts should be type-specific but enforced through one shared metadata model

**Decision**: Use shared YAML front matter across runtime markdown assets, with
base fields required for all content and type-specific required sections for
commands, agents, rules, contexts, examples, templates, and workflows.

**Rationale**: The docs refactor plan already proposes a shared metadata model,
while also calling out content-type-specific requirements. This balances
consistency with discoverability and avoids forcing one flat schema onto unlike
content.

**Alternatives considered**:

- Separate metadata formats for each content type:
  rejected because tooling complexity and discovery costs rise sharply.
- No front matter, only path-based conventions:
  rejected because ownership, compatibility, and generated status become too
  hard to validate reliably.

## Decision 6: Multilingual documentation is optional for this phase, but its governance must be designed now

**Decision**: This feature does not require full localized documentation
implementation, but the plan must define how localized docs relate to canonical
English-source content and how drift detection would work if translated sets are
introduced.

**Rationale**: The reference project demonstrates a large multilingual surface.
Even if Harness Forge does not ship translations immediately, the content system
should not be designed in a way that makes future localization fragile.

**Alternatives considered**:

- Ignore localization entirely:
  rejected because the reference project proves it is a likely future growth
  path.
- Require full multilingual rollout in this feature:
  rejected because it expands scope beyond the user’s core request.

## Decision 7: Quickstart and validation must exercise real content, not directory existence

**Decision**: The feature quickstart should verify actual docs pages, real
language-pack material, manifest entries, and the working validator bundle
rather than checking only whether directories exist.

**Rationale**: The current repo already contains some seeded docs, rules, and
validators. The feature’s value is to turn that into a coherent, trustworthy
surface, so validation should check concrete assets and contracts.

**Alternatives considered**:

- Validate only the presence of folders:
  rejected because it does not prove useful content exists.
- Validate only docs or only scripts:
  rejected because the feature is about the integrated content system.
