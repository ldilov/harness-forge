# Repo Exploration Guide

## Goal
Help the agent map an unfamiliar repository fast without re-researching standard heuristics.

## Exploration Order
1. Read `README*`, `package.json`, `pyproject.toml`, `pom.xml`, `*.csproj`, `go.mod`, `Cargo.toml`, or equivalent manifest.
2. Identify entrypoints: CLI, service bootstrap, app host, worker, lambda/function handlers, tests.
3. Locate dependency boundaries: core domain, infrastructure, adapters, UI, shared libraries.
4. Inspect CI and automation: `.github/workflows`, `azure-pipelines.yml`, `Jenkinsfile`, `Dockerfile`, IaC.
5. Inspect tests to infer intended behavior before modifying implementation.
6. Search for configuration, feature flags, secrets handling, and environment assumptions.
7. Trace hot paths from public API or command surface inward.

## What to Extract
- build system and package manager
- runtime versions and compatibility constraints
- architecture style (layered, modular monolith, microservice, plugin, hexagonal)
- naming conventions and folder semantics
- state boundaries: persistence, cache, external APIs, queues
- extension points and anti-corruption layers
- risky areas: reflection, dynamic imports, generated files, migrations, security-sensitive code

## Output Template
### Repository Map
- Purpose:
- Entry points:
- Build/test commands:
- Main modules:
- Persistence/external systems:
- Cross-cutting concerns:
- High-risk areas:

### Change Strategy
- Safe insertion point:
- Code paths affected:
- Tests to add/update:
- Rollback strategy:

## Example
Input: "Add rate limiting to a Node API repo"
Output should identify middleware composition, framework bootstrap, shared error handling, config loading, and observability hooks before suggesting a patch.
