# Testing and Debugging

## Test Defaults
- `vitest` or `jest` depending on repository
- `supertest` for HTTP endpoints when Express/Fastify style apps are used
- browser tests only when the repo already uses Playwright/Cypress/Webdriver flows

## Debugging Hotspots
- ESM/CJS import mismatch
- undefined due to circular dependency timing
- event-loop starvation or unawaited promises
- serialization mismatch across API boundaries
- bundler alias/resolution differences between build and test
