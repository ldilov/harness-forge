# Browser And Bundler Patterns

## Browser boundary rules

- isolate DOM and browser API access from shared pure logic
- make loading, error, and offline states explicit
- keep side effects in startup or framework lifecycle hooks

## Bundler review checklist

- confirm aliasing and path resolution
- inspect code-splitting or lazy-load boundaries
- verify asset and CSS handling when moving files
- watch for build-time env replacement that changes runtime behavior
