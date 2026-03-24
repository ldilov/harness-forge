# harness-forge Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-03-25

## Active Technologies
- TypeScript 5.x on Node.js 22 LTS; Markdown + YAML front matter; JSON manifests; POSIX shell and PowerShell for validation utilities + Existing CLI/runtime stack in `package.json` (`commander`, `fast-glob`, `yaml`, `zod`, `ajv`) plus built-in filesystem/process tooling (002-docs-content-packaging)
- Repository files and published package contents; no database required (002-docs-content-packaging)

- TypeScript 5.x on Node.js 22 LTS; POSIX shell and PowerShell 7+ for bootstrap and validation scripts + Commander-style CLI parser, Zod, YAML front matter parser, AJV JSON Schema validation, fast-glob, execa, tar/fs utilities, Vitest, Pester (001-agentic-kb-optimizer)

## Project Structure

```text
src/
tests/
```

## Commands

npm test; npm run lint

## Code Style

TypeScript 5.x on Node.js 22 LTS; POSIX shell and PowerShell 7+ for bootstrap and validation scripts: Follow standard conventions

## Architecture Rules

- Prefer small modules with explicit contracts and dependency direction.
- Keep domain logic separate from transport, persistence, and framework glue.
- Justify new abstractions when a simpler structure would work.

## Quality Gates

- Define executable verification before implementing behavior changes.
- Validate inputs at system boundaries and keep secrets out of source control.
- Update docs and shared agent guidance when commands, architecture, or behavior change.

## Recent Changes
- 002-docs-content-packaging: Added TypeScript 5.x on Node.js 22 LTS; Markdown + YAML front matter; JSON manifests; POSIX shell and PowerShell for validation utilities + Existing CLI/runtime stack in `package.json` (`commander`, `fast-glob`, `yaml`, `zod`, `ajv`) plus built-in filesystem/process tooling

- 001-agentic-kb-optimizer: Added TypeScript 5.x on Node.js 22 LTS; POSIX shell and PowerShell 7+ for bootstrap and validation scripts + Commander-style CLI parser, Zod, YAML front matter parser, AJV JSON Schema validation, fast-glob, execa, tar/fs utilities, Vitest, Pester

<!-- MANUAL ADDITIONS START -->
## Seeded Knowledge Usage

- When the repo contains `.ts` or `.tsx`, prefer `knowledge-bases/seeded/typescript/`.
- When the repo contains `.java`, prefer `knowledge-bases/seeded/java/`.
- When the repo contains `.cs`, `.csproj`, or `.sln`, prefer `knowledge-bases/seeded/dotnet/`.
- When the repo contains `.lua`, prefer `knowledge-bases/seeded/lua/`.
- When the repo contains `.ps1` or `.psm1`, prefer `knowledge-bases/seeded/powershell/`.
- Use `docs/catalog/language-packs.md` and `manifests/catalog/language-assets.json` as the discovery layer before falling back to directory browsing.

## Release Validation

- Run `npm run validate:release` before publishing or handing off a packaged surface.
- If seeded language content changes, update `manifests/catalog/seeded-knowledge-files.json`.
- If docs, templates, or validators reference a file, keep it inside `package.json.files` and `manifests/catalog/package-surface.json`.
<!-- MANUAL ADDITIONS END -->
