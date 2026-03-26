# Examples

## Add an endpoint safely

1. find the current HTTP seam and auth pattern
2. add request validation and result mapping at the edge
3. implement behavior in the existing application or service layer
4. add integration coverage for serialization and middleware-sensitive behavior

## Add a background job

1. identify queue, schedule, or trigger semantics
2. isolate the work into a testable unit
3. make retries, cancellation, and idempotency explicit
4. add observability and operational notes with the code change

## Review a migration-backed feature

1. compare old and new code against the intermediate schema state
2. verify generated migration or SQL for data-loss or lock risk
3. define deployment order and post-deploy checks
4. surface rollback or forward-fix assumptions
