# Examples

## Example: Add endpoint to Express service
- find router registration
- inspect validation and error middleware
- add service call, not business logic in controller
- mirror integration test style and payload assertions

## Example: Fix memory leak in worker
- inspect timers, listeners, caches, retained closures
- confirm with heap snapshots or lifecycle logging
- remove listener duplication and add regression guard

## Example: Modernize package exports
- inspect consumers and build targets
- define `exports` map carefully
- maintain compatibility notes for CJS/ESM consumers
