# Harness Forge agent guidance

Use the promoted root surfaces first:

- `skills/` for canonical packaged skills
- `.agents/skills/` for auto-discoverable wrappers
- `.specify/` for spec → plan → tasks
- `rules/common/` plus the matching language directory for implementation guidance

## Language discovery

- prefer `knowledge-bases/seeded/typescript/` when the repo is TypeScript or JavaScript heavy
- prefer `skills/javascript-engineering/` when the repo is JavaScript-first and the task is not primarily about TypeScript typing
- prefer `knowledge-bases/seeded/java/` for Java services and libraries
- prefer `knowledge-bases/seeded/dotnet/` for .NET repos
- prefer `knowledge-bases/seeded/lua/` for Lua work
- prefer `knowledge-bases/seeded/powershell/` for PowerShell and Windows automation
- use the structured packs under `knowledge-bases/structured/` for Python, Go, Kotlin, Rust, C++, PHP, Perl, Swift, and Shell

## Specialized skills

- prefer `skills/cloud-architect/` when the task is about deployment topology, distributed systems, reliability, observability, or cloud trade-offs across services

## Imported skill governance

- treat `manifests/catalog/enhanced-skill-import-inventory.json` as the review
  ledger for embedded skill packs and use it before changing imported skill
  surfaces
- treat `.agents/skills/` as the discovery layer and `skills/` as the canonical
  execution layer
- keep maintainer-facing provenance in
  `docs/authoring/enhanced-skill-import.md`
- use `RESEARCH-SOURCES.md` and `VALIDATION.md` only as additional provenance,
  not as replacements for the canonical skill surfaces
- prefer the project-owned canonical `skills/` surfaces over any raw imported
  archive layout

## Runtime notes

- Claude Code installs map target runtime files into `.claude/`
- Codex installs map target runtime files into `.codex/`
- both targets still use `.agents/skills/`, `.specify/`, and the package validation surfaces

## Repo intelligence

- use `node dist/cli/index.js recommend <repo>` when the right pack, profile,
  or skill is not obvious from file extensions alone
- use `node dist/cli/index.js commands --json` or
  `.hforge/generated/agent-command-catalog.json` to discover the shipped CLI
  commands and npm scripts before inventing your own execution path
- use `node dist/cli/index.js bootstrap --root . --yes` when the repository
  needs target autodiscovery and one-pass Harness Forge setup
- treat framework matches and validation gaps as first-class signals, not just
  bundle decoration
- prefer recommendation evidence over guessing from a single config file

## Release gate

Run `npm run validate:release` before publish or handoff.
