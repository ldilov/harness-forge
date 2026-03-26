# Package Contracts

## Exports and imports

Use `exports` to define the public package surface. It takes precedence over `main` in modern Node versions, encapsulates unexported subpaths, and is recommended for new packages. Adding `exports` to an existing package is often a breaking change unless every previously supported entrypoint remains exported.

## Safe package changes

- preserve existing consumer entrypoints when possible
- document default vs named export changes
- keep `main` aligned with `exports` when compatibility with older tools matters
- avoid publishing build artifacts with unstable file names when consumers may deep-import them
