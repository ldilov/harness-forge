# Troubleshooting Guide

This guide is for operators investigating why a managed file exists, why an
update wants to touch it, or how to recover from mixed ownership and drift.

## Ownership Classes

- Managed canonical: hidden authoritative content under `.hforge/library/`
- Managed bridge: visible discovery surfaces such as `AGENTS.md`, `.agents/`, `.codex/`, and `.claude/`
- Generated runtime: derived runtime truth under `.hforge/runtime/`
- Stateful runtime: mutable runtime state under `.hforge/state/`

## Helpful Commands

```bash
hforge pack list --root . --json
hforge pack inspect baseline:agents --root . --json
hforge pack explain baseline:agents --root . --json
hforge review --root . --json
hforge doctor --root . --json
```

## Safe Recovery Path

1. Inspect installed packs and runtime manifests first.
2. Check provenance to confirm ownership and edit policy.
3. Use refresh, review, or reinstall before manually rewriting managed surfaces.
4. Prefer sanctioned overrides when a bridge needs local customization.
