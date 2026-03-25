# Quality Gates

Harness Forge quality gates should reject shallow or misleading product
surfaces, not only broken JSON.

## Current gate families

- release smoke
- content metadata validation
- seeded knowledge coverage
- generated sync validation
- package-surface validation
- benchmark recommendation checks

## What new gates should prove

- no placeholder-grade docs or skills ship as "complete"
- framework coverage matches recommendation logic
- docs and commands stay aligned
- package manifests match runtime behavior
