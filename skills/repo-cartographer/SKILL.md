# Repo Cartographer

Use this skill when you need a repo-aware map before recommending new guidance
surfaces.

Start with:

- `node scripts/intelligence/cartograph-repo.mjs <repo> --json`
- `node scripts/intelligence/classify-boundaries.mjs <repo> --json`
- `node scripts/intelligence/synthesize-instructions.mjs <repo> --dry-run --json`
