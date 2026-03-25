# Debugging Playbook

## Triage Flow
1. Reproduce with the narrowest failing command or input.
2. Classify: build failure, runtime exception, wrong output, performance regression, flaky behavior.
3. Inspect the closest automated test or create one.
4. Trace input -> transformation -> side effects -> output.
5. Confirm before fixing: logs, assertions, debugger, profiling, or targeted instrumentation.

## Root Cause Buckets
- environment/config mismatch
- type or shape mismatch
- async/concurrency ordering
- serialization/deserialization drift
- contract mismatch across module boundaries
- dependency/version assumptions
- hidden mutable state or caching

## Fix Quality Bar
A strong fix should include:
- minimal blast radius
- a regression test or reproducible verification
- removal of dead code or misleading comments when relevant
- notes on whether backporting is safe
