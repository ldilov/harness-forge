# Production Readiness Demo

This example is a tiny repo used to sanity-check Harness Forge production
flows.

## Suggested flow

```bash
hforge init --root . --json
hforge bootstrap --root . --yes
hforge review --root . --json
hforge export --root . --json
```

Use it when you want a clean workspace to verify init, install, review, and
export behavior without touching a larger application repo.
