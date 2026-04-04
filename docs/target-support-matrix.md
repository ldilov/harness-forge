# Target Support Matrix

Harness Forge keeps one canonical target-capability truth source in
`manifests/catalog/harness-capability-matrix.json`. The broader
`manifests/catalog/compatibility-matrix.json` remains a derived view for
cross-surface relationships.

## Support levels

- `full`: shipped and validated in this package
- `partial`: usable with explicit gaps and fallback guidance
- `emulated`: approximated behavior without a native runtime surface
- `unsupported`: do not rely on it

## Support modes

- `native`: first-class runtime support ships in the package
- `translated`: support works through portable scripts or guidance layers
- `emulated`: behavior is approximated rather than native
- `documentation-only`: only docs and manifests are portable
- `unsupported`: no packaged runtime support is claimed

## Target summary

| Target | Overall support | Strengths | Gaps |
| --- | --- | --- | --- |
| `codex` | full | Templates and docs, Workflow validation, Repo intelligence, Recursive structured analysis, Flow orchestration, Maintenance commands, Local observability | Typed hooks |
| `claude-code` | full | Templates and docs, Workflow validation, Repo intelligence, Recursive structured analysis, Flow orchestration, Typed hooks, Maintenance commands, Local observability | none |
| `cursor` | partial | none | Templates and docs, Workflow validation, Repo intelligence, Recursive structured analysis, Flow orchestration, Typed hooks, Maintenance commands, Local observability |
| `opencode` | partial | none | Templates and docs, Workflow validation, Repo intelligence, Recursive structured analysis, Flow orchestration, Typed hooks, Maintenance commands, Local observability |
| `generic-agent` | contract | none | Templates and docs, Workflow validation, Repo intelligence, Recursive structured analysis, Flow orchestration, Typed hooks, Maintenance commands, Local observability |

## Capability honesty

| Capability | Codex | Claude Code | Cursor | OpenCode | Generic Agent |
| --- | --- | --- | --- | --- | --- |
| Templates and docs | full (native) | full (native) | partial (documentation-only) | partial (documentation-only) | partial (contract) |
| Workflow validation | full (native) | full (native) | partial (documentation-only) | partial (documentation-only) | unsupported (unsupported) |
| Repo intelligence | full (native) | full (native) | partial (translated) | partial (translated) | partial (contract) |
| Recursive structured analysis | full (native) | full (native) | partial (translated) | partial (translated) | partial (contract) |
| Flow orchestration | full (native) | full (native) | unsupported (unsupported) | unsupported (unsupported) | unsupported (unsupported) |
| Typed hooks | partial (documentation-only) | full (native) | unsupported (unsupported) | unsupported (unsupported) | unsupported (unsupported) |
| Maintenance commands | full (native) | full (native) | partial (documentation-only) | partial (documentation-only) | partial (contract) |
| Local observability | full (native) | full (native) | partial (documentation-only) | partial (documentation-only) | unsupported (unsupported) |

## Degraded support details

### Codex

- Typed hooks: partial via documentation-only. Fallback: Use the docs and packaged hook manifests as references, then wire execution manually in the Codex target. Codex ships hook authoring guidance, but not the same native runtime hook model as Claude Code.

### Claude Code

- none

### Cursor

- Templates and docs: partial via documentation-only. Fallback: Use generated docs and manifests as the support surface instead of expecting a native Cursor runtime install. Cursor can consume packaged docs and portable guidance, but not a first-class runtime mapping.
- Workflow validation: partial via documentation-only. Fallback: Run the validators from the repository rather than relying on a Cursor-specific runtime integration. Validation guidance is portable, but no Cursor-native runtime wiring is shipped.
- Repo intelligence: partial via translated. Fallback: Inspect `.hforge/runtime/index.json` and `.hforge/library/`, then run the intelligence scripts directly and treat the output as operator guidance. Repo intelligence is available as thin bridges, portable scripts, and generated hidden `.hforge/` state rather than a native Cursor runtime surface.
- Recursive structured analysis: partial via translated. Fallback: Use `.hforge/runtime/recursive/language-capabilities.json` and recursive session artifacts as the honest support surface instead of claiming native Cursor parity. Cursor receives recursive structured-analysis and Typed RLM promotion through shared-runtime capability maps, compact root frames, and durable session artifacts rather than a native target runtime payload.
- Flow orchestration: unsupported via unsupported. Fallback: Do not rely on packaged flow recovery for Cursor; use `.hforge/runtime/index.json` and the thin bridge surfaces only. No first-class Cursor flow-state recovery surface is shipped beyond the hidden `.hforge/` runtime summary and bridge surfaces.
- Typed hooks: unsupported via unsupported. Fallback: Use hook docs as references only; do not claim native Cursor hook execution. Cursor does not have a packaged native hook runtime in this repository.
- Maintenance commands: partial via documentation-only. Fallback: Run the maintenance commands from the repository rather than expecting Cursor-specific runtime integration. Maintenance guidance is portable, but a Cursor-native runtime surface is not shipped.
- Local observability: partial via documentation-only. Fallback: Inspect the local observability artifacts directly from the repository. Observability artifacts are portable, but no native Cursor runtime surface is shipped.

