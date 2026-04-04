# Validation Plan

## Purpose

Define recurring validation checks that prevent drift between canonical reasoning surfaces, bridge files, and governance expectations.

## Validation Layers

1. Contract tests
   - Template section contracts
   - Certificate structure contracts
   - Pre-merge outcome contracts
2. Parity tests
   - Canonical and bridge file parity for shared artifacts
3. Documentation integrity tests
   - Required reasoning docs linked and present
4. Success metric coverage tests
   - SC-001..SC-010 mapped to operational metrics
5. Scripted CI validation
   - `scripts/ci/validate-reasoning-surfaces.mjs`

## Ownership

- Artifact maintainers: template and bridge updates
- Review maintainers: governance docs and checklists
- CI maintainers: validation script and command catalog routing

## Cadence

- Per PR: targeted contract tests and scripted validation
- Weekly: audit samples for recommendation quality and assumption visibility
- Per release: full parity and metrics review
