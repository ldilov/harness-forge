# Benchmark Scenarios

Harness Forge uses representative fixture repositories to keep recommendation
quality and support honesty grounded in observable behavior.

## Current benchmark set

- `typescript-web-app`: React + Vite style frontend
- `python-service`: FastAPI-oriented backend
- `java-service`: Spring-oriented service shape
- `dotnet-api`: ASP.NET Core API
- `go-cli`: Go command-line application
- `monorepo`: mixed-language or multi-package workspace
- `legacy-repo`: older repository with drift and uneven conventions
- `security-service`: security-sensitive service shape

## What benchmarks validate

- language and framework detection
- evidence-backed recommendation ranking
- profile and skill recommendations
- support-surface claims made in docs and manifests

## Related surfaces

- `tests/fixtures/benchmarks/`
- `scripts/intelligence/`
- `docs/catalog/framework-packs.md`
- `manifests/catalog/framework-assets.json`
