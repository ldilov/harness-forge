# Monorepo Signals

## Look for

- workspace manifests
- shared config inherited by many packages
- package boundaries that align with deployable units or domains
- generated contract packages consumed by multiple apps
- dependency direction between apps and shared libraries

## Hotspots

- root lockfiles and global config
- shared schema or API packages
- generated clients
- root lint, formatting, and test orchestration
- deployment and release scripts that touch many packages at once
