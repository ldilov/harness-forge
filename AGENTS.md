# Harness Forge agent guidance

Use the thin visible bridge surfaces first in installed workspaces:

- `.agents/skills/` for auto-discoverable wrappers
- `.hforge/agent-manifest.json` for the machine-readable custom-agent contract
- `.specify/` for spec → plan → tasks
- `.hforge/library/skills/` for canonical installed skills
- `.hforge/library/rules/` plus the matching language directory for implementation guidance

## Language discovery

- prefer `.hforge/library/knowledge/seeded/typescript/` when the repo is TypeScript or JavaScript heavy in an installed workspace
- prefer `skills/javascript-engineering/` when the repo is JavaScript-first and the task is not primarily about TypeScript typing
- prefer `.hforge/library/knowledge/seeded/java/` for Java services and libraries in an installed workspace
- prefer `.hforge/library/knowledge/seeded/dotnet/` for .NET repos in an installed workspace
- prefer `.hforge/library/knowledge/seeded/lua/` for Lua work in an installed workspace
- prefer `.hforge/library/knowledge/seeded/powershell/` for PowerShell and Windows automation in an installed workspace
- use the structured packs under `.hforge/library/knowledge/structured/` for Python, Go, Kotlin, Rust, C++, PHP, Perl, Swift, and Shell in an installed workspace

## Specialized skills

- prefer `.hforge/library/skills/cloud-architect/` when the task is about deployment topology, distributed systems, reliability, observability, or cloud trade-offs across services in an installed workspace
- prefer `.hforge/library/skills/engineering-assistant/` when the task needs architecture plus implementation orchestration, option framing, or explicit project-memory and change-discipline guidance in one surface in an installed workspace

## Imported skill governance

- treat `manifests/catalog/engineering-assistant-import-inventory.json` as the
  review ledger for the single-skill engineering-assistant port
- keep maintainer-facing provenance for that port in
  `docs/authoring/engineering-assistant-port.md`
- treat `manifests/catalog/enhanced-skill-import-inventory.json` as the review
  ledger for embedded skill packs and use it before changing imported skill
  surfaces
- treat `.agents/skills/` as the discovery layer and `.hforge/library/skills/`
  as the canonical installed execution layer
- keep maintainer-facing provenance in
  `docs/authoring/enhanced-skill-import.md`
- use `RESEARCH-SOURCES.md` and `VALIDATION.md` only as additional provenance,
  not as replacements for the canonical skill surfaces
- prefer the project-owned canonical `skills/` surfaces over any raw imported
  archive layout

## Runtime notes

- Claude Code installs map target runtime files into `.claude/`
- Codex installs map target runtime files into `.codex/`
- installed workspaces compile the shared intelligence runtime into
  `.hforge/runtime/`
- both targets still use `.agents/skills/`, `.specify/`, and the package validation surfaces

## Repo intelligence

- use `node dist/cli/index.js recommend <repo>` when the right pack, profile,
  or skill is not obvious from file extensions alone
- use `node dist/cli/index.js commands --json` or
  `.hforge/generated/agent-command-catalog.json` to discover the shipped CLI
  commands and npm scripts before inventing your own execution path
- use `.hforge/agent-manifest.json` when a custom agent needs one stable
  machine-readable file describing bridge files, canonical roots, local
  launchers, and safe command discovery
- use `.hforge/library/` as the canonical installed AI layer and avoid treating
  root-visible bridge files as the full source of truth
- use `.hforge/runtime/index.json` and `.hforge/runtime/README.md` to inspect
  the installed shared runtime and its target discovery bridges before treating
  target-specific files as authoritative in isolation
- use `node dist/cli/index.js bootstrap --root . --yes` when the repository
  needs target autodiscovery and one-pass Harness Forge setup
- treat framework matches and validation gaps as first-class signals, not just
  bundle decoration
- prefer recommendation evidence over guessing from a single config file

## Release gate

Run `npm run validate:release` before publish or handoff.
