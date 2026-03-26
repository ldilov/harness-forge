# Testing And Debugging

## Testing layers

- unit tests for pure modules and boundary adapters
- integration tests for HTTP, filesystem, process, or browser boundaries
- smoke tests for published CLI or bundle behavior

## Tooling notes

- ESLint is the baseline static analysis surface for JS repos
- Vitest is a good fit when the repo already uses Vite because it reuses Vite config and plugins
- when the repo is Jest-first, extend the existing harness instead of forcing a tool migration inside a feature patch
