# Harness Forge agent guidance

Use the thin visible bridge surfaces first in installed workspaces:

- `AGENTS.md` for the thin human-readable guidance bridge
- `.hforge/agent-manifest.json` for the machine-readable custom-agent contract
- `.agents/skills/` for auto-discoverable wrappers
- `.specify/` for spec -> plan -> tasks flow state and templates
- `.hforge/library/skills/` for canonical installed skills
- `.hforge/library/rules/` and `.hforge/library/knowledge/` for canonical installed implementation guidance
- `.hforge/templates/` for canonical installed task and workflow templates
- `.hforge/runtime/index.json` and `.hforge/runtime/README.md` for shared runtime state and bridge resolution
- `.hforge/generated/agent-command-catalog.json` for safe command discovery

## Mode awareness

- when working inside an installed consumer workspace, prefer the hidden canonical AI layer under `.hforge/` plus the thin visible bridges at the repo root
- when working inside the Harness Forge source repository itself, the authored source-of-truth surfaces still live in `skills/`, `rules/`, `knowledge-bases/`, `templates/`, `manifests/`, `targets/`, and `src/`
- do not assume the source repository layout and the installed workspace layout are the same thing
- in installed workspaces, treat `.hforge/` as canonical and the root bridge files as discovery and compatibility surfaces
- in the package source repository, treat `.hforge/` as generated or local runtime state rather than the authored source of truth

## Resolution rule

- treat `AGENTS.md` as the primary human-readable entrypoint
- load `.hforge/agent-manifest.json` first when a machine-readable contract is preferred
- use `.agents/skills/<skill>/SKILL.md` only for discovery
- use `.hforge/library/skills/<skill>/SKILL.md` as the canonical execution contract in installed workspaces
- use `.hforge/library/skills/<skill>/references/` for deeper runtime-facing heuristics and templates
- treat `.hforge/library/`, `.hforge/templates/`, `.hforge/runtime/`, `.hforge/state/`, and `.hforge/generated/` as extracted AI-layer surfaces, not product source code
- treat any surface marked `treatAsProductCode: false` in `.hforge/agent-manifest.json` as non-product AI-layer content

## Installed runtime map

- use `.hforge/runtime/repo/repo-map.json` for baseline repo topology and boundary context
- use `.hforge/runtime/repo/recommendations.json` for evidence-backed bundle, profile, and validation recommendations
- use `.hforge/runtime/repo/instruction-plan.json` for target-aware instruction synthesis outputs
- use `.hforge/runtime/findings/validation-gaps.json` and `.hforge/runtime/findings/risk-signals.json` for cautionary runtime signals
- use `.hforge/runtime/tasks/<taskId>/` for task-runtime artifacts such as file-interest, impact-analysis, and task-pack linkage
- use `.hforge/runtime/decisions/` for ASR and ADR records plus machine-readable decision indexes when governance support is installed
- use `.hforge/runtime/recursive/sessions/` for recursive-session state, handles, and promotion traces when recursive mode is enabled
- use `.hforge/observability/` for local-only effectiveness summaries and recommendation or maintenance signals
- use `.hforge/generated/bin/` for workspace-local launchers when bare `hforge` is not already available on `PATH`

## Language discovery

- prefer `.hforge/library/knowledge/seeded/typescript/` with `.hforge/library/rules/common/` and `.hforge/library/rules/typescript/` when the repo is TypeScript-heavy or JavaScript-heavy with strong typing needs
- prefer `.hforge/library/skills/javascript-engineering/` when the repo is JavaScript-first and the task is not primarily about TypeScript typing
- prefer `.hforge/library/knowledge/seeded/java/` with `.hforge/library/rules/common/` and `.hforge/library/rules/java/` for Java services and libraries
- prefer `.hforge/library/knowledge/seeded/dotnet/` with `.hforge/library/rules/common/` and `.hforge/library/rules/dotnet/` for .NET repos
- prefer `.hforge/library/knowledge/seeded/lua/` with `.hforge/library/rules/common/` and `.hforge/library/rules/lua/` for Lua work
- prefer `.hforge/library/knowledge/seeded/powershell/` with `.hforge/library/rules/common/` and `.hforge/library/rules/powershell/` for PowerShell and Windows automation
- use the structured packs under `.hforge/library/knowledge/structured/` with the matching `.hforge/library/rules/<language>/` directory for Python, Go, Kotlin, Rust, C++, PHP, Perl, Swift, and Shell
- use `.hforge/library/manifests/catalog/language-assets.json` when the installed language surface is not obvious from the repo layout alone

## Specialized skills

