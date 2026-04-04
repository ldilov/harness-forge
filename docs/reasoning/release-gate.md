# Reasoning Release Gate

A release passes this gate only if all conditions are true:

1. Canonical/bridge parity checks pass.
2. Required reasoning docs remain linked from `docs/reasoning/index.md`.
3. Contract tests for core, ledgers, certificates, and pre-merge interfaces pass.
4. Success metrics mapping includes SC-001..SC-010.
5. Validation script exits successfully.

## Recommended command sequence

1. `npm run validate:reasoning-surfaces`
2. `npx vitest run tests/contract/reasoning/*.contract.test.ts`
3. `npm run validate:release`
