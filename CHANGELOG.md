# Changelog

## Unreleased

### Added

- production-ready `init`, `refresh`, `task`, `pack`, `review`, and `export` command surfaces
- deterministic workspace initialization with visible runtime schema metadata
- release smoke validation via `scripts/ci/smoke-runner.mjs`
- contributor and release-process documentation for local and release-grade validation

### Changed

- shared runtime metadata now records package version and runtime schema version
- CI and release guidance are aligned around `validate:local`, `validate:release`, and `release:dry-run`
