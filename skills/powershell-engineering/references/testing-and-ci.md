# Testing and CI

## Testing
- Pester for unit and integration tests
- isolate filesystem/process/network dependencies behind functions when feasible
- assert object shape and side effects separately

## CI
- verify PowerShell edition and OS matrix assumptions
- keep scripts non-interactive in automation contexts
- prefer structured errors over host-only messaging