- prefer `.hforge/library/skills/cloud-architect/` when the task is about deployment topology, distributed systems, reliability, observability, or cloud trade-offs across services
- prefer `.hforge/library/skills/engineering-assistant/` when the task needs architecture plus implementation orchestration, option framing, or explicit project-memory and change-discipline guidance in one surface
- use `.hforge/library/manifests/catalog/framework-assets.json` and `.hforge/runtime/repo/recommendations.json` when framework or bundle matching is more reliable than guessing from file extensions

## Imported skill governance

- treat `.hforge/library/manifests/catalog/engineering-assistant-import-inventory.json` as the review ledger for the single-skill engineering-assistant port
- keep maintainer-facing provenance for that port in `.hforge/library/docs/authoring/engineering-assistant-port.md`
- treat `.hforge/library/manifests/catalog/enhanced-skill-import-inventory.json` as the review ledger for embedded skill packs and use it before changing imported skill surfaces
- treat `.agents/skills/` as the discovery layer and `.hforge/library/skills/` as the canonical installed execution layer
- keep maintainer-facing provenance in `.hforge/library/docs/authoring/enhanced-skill-import.md`
- use `RESEARCH-SOURCES.md` and `VALIDATION.md` only as additional provenance, not as replacements for the canonical installed skill surfaces
- prefer the project-owned canonical `.hforge/library/skills/` surfaces over any raw imported archive layout

## Target support posture

- treat Codex and Claude Code as first-class targets
- treat Cursor and OpenCode as partial targets unless the capability matrix says otherwise
- prefer `hforge target inspect <target> --json` or `.hforge/library/manifests/catalog/harness-capability-matrix.json` before claiming a target supports a runtime-native behavior
- do not imply hook-native, workflow-native, or recursive-native parity where support is only translated, bridged, or documentation-driven
- use `.codex/` and `.claude/` as target-facing bridges, not as replacements for the shared `.hforge/` runtime

## Runtime notes

- Claude Code installs map target runtime files into `.claude/`
- Codex installs map target runtime files into `.codex/`
- installed workspaces compile the shared intelligence runtime into `.hforge/runtime/`
- target-facing files such as `AGENTS.md`, `.agents/skills/`, `.codex/`, and `.claude/` are thin bridges back to the hidden canonical AI layer rather than separate knowledge systems
- recursive runtime state, when present, lives under `.hforge/runtime/recursive/sessions/` and should be treated as hidden operational state rather than product code

## Command discovery and execution

- for first use in a repo, prefer `npx @harness-forge/cli`
- prefer `hforge commands --json` or `.hforge/generated/agent-command-catalog.json` to discover shipped CLI commands and npm scripts before inventing a command path
- prefer `hforge status --root . --json` to inspect the installed workspace state
- prefer `hforge catalog --json` to review installed bundles, packs, and profiles
- prefer `hforge bootstrap --root . --yes` when the repository needs target autodiscovery and one-pass Harness Forge setup
- prefer `hforge task list --root . --json`, `hforge task inspect <taskId> --root . --json`, and `hforge pack inspect <taskId> --root . --json` when task-runtime artifacts are relevant
- prefer `hforge flow status --root . --json` when flow recovery state matters
- prefer `hforge review --root . --json`, `hforge export --root . --json`, `hforge doctor --root . --json`, and `hforge audit --root . --json` for runtime health and handoff checks
- when bare `hforge` is unavailable, use the workspace-local launcher under `.hforge/generated/bin/` instead of reaching for package-source entrypoints such as `node dist/cli/index.js`
- `hforge shell setup --yes` is the preferred way to make bare `hforge` available without forcing a global npm mutation
- `npm install -g @harness-forge/cli` is optional convenience, not the default requirement
- use `.hforge/runtime/repo/repo-map.json`, `.hforge/runtime/repo/instruction-plan.json`, `.hforge/runtime/repo/recommendations.json`, and `.hforge/runtime/findings/risk-signals.json` as the extracted runtime intelligence surfaces
- treat framework matches, recommendation evidence, and validation gaps as first-class signals, not as optional decoration

## Trust and scope rules

- do not treat `.hforge/` runtime state, task state, recursive state, or generated manifests as product application code unless the task is explicitly about Harness Forge itself
- prefer the machine-readable command catalog and capability matrix over guessing or prose-only interpretation
- treat stale or missing runtime artifacts as signals to run `status`, `refresh`, `doctor`, or `audit` rather than inventing a recovery path
- keep support claims honest: if a target or surface is partial, translated, or non-authoritative, say so explicitly

## Release gate

- run `npm run validate:release` before publish, handoff, or release-signoff work
