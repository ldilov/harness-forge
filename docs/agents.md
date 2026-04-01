# Agents

Harness Forge keeps runtime discovery visible while moving canonical installed
AI content into the hidden `.hforge/` layer.

## Primary surfaces

- `AGENTS.md` for the thin repo-root guidance bridge
- `.hforge/agent-manifest.json` for one machine-readable custom-agent contract
- `agents/planner.md` for packaged planning expectations
- `.agents/skills/` for discovery wrappers that route agent runtimes into the hidden installed canonical skills
- `.agents/skills/*-engineering/` for language-aware activation that resolves into `.hforge/library/skills/` in installed workspaces
- treat `.agents/skills/*-engineering/` as thin discovery-only surfaces so
  agents do not consume the same pack summary through multiple parallel files
- `.hforge/library/skills/` for the canonical installed skill library
- `.hforge/library/rules/` and `.hforge/library/knowledge/` for hidden installed rule and knowledge surfaces
- `.hforge/runtime/recursive/sessions/` for optional hard-task recursive
  sessions that stay hidden alongside the rest of the AI layer
- `.hforge/runtime/recursive/language-capabilities.json` for the canonical
  recursive structured-analysis capability map before deeper recursive
  investigation begins
- `docs/agent-usage-playbook.md` for copy-ready prompts and examples that make
  agents use the installed Harness Forge runtime more explicitly
- `docs/authoring/enhanced-skill-import.md` for curated research and validation provenance behind imported skill upgrades
- `docs/authoring/token-budget-optimizer-port.md` for maintainer-facing provenance behind the promoted context-compaction skill
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
- when a task is multi-hop, ambiguous, or architecture-heavy enough to justify
  an explicit recursive session instead of growing the prompt
- when a recursive session needs one bounded structured analysis step with a
  durable run record instead of chat-only reasoning
- when a recursive session should use environment-first typed action bundles,
  durable memory, bounded code cells, or replayable scorecards instead of
  transcript-heavy prompt growth
- when prompt history is growing and the next safe answer may already exist in
  `.hforge/runtime/`, task artifacts, or decision records

## Discovery rule

- use `.agents/skills/<skill>/SKILL.md` to discover the right flow quickly
- in installed workspaces, load `.hforge/library/skills/<skill>/SKILL.md` for the actual execution contract
- in this package source repo, authored canonical skill sources still live under `skills/<skill>/`
- in installed workspaces, deeper references live under `.hforge/library/skills/<skill>/references/`
- in installed workspaces, recursive runtime state lives under
  `.hforge/runtime/recursive/sessions/<sessionId>/` and should be treated as
  hidden operational state rather than product code
- use recursive structured analysis as the promoted execution surface for
  recursive investigation, and treat the REPL as optional rather than
  authoritative
- use Typed RLM through `hforge recursive execute` and the iteration, subcall,
  code-cell, promotion, meta-op, score, and replay inspection surfaces when
  the task benefits from durable environment-first recursive state
- treat `.hforge/runtime/recursive/language-capabilities.json` as the honest
  recursive support contract before claiming a language has deep or native
  structured-analysis support
- treat Cursor and OpenCode recursive promotion as translated shared-runtime
  guidance, not native parity with Codex or Claude Code
- for custom agents that do not want to parse prose only, load
  `.hforge/agent-manifest.json` first and treat every surface it marks
  `treatAsProductCode: false` as AI-layer content rather than application code
- use `docs/authoring/enhanced-skill-import.md`, `RESEARCH-SOURCES.md`, and `VALIDATION.md` only when provenance or import rationale matters
- use `.agents/skills/token-budget-optimizer/SKILL.md` when the next safe step
  depends on compacting context and reusing authoritative runtime surfaces
