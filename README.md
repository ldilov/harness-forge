# Harness Forge

Harness Forge is a modular knowledge base and optimizer for agentic AI
workspaces. It packages target-aware guidance, real seeded language packs,
workflow templates, and validator scripts for Codex, Claude Code, and adjacent
repo-root agent environments.

## What ships today

- target-aware install planning and apply flows for Codex and Claude Code
- seeded TypeScript, Java, .NET, Lua, and PowerShell knowledge packs with real
  docs, rules, examples, and metadata under `knowledge-bases/seeded/`
- workflow templates plus the full shell and PowerShell validator bundle under
  `scripts/templates/`
- package-surface and release validation manifests that keep installs and docs
  aligned

## Start here

1. Install dependencies and build the CLI:

   ```bash
   npm install
   npm run build
   ```

2. Inspect what the package knows how to install:

   ```bash
   node dist/cli/index.js catalog --json
   ```

3. Preview a target-aware install:

   ```bash
   node dist/cli/index.js add --target codex --lang typescript --with workflow-quality --dry-run
   ```

4. Validate the shipped content surface:

   ```bash
   npm run validate:release
   ```

## Recommended reading

- `docs/quickstart.md` for the fastest end-to-end smoke path
- `docs/installation.md` for install, repair, uninstall, and offline checks
- `docs/targets.md` for Codex and Claude Code compatibility notes
- `docs/languages.md` for the seeded language pack matrix
- `docs/catalog/language-packs.md` for direct links into the shipped knowledge
  bases

## Agent usage cues

Harness Forge is designed so assistants can decide when to use it:

- if a repo contains `.ts` or `.tsx`, prefer the TypeScript pack
- if a repo contains `.java`, prefer the Java pack
- if a repo contains `.cs`, `.sln`, or `.csproj`, prefer the .NET pack
- if a repo contains `.lua`, prefer the Lua pack
- if a repo contains `.ps1` or `.psm1`, prefer the PowerShell pack
- if a task needs structured implementation workflows, load the shipped
  templates and validator bundle

## Validation and release gates

- `npm run validate:catalog`
- `npm run validate:content-metadata`
- `npm run validate:seeded-coverage`
- `npm run validate:generated-sync`
- `npm run validate:package-surface`
- `npm run validate:release`

## Current status

The 002 documentation and package-surface feature now treats the seeded
knowledge bases and template validator bundle as first-class shipped content,
not placeholder directories.
