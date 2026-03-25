# Debugging and Testing

## Debugging
- inspect nil propagation and table shape assumptions
- confirm event order and reentrancy
- guard against mutation of shared tables passed by reference

## Testing
Many Lua repos have weak formal tests. When tests are absent:
- create small reproducible fixtures
- isolate pure transformations
- add assertions around serialization/config parsing
