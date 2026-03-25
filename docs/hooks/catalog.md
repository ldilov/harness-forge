# Hook Catalog

Harness Forge treats hooks as typed runtime policies with explicit support,
failure behavior, and observability fields. The machine-readable source of
truth lives in `manifests/hooks/index.json` and
`schemas/hooks/hook.schema.json`.

## Hook families

| Hook | Stage | Mode | Failure policy | Codex | Claude Code | Cursor | OpenCode |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `quality-gate.release-smoke` | `validate` | `blocking` | `stop-and-report` | full | full | partial | partial |
| `checkpoint.flow-summary` | `implement` | `advisory` | `warn-and-continue` | full | full | emulated | emulated |
| `scan.repo-intelligence` | `specify` | `advisory` | `warn-and-continue` | full | full | partial | partial |

## Typed hook contract

Every shipped hook manifest must declare:

- `family`, `triggerStage`, and `mode`
- execution ordering and failure semantics
- required inputs and expected outputs
- target compatibility per harness
- observability fields that explain what happened

## Support model

- Codex: hook manifests are first-class, but execution remains
  documentation-driven because Codex does not expose the same native hook
  runtime as Claude Code.
- Claude Code: full support for the shipped hook surfaces.
- Cursor and OpenCode: portability only. We document the policies and include
  compatibility metadata, but we do not claim native parity.

## Operator guidance

1. Treat `blocking` hooks as release or safety gates.
2. Treat `advisory` hooks as high-signal diagnostics, not hard stops.
3. Use `docs/target-support-matrix.md` and
   `manifests/catalog/compatibility-matrix.json` when deciding whether a hook
   promise is native, partial, or emulated for a given target.
