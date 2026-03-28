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
| `refresh` | rewrite shared runtime summaries and baseline repo-intelligence artifacts |
| `update` / `upgrade` | download the requested published Harness Forge version and reapply managed surfaces while preserving gathered runtime state |
| `sync` | normalize duplicated install-state entries |
| `upgrade-surface` | explain how to refresh an older install safely |
| `prune` | identify duplicate recorded writes before cleanup |
| `repair` / `restore` / `backup` | lifecycle commands from the earlier maintenance wave |

## Recommended order

1. run `doctor` to spot obvious drift
2. run `audit` for the full install-state summary
3. use `refresh` when installed targets are correct but shared runtime summaries drifted
4. use `update --dry-run --yes` to preview a non-destructive package refresh when you want newer managed content
5. use `diff-install` and `sync` to understand state mismatch
6. use `upgrade-surface` before refreshing an older install if you only need guidance
7. use `prune` only after reviewing the candidates

## Example commands

```bash
hforge doctor --json
hforge audit --json
hforge refresh --root . --json
hforge update --root . --dry-run --yes
hforge update --root . --yes
hforge diff-install --json
hforge sync --json
hforge upgrade-surface --json
hforge prune --json
```

## Operator expectations

- maintenance commands should be diagnostic first and destructive second
- drift should point to concrete files or bundle ids
- update should preserve gathered runtime state such as task artifacts, decision indexes, recursive sessions, and observability signals
- upgrade guidance should tell the operator what to rerun next
- prune should never remove state silently without explicit opt-in
- refresh should be safe to rerun and should not require reinstalling bundles just to regenerate runtime summaries

## Imported skill maintenance

- review `manifests/catalog/engineering-assistant-import-inventory.json` before
  refreshing or extending the engineering-assistant port
- keep `docs/authoring/engineering-assistant-port.md` aligned with the actual
  embedded scope, helper translation plan, and runtime-compatibility notes
- review `manifests/catalog/enhanced-skill-import-inventory.json` before
  refreshing or pruning any embedded skill-pack content
- keep `docs/authoring/enhanced-skill-import.md` aligned with the actual
  embedded scope and provenance
- run `npm run validate:skill-depth` after any skill-pack refresh so missing
  sections or sentinel references fail fast
