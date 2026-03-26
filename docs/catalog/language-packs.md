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
- skills define activation, load order, execution contract, validation, and
  escalation
- `.agents/skills/` wrappers should route discovery into the canonical
  `skills/` surface rather than acting as a second source of truth
- workflows provide a language-aware implementation loop
- examples or source knowledge remain traceable to the pack manifest

Each pack participates in recommendation output through the repo-intelligence
pipeline and can be inspected through `manifests/catalog/language-assets.json`.
