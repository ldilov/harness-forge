# Quickstart

```bash
npx @harness-forge/cli bootstrap --root .
npx @harness-forge/cli commands --json
npm run validate:release
```

## Source checkout flow

```bash
npm install
npm run build
node dist/cli/index.js catalog --json
node dist/cli/index.js install --target codex --lang typescript --with workflow-quality --dry-run
node dist/cli/index.js recommend tests/fixtures/benchmarks/typescript-web-app --json
npm run validate:release
```

## Flow

1. use published `npx` when you want zero-build bootstrap into a repo
2. build from source only when you are developing Harness Forge itself
3. choose a target (`claude-code` or `codex`)
4. preview the install plan for the language and capability bundles you need
5. inspect an existing repository with `recommend` when the right pack is not obvious
6. use `.specify/` and the promoted skills for real work
