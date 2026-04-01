# Contributing

## Local setup

```bash
npm install
npm run build
```

## Validation levels

- `npm run validate:local` for the routine maintainer path before opening a PR
- `npm run validate:release` for the full release-grade gate
- `npm run validate:dedup` when changing language-pack ownership, wrappers, or generated-surface metadata
- `npm run release:dry-run` before tagging or publishing a package candidate

## Typical contributor loop

1. Run `npm run build`.
2. Run targeted tests while changing code.
3. Run `npm run validate:local` before asking for review.
4. Update `README.md`, `docs/`, or `CHANGELOG.md` if the operator surface changed.

## Release-sensitive changes

Treat these as production-facing:

- `package.json` and `.npmignore`
- `src/cli/`
- `src/application/install/`
- `scripts/ci/`
- `.github/workflows/`
- `README.md` and `docs/commands.md`

## Troubleshooting

- use `hforge doctor --root <repo>` when install/runtime state looks wrong
- use `hforge audit --root <repo>` for a fuller package/runtime summary
- use `hforge refresh --root <repo>` after install changes when shared runtime artifacts drift
