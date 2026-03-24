# Language Pack Catalog

Harness Forge language packs are modular, selectable, and now backed by real
shipped seeded content.

## Seeded starter packs

- TypeScript: `knowledge-bases/seeded/typescript/`
- Java: `knowledge-bases/seeded/java/`
- .NET: `knowledge-bases/seeded/dotnet/`
- Lua: `knowledge-bases/seeded/lua/`
- PowerShell: `knowledge-bases/seeded/powershell/`

## What to inspect in each pack

- `docs/overview.md`
- `docs/review-checklist.md`
- `docs/frameworks.md`
- `examples/`
- `rules/common/`
- `rules/<language>/`

## Selection guidance

- choose the pack that matches the dominant repo language
- keep the seeded pack installed alongside `workflow-quality` when you want
  structured spec and validation flows
- use `manifests/catalog/language-assets.json` for machine-readable pack
  discovery
