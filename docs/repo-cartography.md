# Repo Cartography

Harness Forge uses repo cartography to separate observed repository facts from
instruction recommendations.

Current scaffolded surfaces:

- `node scripts/intelligence/cartograph-repo.mjs <repo> --json`
- `node scripts/intelligence/classify-boundaries.mjs <repo> --json`
- `node scripts/intelligence/synthesize-instructions.mjs <repo> --dry-run --json`

The contract-backed output is designed to stay inspectable and conservative.
