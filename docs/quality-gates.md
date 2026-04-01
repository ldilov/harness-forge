# Quality Gates

Interactive CLI changes are protected by dedicated contract and integration
coverage for:

- no-argument onboarding entry
- project-hub routing in initialized repos
- non-interactive and CI-safe fallback behavior
- no-color and narrow-terminal rendering
- direct `init --agent ... --yes|--dry-run` compatibility

Harness Forge quality gates should reject shallow or misleading product
surfaces, not only broken JSON.

## Daily maintainer gate

Run `npm run validate:local` before opening or updating a PR.

That path proves:

- the project still builds
- tests pass
- the packed install surface is still valid
- docs and commands still match
- runtime/manifests still line up

## Release gate

Run `npm run validate:release` or `npm run release:dry-run` before publish.

That path adds:

- CLI smoke execution through the built package entrypoint
- template and content validation
- package-surface verification
- PowerShell workflow checks where available
- release-oriented command/help checks

## Gate families

- release smoke
- CLI smoke
- content metadata validation
- seeded knowledge coverage
- generated sync validation
- context-surface dedup validation
- package-surface validation
- benchmark recommendation checks
- docs and command alignment

## What the gates should prove

- no placeholder-grade docs or skills ship as "complete"
- framework coverage matches recommendation logic
- docs and commands stay aligned
- package manifests match runtime behavior
- release candidates are package-safe before publish
