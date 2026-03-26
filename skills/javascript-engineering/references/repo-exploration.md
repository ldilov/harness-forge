# Repo Exploration

## Inspect these files first

- `package.json` and lockfiles
- bundler and test config such as Vite, Webpack, Rollup, Vitest, Jest, or Playwright config
- CLI entrypoint scripts, `bin` declarations, and publish config
- SSR, serverless, worker, or browser deployment config
- package `exports`, `imports`, and top-level `type`

## Classify the runtime shape

- **Node service**: request handling, env loading, and operational behavior matter most
- **Browser app**: bundler, code-splitting, asset handling, and hydration matter
- **CLI or tooling**: shebangs, path handling, cross-platform spawn behavior, and package publishing matter
- **Library**: public entrypoints, side effects, tree shaking, and semver matter

## High-signal risk surfaces

- mixed `.cjs` and `.mjs` modules
- private internal files consumed by downstream imports
- shared code that assumes both Node and browser globals
- build output checked into source or consumed by tests
- root scripts that orchestrate many packages with hidden dependencies
