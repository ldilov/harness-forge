# Quickstart

```bash
npx @harness-forge/cli
npx @harness-forge/cli shell setup --yes
npx @harness-forge/cli init --root . --agent codex --setup-profile recommended --yes
npx @harness-forge/cli init --root . --agent codex --dry-run
npx @harness-forge/cli bootstrap --root .
npx @harness-forge/cli init --root . --json
hforge commands --json
npm run validate:release
```

## Source checkout flow for maintainers

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
2. run `shell setup` once if you want bare `hforge` on PATH without a global install
3. use the no-argument interactive flow when you want guided folder, target,
   setup-profile, and review behavior
4. use direct `init --agent ... --yes` when you need automation-safe setup
5. build from source only when you are developing Harness Forge itself
6. choose a target (`claude-code` or `codex`)
7. preview the install plan for the language and capability bundles you need
8. inspect an existing repository with `recommend` when the right pack is not obvious
9. use `refresh`, `task`, `pack`, `review`, and `export` to inspect the hidden runtime once work is in flight
10. use `.specify/` and the promoted skills for real work
