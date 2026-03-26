# Repo Exploration

## Inspect these files first

- `package.json` and lockfiles to identify package manager and scripts
- root and package-level `tsconfig*.json`
- workspace manifests such as `pnpm-workspace.yaml`, npm or yarn workspace definitions, or monorepo config
- framework config such as `next.config.*`, `vite.config.*`, `vitest.config.*`, bundler config, and lint config
- generated API or schema clients, shared types packages, and codegen settings

## Classify the runtime shape

- **Node service or CLI**: entrypoint scripts, env loading, and package exports matter most
- **React or Next app**: client and server boundaries, bundler behavior, and route conventions matter
- **Library or SDK**: public exports, declaration output, dual-package support, and semver matter
- **Workspace or monorepo**: project references, incremental builds, and shared package contracts matter

## High-signal risk surfaces

- package `exports` or `imports`
- tsconfig inheritance and path aliasing
- generated clients or schema-derived types
- SSR and browser boundary crossings
- dynamic imports, loaders, and environment-specific entrypoints
- shared packages consumed by many apps in the workspace
