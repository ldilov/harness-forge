# Harness Forge agent guidance

Use the promoted root surfaces first:

- `skills/` for canonical packaged skills
- `.agents/skills/` for auto-discoverable wrappers
- `.specify/` for spec → plan → tasks
- `rules/common/` plus the matching language directory for implementation guidance

## Language discovery

- prefer `knowledge-bases/seeded/typescript/` when the repo is TypeScript or JavaScript heavy
- prefer `knowledge-bases/seeded/java/` for Java services and libraries
- prefer `knowledge-bases/seeded/dotnet/` for .NET repos
- prefer `knowledge-bases/seeded/lua/` for Lua work
- prefer `knowledge-bases/seeded/powershell/` for PowerShell and Windows automation
- use the structured packs under `knowledge-bases/structured/` for Python, Go, Kotlin, Rust, C++, PHP, Perl, Swift, and Shell

## Runtime notes

- Claude Code installs map target runtime files into `.claude/`
- Codex installs map target runtime files into `.codex/`
- both targets still use `.agents/skills/`, `.specify/`, and the package validation surfaces

## Release gate

Run `npm run validate:release` before publish or handoff.
