# Node Service Patterns

## Typical Layers
- transport/controller/router
- validation
- service/use-case
- data access/integration adapter
- observability and error translation

## Common Checks
- async error propagation through middleware
- config normalization at startup
- graceful shutdown
- retry policy around external calls
- backpressure or queue semantics where relevant
