# Release Readiness

## Runtime Governance Gates

Release validation must pass the following gates:

1. hot-path budget
2. canonicality completeness
3. duplicate threshold
4. bridge size discipline
5. cold-surface leakage
6. output-profile coverage
7. target support honesty

## Stage Progression

1. Observe baseline metrics.
2. Add authority and budget metadata.
3. Trim bridge surfaces.
4. Enable dedup retrieval and output profiles.
5. Harden CI gates and block regression.

## Required Commands

```powershell
npm run build
npx vitest run
npm run validate:release
```
