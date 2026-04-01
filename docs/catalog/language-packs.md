# Language Pack Catalog

Every first-class pack now has a matching rule surface, skill, workflow, and
knowledge source.

## Seeded packs

- TypeScript
- Java
- .NET
- Lua
- PowerShell

## Structured packs

- Python
- Go
- Kotlin
- Rust
- C++
- PHP
- Perl
- Swift
- Shell

## Depth expectations

- docs explain when to install the pack and what it covers
- rules provide layered guidance for coding style, patterns, testing, security,
  and tooling
- top-level `rules/common/` and `rules/<language>/` remain the canonical
  authored runtime-rule surfaces for those concerns
- skills define activation, load order, execution contract, validation, and
  escalation
- `.agents/skills/` wrappers should route discovery into the canonical
  `skills/` surface rather than acting as a second source of truth
- workflows provide a language-aware implementation loop
- examples or source knowledge remain traceable to the pack manifest

Each pack participates in recommendation output through the repo-intelligence
pipeline and can be inspected through `manifests/catalog/language-assets.json`.

## Ownership model

- authored surfaces keep the real runtime judgment: canonical rules, canonical
  skills, explanatory knowledge docs, and specialized references
- generated or hybrid surfaces keep discoverability stable: thin wrappers,
  repetitive catalog pages, and repetitive workflow entrypoints
- seeded archive rule trees remain traceable package content, but they are
  derived from the canonical authored rule surfaces rather than maintained as a
  second authored home
