---
id: rules-index
kind: rule
title: Rules Index
summary: Entry point for Harness Forge shared and language-specific rule surfaces.
status: stable
owner: core
applies_to:
  - codex
  - claude-code
  - cursor
  - opencode
languages:
  - all
generated: false
---
# Rules Index

Harness Forge separates seeded first-class packs from expanding rule packs.

## Seeded packs

| Language | Maturity | Rule entry |
|----------|----------|------------|
| TypeScript | Seeded | `rules/typescript/README.md` |
| Java | Seeded | `rules/java/README.md` |
| .NET | Seeded | `rules/dotnet/README.md` |
| Lua | Seeded | `rules/lua/README.md` |
| PowerShell | Seeded | `rules/powershell/README.md` |

## Expanding packs

- `rules/golang/README.md`
- `rules/python/README.md`
- `rules/rust/README.md`
- `rules/swift/README.md`
- `rules/php/README.md`
- `rules/perl/README.md`
- `rules/kotlin/README.md`
- `rules/cpp/README.md`
- `rules/shell/README.md`

## Baseline expectations

First-class language packs expose coding style, patterns, testing, security,
and hooks guidance, then link back to the full seeded source material under
`knowledge-bases/seeded/`.

## Shared baseline

- `rules/common/README.md`
- `rules/common/coding-style.md`
- `rules/common/patterns.md`
- `rules/common/testing.md`
- `rules/common/security.md`

The shared baseline is promoted from the seeded archive so assistants can use a
stable top-level rule surface without skipping the canonical seed source.
