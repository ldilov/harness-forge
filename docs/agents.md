# Agents

Harness Forge keeps runtime discovery visible while moving canonical installed
AI content into the hidden `.hforge/` layer.

## Primary surfaces

- `AGENTS.md` for the thin repo-root guidance bridge
- `agents/planner.md` for packaged planning expectations
- `.agents/skills/` for discovery wrappers that route agent runtimes into the hidden installed canonical skills
- `.agents/skills/*-engineering/` for language-aware activation that resolves into `.hforge/library/skills/` in installed workspaces
- `.hforge/library/skills/` for the canonical installed skill library
- `.hforge/library/rules/` and `.hforge/library/knowledge/` for hidden installed rule and knowledge surfaces
- `docs/authoring/enhanced-skill-import.md` for curated research and validation provenance behind imported skill upgrades
- `RESEARCH-SOURCES.md` and `VALIDATION.md` for optional pack-level provenance detail

## When agents should use Harness Forge

- when a repository needs target-aware Codex or Claude Code setup
- when a task needs the seeded language-specific rules and examples
- when a repository language matches one of the seeded engineering skills
- when a framework-aware recommendation would be more reliable than guessing
  from file extensions
- when implementation should follow spec, plan, task, and validation loops
- when templates or workflow docs reference the shipped validator bundle
- when the application repo should stay clean and treat AI-only content as a hidden support layer

## Discovery rule

- use `.agents/skills/<skill>/SKILL.md` to discover the right flow quickly
- in installed workspaces, load `.hforge/library/skills/<skill>/SKILL.md` for the actual execution contract
- in this package source repo, authored canonical skill sources still live under `skills/<skill>/`
- in installed workspaces, deeper references live under `.hforge/library/skills/<skill>/references/`
- use `docs/authoring/enhanced-skill-import.md`, `RESEARCH-SOURCES.md`, and `VALIDATION.md` only when provenance or import rationale matters
