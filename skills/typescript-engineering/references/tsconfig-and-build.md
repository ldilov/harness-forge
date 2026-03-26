# TSConfig And Build

## Module resolution heuristics

- use `node16` or `nodenext` when the runtime is modern Node and both `import` and `require` semantics matter
- use `bundler` when the code is primarily consumed through a bundler and extension rules should stay bundler-friendly
- align `module`, `moduleResolution`, and emitted package shape before touching imports in a large repo

## Project references

Use project references when a workspace needs faster incremental builds, clearer package boundaries, or independent emit steps. They work best when each package has a clean entrypoint and explicit dependencies.

## Build graph pitfalls

- path aliases that compile but do not resolve at runtime
- declaration emit that does not match the exported surface
- multiple tsconfig layers with conflicting strictness or JSX settings
- mixed ESM and CommonJS output without an explicit package strategy

## Safe change order

1. understand the current module and emit strategy
2. change the minimal tsconfig surface needed
3. typecheck the affected packages
4. build the actual consumer path, not just the edited package
