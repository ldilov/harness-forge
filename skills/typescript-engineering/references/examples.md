# Examples

## Example: Introduce discriminated union for payment flow
Replace boolean flags and nullable fields with a tagged union of `pending | authorized | captured | failed`.

## Example: Refactor unsafe API client
- validate JSON payload at boundary
- map DTO -> domain model
- return `Result`-like union instead of throwing for expected failures

## Example: Add package to monorepo
- define package boundary
- add build/test scripts
- reference from dependents via workspace package, not relative imports
