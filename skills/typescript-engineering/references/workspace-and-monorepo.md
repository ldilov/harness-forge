# Workspace And Monorepo

## Good monorepo signals

- clear package ownership and naming
- stable package entrypoints and dependency direction
- root scripts that delegate to per-package tasks consistently
- cached or incremental builds that understand package boundaries

## Hot overlap surfaces

- root lockfiles and workspace config
- generated API clients or shared schema packages
- lint or formatting config consumed by every package
- root TypeScript config inheritance
- package `exports` used by many apps

## Safe workspace moves

- change one package contract at a time
- rebuild direct consumers when shared types change
- keep import paths package-based rather than source-path based when publishability matters
- document cross-package breaking changes even inside a single repo
