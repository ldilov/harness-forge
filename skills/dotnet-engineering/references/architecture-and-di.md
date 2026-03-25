# Architecture and Dependency Injection

## Typical Layers
- API/transport
- application/services
- domain
- infrastructure

## DI Rules
- register composition in startup/program root
- avoid service locator patterns
- keep abstractions at meaningful boundaries, not everywhere
- prefer options binding for configuration
