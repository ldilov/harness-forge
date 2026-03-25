# Examples

## Example: Convert admin script into module command
- extract reusable function with approved verb-noun name
- add parameter validation and pipeline support
- return objects and keep formatting in wrapper/example usage
- add Pester tests

## Example: Safe bulk operation
- implement `SupportsShouldProcess`
- dry-run by default when repository patterns support it
- emit summary object with successes/failures

## Example: Debug remoting failure
- isolate auth vs network vs endpoint config
- log target/session details
- retry only when the operation is safe and idempotent
