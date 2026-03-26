# Debugging Playbook

## Startup fails before first request

Check DI registration, options binding, and environment-dependent configuration first. Startup exceptions often come from missing configuration values, invalid options, or a service lifetime mismatch.

## Request succeeds locally but fails in integration or staging

Inspect middleware order, auth configuration, serialization options, culture or timezone assumptions, and reverse-proxy headers. Many ASP.NET issues are environment-shape problems, not controller logic bugs.

## Data behavior is wrong

Inspect generated SQL, tracking mode, transaction scope, and whether a migration changed the data shape the code expects. Prefer reproducing with the actual query rather than guessing from LINQ alone.

## Background worker looks idle or duplicated

Trace startup registration, host lifetime, queue polling cadence, and cancellation handling. Look for scoped services captured by singletons, unbounded retries, or swallowed exceptions inside loops.

## CI-only failures

Compare SDK version, analyzer severity, OS path behavior, and test ordering. Many .NET CI regressions come from stricter analyzers, pinned SDK differences, or tests that share state.
