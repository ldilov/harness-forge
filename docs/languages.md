# Languages

Harness Forge currently treats five languages as first-class seeded packs and
keeps the remaining language docs in an expanding state.

## Seeded packs

| Language | Maturity | Best fit |
|----------|----------|----------|
| TypeScript | Seeded | Node, React, Next.js, libraries, monorepos |
| Java | Seeded | Spring Boot, libraries, service backends |
| .NET | Seeded | ASP.NET Core, workers, CLIs, libraries |
| Lua | Seeded | Neovim, OpenResty, LÖVE, embedded scripting |
| PowerShell | Seeded | Windows automation, pwsh tooling, modules, remoting |

Each seeded pack ships:

- overview docs
- review guidance
- framework notes
- concrete examples
- shared baseline rules
- language-specific rules

## Expanding packs

Go, Python, Rust, Swift, PHP, Perl, Kotlin, C++, and Shell currently provide a
lighter docs-plus-rule entrypoint while their deeper examples and pack
inventories evolve.

## How assistants should choose a pack

- match on dominant file extensions and build files first
- prefer the most specific seeded pack available
- use the workflow-quality bundle whenever the task needs spec, plan,
  implement, or validate loops
