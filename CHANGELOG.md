# Changelog

## Unreleased

### Added

- production-ready `init`, `refresh`, `task`, `pack`, `review`, and `export` command surfaces
- deterministic workspace initialization with visible runtime schema metadata
- release smoke validation via `scripts/ci/smoke-runner.mjs`
- contributor and release-process documentation for local and release-grade validation
- promoted recursive structured-analysis command surfaces with durable run records and capability truth
- non-destructive `hforge update` / `hforge upgrade` flows that preserve gathered runtime state while refreshing managed surfaces

### Changed

- shared runtime metadata now records package version and runtime schema version
- CI and release guidance are aligned around `validate:local`, `validate:release`, and `release:dry-run`
- target guidance now keeps recursive structured-analysis support claims honest across Codex, Claude Code, Cursor, and OpenCode
