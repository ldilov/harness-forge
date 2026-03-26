# Agents

Harness Forge ships both product-facing agent guidance and repo-local skills.

## Primary surfaces

- `AGENTS.md` for shared workspace guidance
- `agents/planner.md` for planning expectations
- `.agents/skills/` for discovery wrappers that route agent runtimes into the canonical skills
- `.agents/skills/*-engineering/` for language-aware activation that still resolves into `skills/`
- `skills/` for the canonical published skill library and runtime-facing references
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

## Discovery rule

- use `.agents/skills/<skill>/SKILL.md` to discover the right flow quickly
- load `skills/<skill>/SKILL.md` for the actual execution contract
- load `skills/<skill>/references/` when the task needs deeper heuristics
- use `docs/authoring/enhanced-skill-import.md`, `RESEARCH-SOURCES.md`, and `VALIDATION.md` only when provenance or import rationale matters
