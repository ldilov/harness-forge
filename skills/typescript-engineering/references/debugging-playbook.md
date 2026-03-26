# Debugging Playbook

## Types pass, runtime fails

Check environment assumptions first: ESM vs CommonJS, browser vs server globals, path alias resolution, and whether generated output matches the source tree the runtime actually executes.

## Build passes, tests fail

Inspect module mocks, hoisting behavior, fake timers, and environment configuration. Many test failures come from setup differences rather than business logic.

## Monorepo package drift

Check stale build output, declaration artifacts, cached references, and whether the consumer imports source or package output. A surprisingly common bug is editing one package without rebuilding the package another app actually consumes.

## Serialization or API mismatch

Validate the runtime payload, not just the TypeScript type. Confirm nullability, enum values, date encoding, and optional vs absent field semantics.

## Browser-only or SSR-only bug

Trace where code crosses the client/server boundary, where side effects run, and whether the bundler tree-shook or split the module the way the author expected.
