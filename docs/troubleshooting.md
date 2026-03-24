# Troubleshooting

## Node runtime issues

- confirm Node.js 22+ is available on the PATH
- rebuild with `npm run build` before using `install.sh` or `install.ps1`

## Missing seeded language content

- run `npm run validate:seeded-coverage`
- inspect `manifests/catalog/seeded-knowledge-files.json`
- confirm the missing file still exists under `knowledge-bases/seeded/`

## Missing validator bundle files

- run `npm run validate:package-surface`
- confirm `scripts/templates/README.md` and the script/config files are present

## Target install surprises

- use `--dry-run` first to preview copy and merge behavior
- inspect `targets/<target>/adapter.json` for path mapping behavior
- confirm the target supports the capability you are installing
