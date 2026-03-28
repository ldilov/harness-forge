# Quickstart

```bash
npx @harness-forge/cli
npx @harness-forge/cli init --root . --agent codex --setup-profile recommended --yes
npx @harness-forge/cli init --root . --agent codex --dry-run
npx @harness-forge/cli bootstrap --root .
npx @harness-forge/cli init --root . --json
npx @harness-forge/cli commands --json
npm run validate:release
```

## Source checkout flow

```bash
npm install
npm run build
node dist/cli/index.js catalog --json
node dist/cli/index.js init --root . --json
node dist/cli/index.js install --target codex --lang typescript --with workflow-quality --dry-run
node dist/cli/index.js refresh --root .
node dist/cli/index.js review --root . --json
node dist/cli/index.js recommend tests/fixtures/benchmarks/typescript-web-app --json
npm run validate:local
npm run validate:release
```

## Flow

1. use published `npx` when you want zero-build bootstrap into a repo
2. use the no-argument interactive flow when you want guided folder, target,
   setup-profile, and review behavior
3. use direct `init --agent ... --yes` when you need automation-safe setup
4. build from source only when you are developing Harness Forge itself
5. choose a target (`claude-code` or `codex`)
6. preview the install plan for the language and capability bundles you need
7. inspect an existing repository with `recommend` when the right pack is not obvious
8. use `refresh`, `task`, `pack`, `review`, and `export` to inspect the hidden runtime once work is in flight
9. use `.specify/` and the promoted skills for real work
