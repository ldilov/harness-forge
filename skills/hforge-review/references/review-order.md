# Review order

1. `hforge review --root . --json`
2. `.hforge/runtime/decisions/index.json`
3. `.hforge/runtime/tasks/`
4. `hforge doctor --root . --json` when managed surfaces look incomplete
5. `hforge audit --root . --json` when package-surface integrity matters
