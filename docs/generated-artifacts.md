# Generated Artifacts

Interactive onboarding does not create a separate visible artifact family of
its own. It plans and writes the same hidden `.hforge/` runtime, state, and
generated surfaces that the direct CLI path uses, but it now adds a guided
review-before-write step and a completion summary around those artifacts.

Harness Forge allows generated derivative files, but only when provenance is
explicit and recoverable.

## Required provenance

- mark generated markdown with `generated: true`
- include `canonical_source` in metadata
- keep the canonical authored or imported source in the repository

## Hidden AI layer families

- `.hforge/library/skills/` is the canonical hidden installed skill library
- `.hforge/library/rules/` is the canonical hidden installed rules surface
- `.hforge/library/knowledge/` is the canonical hidden installed knowledge-pack surface
- `.hforge/templates/` is the canonical hidden installed task and workflow template surface
- `.hforge/runtime/` remains the generated shared runtime and repo-intelligence layer
- `.hforge/state/` and `.hforge/generated/` remain install and helper state surfaces
- `.hforge/agent-manifest.json` is the generated machine-readable agent contract for custom runtimes

## Current generated or derived surfaces

- `manifests/catalog/compatibility-matrix.json` is generated from targets,
  profiles, hooks, workflows, skills, languages, and framework metadata
- `manifests/catalog/seeded-knowledge-files.json` is generated from the seeded
  archive mapping
- `manifests/catalog/engineering-assistant-import-inventory.json` is authored
  governance data for the engineering-assistant port, not a generated artifact
- `docs/authoring/engineering-assistant-port.md` is curated provenance for the
  engineering-assistant import, not a runtime skill entrypoint
- `manifests/catalog/enhanced-skill-import-inventory.json` is authored
  governance data for imported skill packs, not a generated artifact
- `docs/authoring/enhanced-skill-import.md` is curated provenance for imported
  skill packs, not a runtime skill entrypoint
- `.hforge/runtime/index.json` is generated workspace runtime state that
  records the shared runtime surfaces, installed targets, target bridges, runtime schema version, and package version selected for an
  installed workspace
- `.hforge/runtime/README.md` is generated workspace documentation that
  explains how installed discovery bridges route into the shared runtime
- `.hforge/agent-manifest.json` is generated workspace metadata that tells
  custom agents which files are bridges, which roots are canonical hidden AI
  content, which launchers are available locally, and which command catalog to
  trust
- `.hforge/runtime/repo/repo-map.json` is generated baseline repo cartography
  for the installed workspace runtime
- `.hforge/runtime/repo/recommendations.json` is generated recommendation output
  derived from repo intelligence
- `.hforge/runtime/repo/target-support.json` is generated target support
  summary for the installed workspace runtime
- `.hforge/runtime/repo/instruction-plan.json` is generated target-aware
  instruction planning output for installed runtimes
- `.hforge/runtime/repo/scan-summary.json` is generated stack and validation
  signal output from the runtime scan
- `.hforge/runtime/findings/validation-gaps.json` is generated validation-gap
  output for the installed workspace runtime
- `.hforge/runtime/findings/risk-signals.json` is generated risk-signal output
  for the installed workspace runtime
- `.hforge/runtime/tasks/TASK-XXX/file-interest.json` is generated ranked
  task-aware file context for an active task
- `.hforge/runtime/tasks/TASK-XXX/impact-analysis.json` is generated blast-radius
  analysis derived from selected task context, including architecture-significance
  assessment metadata
- `.hforge/runtime/tasks/TASK-XXX/task-pack.json` is the structured summary for
  a canonical runtime task folder, including decision refs and ASR coverage when
  the task is architecture-significant
- `.hforge/runtime/tasks/TASK-XXX/recursive-session.json` links an ordinary
  task runtime folder to the latest recursive session created for hard work on
  that task
- `.hforge/runtime/decisions/ASR-*.json` and companion markdown files are
  generated architecture-significant requirement records captured from task-time
  runtime analysis
- `.hforge/runtime/decisions/index.json` is the machine-readable runtime index
  for decision records written into the hidden AI layer
- `.hforge/runtime/decisions/coverage-summary.json` is reserved for runtime
  decision-coverage maintenance summaries
- `.hforge/runtime/cache/working-memory.json` is compact runtime cache state for
  resumable active work
- `.hforge/templates/runtime/registry.json` is the canonical hidden runtime
  template registry for task-time artifacts
- `.hforge/runtime/recursive/sessions/RS-XXX/session.json` is the durable draft
  or active recursive session identity, budget, handles, and tool surface
- `.hforge/runtime/recursive/sessions/RS-XXX/memory.json` is compact
  recursive-session working memory for the current investigation
- `.hforge/runtime/recursive/sessions/RS-XXX/trace.jsonl` is append-only
  recursive trace output for operator auditability
- `.hforge/runtime/recursive/sessions/RS-XXX/summary.json` is the deterministic
  recursive handoff summary, even while the session is still draft
- `.specify/state/flow-state.json` is runtime state, not an authored source
- `.hforge/state/install-state.json` is generated install-state and runtime-version metadata, not authored product content
- `.hforge/state/post-install-guidance.txt` is generated operator guidance for init, install, and recovery flows

## Artifact lineage rules

- every flow record should point back to `spec.md`, `plan.md`, `contracts/`,
  and `tasks.md` when they exist
- generated compatibility and knowledge reports must remain traceable to the
  authored manifests they summarize
- generated shared-runtime state must remain traceable to install planning,
  target adapter metadata, and workspace-selected bundles
- generated shared-runtime baseline artifacts must remain traceable to
  recommendation, scan, cartography, and instruction-synthesis inputs
- generated decision records must remain traceable to task packs, impact
  analysis, and the architecture-significance assessment that caused them
- generated recursive-session artifacts must remain traceable to the linked task
  runtime folder when a task id is present
- release validation should fail when a generated artifact points to a missing
  source

## Issue-export convention

When implementation tasks are exported to issues:

- keep the originating feature id in the issue body or metadata
- preserve task ids from `tasks.md`
- include the current flow stage and the next recommended action
- keep the export reproducible from the canonical task list

## Drift policy

- generated derivatives must be reproducible from canonical sources
- authored summaries must not be silently overwritten by import or generation
- runtime state can be refreshed, but authored docs and manifests require
  explicit review