### OpenCode

- Templates and docs: partial via documentation-only. Fallback: Use generated docs and manifests as the support surface instead of expecting a native OpenCode runtime install. OpenCode can consume packaged docs and portable guidance, but not a first-class runtime mapping.
- Workflow validation: partial via documentation-only. Fallback: Run the validators from the repository rather than relying on an OpenCode-specific runtime integration. Validation guidance is portable, but no OpenCode-native runtime wiring is shipped.
- Repo intelligence: partial via translated. Fallback: Inspect `.hforge/runtime/index.json` and `.hforge/library/`, then run the intelligence scripts directly and treat the output as operator guidance. Repo intelligence is available as thin bridges, portable scripts, and generated hidden `.hforge/` state rather than a native OpenCode runtime surface.
- Recursive structured analysis: partial via translated. Fallback: Use `.hforge/runtime/recursive/language-capabilities.json` and recursive session artifacts as the honest support surface instead of claiming native OpenCode parity. OpenCode receives recursive structured-analysis and Typed RLM promotion through shared-runtime capability maps, compact root frames, and durable session artifacts rather than a native target runtime payload.
- Flow orchestration: unsupported via unsupported. Fallback: Do not rely on packaged flow recovery for OpenCode; use `.hforge/runtime/index.json` and the thin bridge surfaces only. No first-class OpenCode flow-state recovery surface is shipped beyond the hidden `.hforge/` runtime summary and bridge surfaces.
- Typed hooks: unsupported via unsupported. Fallback: Use hook docs as references only; do not claim native OpenCode hook execution. OpenCode does not have a packaged native hook runtime in this repository.
- Maintenance commands: partial via documentation-only. Fallback: Run the maintenance commands from the repository rather than expecting OpenCode-specific runtime integration. Maintenance guidance is portable, but an OpenCode-native runtime surface is not shipped.
- Local observability: partial via documentation-only. Fallback: Inspect the local observability artifacts directly from the repository. Observability artifacts are portable, but no native OpenCode runtime surface is shipped.

### Generic Agent

- Templates and docs: partial via contract. Fallback: Use AGENTS.md, .agents/skills/, and the hidden .hforge AI layer. Generic agents consume portable docs, manifests, and the hidden .hforge AI layer through contract-level surfaces.
- Workflow validation: unsupported via unsupported. Fallback: Run the package validators directly from the repository if needed. No workflow validation runtime is shipped for generic agents.
- Repo intelligence: partial via contract. Fallback: Inspect .hforge/runtime/index.json and .hforge/library/, then run the intelligence scripts directly. Repo intelligence is available through portable scripts and the hidden .hforge state layer.
- Recursive structured analysis: partial via contract. Fallback: Use .hforge/runtime/recursive/language-capabilities.json and recursive session artifacts. Generic agents receive recursive structured-analysis through shared-runtime capability maps and session artifacts.
- Flow orchestration: unsupported via unsupported. Fallback: Do not rely on packaged flow recovery; use .hforge/runtime/index.json only. No flow-state recovery surface is shipped for generic agents.
- Typed hooks: unsupported via unsupported. Fallback: Use hook docs as references only; do not claim native hook execution. Generic agents do not have a packaged hook runtime.
- Maintenance commands: partial via contract. Fallback: Run the maintenance commands from the repository directly. Maintenance commands are portable but not natively wired for generic agents.
- Local observability: unsupported via unsupported. Fallback: Inspect .hforge/observability artifacts directly if available. No observability runtime is shipped for generic agents.

