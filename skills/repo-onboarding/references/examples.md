# Examples

## Good onboarding summary

- this is a pnpm monorepo with one API, one web app, and two shared packages
- the CI source of truth is the root workflow that runs `pnpm lint`, `pnpm test`, and app-specific builds
- `CODEOWNERS` suggests the platform team owns root config and shared contracts
- the next step for an API bug is to inspect the service package and its generated client package together

## Weak onboarding summary

- there are many files and some JavaScript
- maybe run the tests
