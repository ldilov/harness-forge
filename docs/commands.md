# Commands

Harness Forge exposes catalog, install, maintenance, status, and template
validation commands through the `hforge` CLI.

## Core command groups

- `install` for initial target bootstrap
- `status` for current workspace state
- `catalog` for bundles, targets, profiles, and recommendations
- `template` for template validation flows
- `backup`, `repair`, `restore`, and `uninstall` for maintenance

## Common examples

```bash
node dist/cli/index.js catalog --json
node dist/cli/index.js list --json
node dist/cli/index.js add --target codex --lang typescript --dry-run
node dist/cli/index.js template validate --json
```

## Operational docs

- `commands/plan.md`
- `commands/test.md`
