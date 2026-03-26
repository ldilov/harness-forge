# Examples

## Tighten an API contract

1. validate the payload at the edge
2. narrow internal types after validation
3. update the shared client or schema package only if the contract itself changed
4. run typecheck on both provider and consumer paths

## Introduce a shared package safely

1. confirm two or more real consumers need the shared surface
2. define a narrow public API and explicit exports
3. move only stable code first
4. validate build, lint, and consumer imports before wider extraction

## Fix an ESM or CommonJS bug

1. inspect `package.json` `type`, `exports`, and test runner config
2. align tsconfig with the actual runtime
3. update imports or output shape with the smallest compatible change
4. re-run the real runtime path, not just typecheck
