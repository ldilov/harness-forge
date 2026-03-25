# Target install notes

The package now ships `targets/codex/runtime/.codex/` and
`targets/claude-code/runtime/.claude/` so runtime surfaces are real instead of
implied.

Canonical target support truth lives in
`manifests/catalog/harness-capability-matrix.json`.

Use it when you need to answer:

- which capabilities are native, translated, emulated, or documentation-only
- what fallback behavior degraded support requires
- whether a support claim is still aligned with the generated
  `docs/target-support-matrix.md` surface
