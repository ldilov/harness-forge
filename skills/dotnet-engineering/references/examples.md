# Examples

## Example: Add endpoint with EF-backed service
- endpoint validates request
- service orchestrates use case
- repository or DbContext access stays in infrastructure layer style used by repo
- add API test and persistence-focused test

## Example: Fix deadlock/sync-over-async
- locate `.Result` / `.Wait()` / blocking call chain
- convert call stack to async end-to-end
- verify cancellation token plumbing

## Example: Extract domain logic from controller
- move rules into application/domain service
- leave mapping and HTTP concerns in endpoint layer
