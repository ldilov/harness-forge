# Maintenance Lifecycle

Harness Forge maintenance should answer three questions quickly:

1. what is installed
2. what drifted or went stale
3. what is safe to repair, prune, or upgrade

## Primary commands

| Command | Purpose |
| --- | --- |
| `doctor` | quick health check for missing paths, bundles, and surface drift |
| `audit` | detailed install-state summary |
| `diff-install` | compare recorded managed files against what still exists |
| `sync` | normalize duplicated install-state entries |
| `upgrade-surface` | explain how to refresh an older install safely |
| `prune` | identify duplicate recorded writes before cleanup |
| `repair` / `restore` / `backup` | lifecycle commands from the earlier maintenance wave |

## Recommended order

1. run `doctor` to spot obvious drift
2. run `audit` for the full install-state summary
3. use `diff-install` and `sync` to understand state mismatch
4. use `upgrade-surface` before refreshing an older install
5. use `prune` only after reviewing the candidates

## Example commands

```bash
node dist/cli/index.js doctor --json
node dist/cli/index.js audit --json
node dist/cli/index.js diff-install --json
node dist/cli/index.js sync --json
node dist/cli/index.js upgrade-surface --json
node dist/cli/index.js prune --json
```

## Operator expectations

- maintenance commands should be diagnostic first and destructive second
- drift should point to concrete files or bundle ids
- upgrade guidance should tell the operator what to rerun next
- prune should never remove state silently without explicit opt-in

## Imported skill maintenance

- review `manifests/catalog/enhanced-skill-import-inventory.json` before
  refreshing or pruning any embedded skill-pack content
- keep `docs/authoring/enhanced-skill-import.md` aligned with the actual
  embedded scope and provenance
- run `npm run validate:skill-depth` after any skill-pack refresh so missing
  sections or sentinel references fail fast
