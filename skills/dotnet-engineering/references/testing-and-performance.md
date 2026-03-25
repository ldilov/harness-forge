# Testing and Performance

## Testing
- xUnit or NUnit according to repo norm
- integration tests for minimal API / controllers / data access
- use TestServer/WebApplicationFactory patterns when present

## Performance
- check allocations on hot paths
- watch sync-over-async
- inspect LINQ materialization and repeated enumeration
- use caching only with ownership and invalidation clarity
