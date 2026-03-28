# Release Process

## Release stages

1. Prepare the branch and update user-facing docs.
2. Run `npm run validate:local`.
3. Run `npm run release:dry-run`.
4. Review `CHANGELOG.md` and release notes scope.
5. Tag the release and let GitHub Actions run the publish workflow.

## Required checks

- `npm run build`
- `npm test`
- `npm run validate:package-surface`
- `npm run validate:doc-command-alignment`
- `npm run validate:runtime-consistency`
- `npm run validate:release`

## Publish posture

- the package is published from GitHub Actions, not an ad hoc local shell
- release validation must complete before `npm publish`
- the workflow should leave a packed artifact and a traceable release record

## Post-release verification

- confirm `npx @harness-forge/cli --help` works
- confirm `npx @harness-forge/cli init --root . --json` works in a clean temp repo
- confirm the published tarball still contains the expected docs, manifests, schemas, and target payloads
