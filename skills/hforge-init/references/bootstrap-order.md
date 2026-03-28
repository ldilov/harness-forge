# Bootstrap order

1. Run `hforge status --root . --json` first to avoid bootstrapping blindly.
2. Prefer `hforge bootstrap --root . --yes` when the repo needs one-pass setup.
3. Run `hforge refresh --root . --json` immediately after bootstrap so the runtime summary, repo intelligence, and generated indexes are current.
4. Only inspect `hforge catalog --json` after the workspace exists and targets are known.
5. If bare `hforge` is unavailable, use the workspace-local launcher under `.hforge/generated/bin/` once the repo is initialized.
