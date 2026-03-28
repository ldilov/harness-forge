# Target install notes

The package now ships `targets/codex/runtime/.codex/` and
`targets/claude-code/runtime/.claude/` so runtime surfaces are real instead of
implied.

Installed workspaces also compile a shared runtime under `.hforge/runtime/`.
Installed workspaces keep the canonical AI content under `.hforge/library/`
and `.hforge/templates/`. Target-native entry points such as `AGENTS.md`,
`CLAUDE.md`, `.agents/skills/`, and `.codex/` should be treated as thin
bridges back to that hidden AI layer rather than as separate knowledge
systems.

The runtime now hydrates baseline repo-intelligence artifacts during bootstrap:

- `.hforge/runtime/repo/repo-map.json`
- `.hforge/runtime/repo/recommendations.json`
- `.hforge/runtime/repo/instruction-plan.json`
- `.hforge/runtime/findings/risk-signals.json`
- `.hforge/runtime/recursive/language-capabilities.json`

Canonical target support truth lives in
`manifests/catalog/harness-capability-matrix.json`.

Use it when you need to answer:

- which capabilities are native, translated, emulated, or documentation-only
- what fallback behavior degraded support requires
- whether a support claim is still aligned with the generated
  `docs/target-support-matrix.md` surface
- whether recursive structured analysis is promoted natively or only through
  translated shared-runtime guidance for the selected target
