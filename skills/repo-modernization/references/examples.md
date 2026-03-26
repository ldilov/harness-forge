# Examples

## Healthy modernization plan

- first repair CI and document the release path
- then upgrade the package manager and lockfile discipline
- then automate dependency updates
- only after that extract the legacy service adapter behind a stable interface

## Risky modernization plan

- rewrite the service into a new framework
- upgrade every dependency at once
- move to a new database access layer in the same release
- remove the old path before telemetry proves parity
