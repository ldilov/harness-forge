# Validation

## Maintainer path

Use this before opening a PR:

```bash
npm run validate:local
```

That path covers build, tests, package-surface checks, docs/command alignment,
and runtime consistency.

## Release path

Use this before tagging or publishing:

```bash
npm run validate:release
npm run release:dry-run
```

That path adds smoke execution of the built CLI plus the broader release-grade
validators used by CI.

## Useful targeted checks

- `npm run smoke:cli`
- `npm run validate:package-surface`
- `npm run validate:doc-command-alignment`
- `npm run validate:runtime-consistency`
- `npm run validate:compatibility`
