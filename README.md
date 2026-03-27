# Harness Forge

Harness Forge is a packaging-friendly agentic workspace kit for Codex, Claude
Code, and adjacent AI harnesses. It gives teams a deterministic way to install
agent guidance, language and framework knowledge, workflows, validation
surfaces, and local operational tooling into a real repository without mixing
package content with workspace state.

## Why teams use it

- install a consistent AI agent operating surface into a repo instead of
  relying on ad hoc prompts
- combine language packs, framework packs, profiles, and capability bundles
  through one CLI
- recommend repo-aware guidance with evidence instead of generic setup advice
- keep target support claims honest through a canonical capability matrix
- validate what ships before handoff with local, release-grade checks

## What ships

| Surface | What is included | Why it matters |
| --- | --- | --- |
| Agent runtime surfaces | Thin visible bridges such as `AGENTS.md`, `.agents/skills/`, and target runtimes under `.codex/` and `.claude/`, backed by canonical hidden content under `.hforge/library/` and `.hforge/templates/` | Gives AI agents a predictable operating contract without exposing the full AI layer as product-root content |
| Shared runtime state | Generated `.hforge/runtime/` summaries, baseline repo-intelligence artifacts, and runtime-state docs created during install | Keeps one shared repo-intelligence runtime visible even when targets use different native bridge files |
| Spec flow | `.specify/` with spec -> plan -> tasks -> implement helpers | Supports structured delivery instead of free-form agent work |
| Knowledge packs | `knowledge-bases/seeded/`, structured language packs, framework packs, examples, and rules | Gives agents deeper language and framework context with file-traceable sources |
| Profiles and bundles | Target manifests, profiles, capability bundles, hooks, workflows, and catalogs | Lets operators install only the surfaces a repo needs |
| Intelligence and maintenance | Recommendation scoring, flow status, doctor, audit, diff-install, upgrade, sync, and prune surfaces | Supports installation, verification, and long-term maintenance |
| Observability and release gates | Local observability scripts, compatibility generation, release smoke validation, doc/runtime alignment checks, and provenance companions such as `RESEARCH-SOURCES.md` and `VALIDATION.md` | Keeps shipped behavior inspectable and release-safe |

## Repository layout

| Folder | What it contains | Why it matters |
| --- | --- | --- |
| `.agents/` | Auto-discoverable skill wrappers and target-facing bridge surfaces | Lets agent runtimes discover packaged skills while deferring execution to hidden canonical `.hforge/library/` surfaces in installed workspaces |
| `.hforge/` | Hidden installed AI layer containing canonical skills, rules, knowledge, templates, runtime state, observability outputs, generated artifacts, and post-install guidance | This is the package-managed local AI layer after installation and operation |
| `.specify/` | Spec-kit flow assets, templates, scripts, and state for spec -> plan -> tasks -> implement | Provides the structured delivery workflow used by agent operators |
| `agents/` | Supplemental agent-facing assets and package-owned integration surfaces | Holds package-shipped agent content outside runtime workspace state |
| `commands/` | Command reference markdown and operator-facing command docs | Gives a human-readable front door for the shipped operational flows |
| `contexts/` | Context assets intended to support agent behavior and packaging | Keeps reusable context separate from runtime state |
| `dist/` | Built CLI output from the TypeScript source tree | This is the executable surface operators run locally after `npm run build` |
| `docs/` | Front-door documentation, catalogs, target guidance, lifecycle docs, and support matrices | Primary operator documentation for install, support, and maintenance |
| `examples/` | Example package content and reference surfaces | Useful for understanding how shipped assets are intended to be used |
| `hooks/` | Hook documentation and related operator surfaces | Important for targets that support hook-oriented automation, especially Claude Code |
| `knowledge-bases/` | Source-authored seeded and structured language or operations knowledge packs | Published installs remap this authored content into `.hforge/library/knowledge/` |
| `manifests/` | Catalogs, bundles, profiles, target definitions, hook indexes, and package metadata | Canonical machine-readable source of truth for what the package ships |
| `mcp/` | MCP-related package guidance and integration docs | Important when the target runtime needs MCP setup or compatibility guidance |
| `profiles/` | Profile-facing docs and top-level profile package surfaces | Helps operators understand install presets and intended usage patterns |
| `rules/` | Source-authored common and language-specific implementation rules | Published installs remap this authored content into `.hforge/library/rules/` |
| `schemas/` | JSON schemas for manifests, runtime artifacts, hooks, and generated outputs | Enables validation, release gates, and contract testing |
| `scripts/` | CI, intelligence, knowledge, runtime, Codex, and template-validation scripts | The operational backbone for generation, validation, maintenance, and reporting |
| `skills/` | Source-authored canonical packaged skills and deeper reference packs used by supported agent targets | Published installs remap this authored content into `.hforge/library/skills/` |
| `specs/` | Feature-level specifications, plans, research, contracts, and tasks | Captures implementation intent and delivery artifacts for ongoing feature work |
| `src/` | TypeScript source code for the CLI, domain model, application layer, and infrastructure | This is the implementation source for the built package runtime |
| `targets/` | Target adapters and runtime payloads for Codex, Claude Code, Cursor, and OpenCode | Defines what each harness actually receives and what support level it gets |
| `templates/` | Task, instruction, and workflow templates | Used by agents and operators to standardize common work patterns |
| `tests/` | Contract, integration, and fixture coverage | Protects shipping behavior and release quality |
| `coverage/` | Test coverage output | Generated verification artifact, useful during release work but not a source surface |
| `node_modules/` | Installed npm dependencies | Required for local execution, but not part of the authored package design |
| `.tmp/` | Temporary working data | Ephemeral workspace content, not a canonical package surface |

## Supported targets

Harness Forge is strongest when used with Codex or Claude Code. Cursor and
OpenCode can still consume portable docs, manifests, and recommendation output,
but they are not full runtime targets today.

| Target | Runtime support | Hooks | Flow recovery | Recommended use |
| --- | --- | --- | --- | --- |
| Codex | First-class | Partial, documentation-driven | First-class | Default choice when you want full install, recommendation, maintenance, and flow support |
| Claude Code | First-class | First-class | First-class | Best choice when native hook support is required |
| Cursor | Partial portability | Unsupported | Unsupported | Use for docs, manifests, and recommendation output only |
| OpenCode | Partial portability | Unsupported | Unsupported | Use for docs, manifests, and recommendation output only |

Canonical target support truth lives in
`manifests/catalog/harness-capability-matrix.json`. The broader
`manifests/catalog/compatibility-matrix.json` is the derived cross-surface
view, and `docs/target-support-matrix.md` is the operator-facing summary.

## Capability summary

| Capability | Codex | Claude Code | Cursor | OpenCode |
| --- | --- | --- | --- | --- |
| Templates and docs | full (native) | full (native) | partial (documentation-only) | partial (documentation-only) |
| Workflow validation | full (native) | full (native) | partial (documentation-only) | partial (documentation-only) |
| Repo intelligence | full (native) | full (native) | partial (translated) | partial (translated) |
| Flow orchestration | full (native) | full (native) | unsupported | unsupported |
| Typed hooks | partial (documentation-only) | full (native) | unsupported | unsupported |
| Maintenance commands | full (native) | full (native) | partial (documentation-only) | partial (documentation-only) |
| Local observability | full (native) | full (native) | partial (documentation-only) | partial (documentation-only) |

## Supported content

| Content area | Coverage |
| --- | --- |
| Seeded language packs | TypeScript, Java, .NET, Lua, PowerShell |
| Structured language packs | Python, Go, Kotlin, Rust, C++, PHP, Perl, Swift, Shell |
| Framework packs | React, Next.js, Express, FastAPI, Django, ASP.NET Core, Spring Boot, Laravel, Symfony, Gin, Ktor, Vite |
| Operational skills | Repo onboarding, documentation lookup, release readiness, security scan, architecture decision records, observability, profiling, incident and PR triage, migration review, and more |
| Workflow templates | Research/plan/implement/validate flows, language-specific implementation workflows, parallel planning scaffolds |
| Release and quality gates | Template validation, compatibility validation, framework coverage, skill depth, generated-sync checks, knowledge coverage, knowledge drift, and release smoke |

If you need the full content matrix, start with:

- `docs/languages.md`
- `docs/catalog/language-packs.md`
- `docs/catalog/framework-packs.md`
- `docs/commands.md`

## Why an AI agent should use this package

- It replaces one-off repo setup with a repeatable install plan and tracked
  workspace state.
- It gives the agent real files to work from: hidden rules, skills, workflows,
  manifests, and target runtime surfaces.
- It keeps discovery and execution clean: `.agents/skills/` finds the right
  flow, while `.hforge/library/` and `.hforge/templates/` hold the actual installed runtime contract and reference depth.
- It helps the agent choose relevant packs through repo-intelligence instead of
  assuming the stack from one config file.
- It gives maintainers a way to audit, repair, diff, and validate the install
  after the agent starts changing things.
- It keeps support claims explicit, so agents do not over-promise target
  behavior that the package does not actually ship.

## Install on a local AI workspace

The zero-build operator flow is the published `npx` entrypoint. It does not
require a local clone or a manual `npm run build` first.

```bash
npx @harness-forge/cli bootstrap --root . --yes
```

That command detects supported agent runtimes already present in the current
repository, picks a first-class fallback target when none are present, and
installs the recommended Harness Forge surfaces into the current repo.

If you install from a Git source instead of the published npm tarball, the
package now uses npm `prepare` to build the CLI automatically during install, so
Git-based `npx` and package installs do not require a separate manual build
step either.

### Prerequisites

| Requirement | Notes |
| --- | --- |
| Node.js 22+ | Required to build and run the CLI |
| npm | Used for install, build, and validation commands |
| A target repository | The workspace that should receive the installed agent surfaces |
| PowerShell | Required for the shipped PowerShell validation bundle on Windows and cross-platform PowerShell setups |

### 1. Use the published package directly

Run this from the repository you want to equip:

```bash
npx @harness-forge/cli bootstrap --root . --yes
```

Use this path when you want the shipped CLI and packaged surfaces without
checking out the Harness Forge source repository.

### 2. Build from source when working on Harness Forge itself

Run from the Harness Forge repository root:

```bash
npm install
npm run build
```

### 3. Initialize the destination workspace

```bash
node dist/cli/index.js init --root /path/to/your/workspace --json
```

### 4. Install for Codex

```bash
node dist/cli/index.js install \
  --target codex \
  --profile core \
  --lang typescript \
  --framework react \
  --with workflow-quality \
  --root /path/to/your/workspace \
  --yes
```

If you want the packaged Codex home config helper:

```bash
node scripts/codex/apply-home-config.mjs --workspace /path/to/your/workspace
```

### 5. Install for Claude Code

```bash
node dist/cli/index.js install \
  --target claude-code \
  --profile core \
  --lang python \
  --framework fastapi \
  --with workflow-quality \
  --root /path/to/your/workspace \
  --yes
```

### 6. Add more content later

Use `catalog add` when a repo evolves and needs more packs:

```bash
node dist/cli/index.js catalog add \
  --target codex \
  --lang go \
  --framework gin \
  --with local-observability \
  --root /path/to/your/workspace \
  --yes
```

### 7. Autodetect and bootstrap the current repo

```bash
node dist/cli/index.js bootstrap --root . --yes
```

Use `bootstrap` when you want the CLI to:

- detect Codex, Claude Code, Cursor, or OpenCode surfaces already present in
  the repo
- choose a sane default first-class target when no runtime is detected
- recommend language, framework, and capability bundles for the current codebase
- install target runtime files, agent-facing skills, and workspace state in one
  pass

## Confirm that it is installed

Use the CLI, the managed state files, and the target runtime directories
together.

| Check | Command or file | What success looks like |
| --- | --- | --- |
| Zero-build `npx` bootstrap | `npx @harness-forge/cli bootstrap --root . --yes` | The repo is bootstrapped without a prior local Harness Forge build |
| Install state | `node dist/cli/index.js status --root /path/to/your/workspace --json` | `installedTargets`, `installedBundles`, timestamps, and file writes are present |
| Agent command catalog | `/path/to/your/workspace/.hforge/generated/agent-command-catalog.json` | Agents can inspect shipped CLI commands and npm scripts without guessing |
| Skill discovery layer | `/path/to/your/workspace/.agents/skills/` | Wrapper skills are present and point to the hidden canonical AI layer |
| Canonical skill layer | `/path/to/your/workspace/.hforge/library/skills/` | Installed runtime skill contracts and `references/` packs are present without cluttering the repo root |
| Hidden rule and knowledge layer | `/path/to/your/workspace/.hforge/library/rules/` and `/path/to/your/workspace/.hforge/library/knowledge/` | Installed rules and knowledge packs stay authoritative without looking like product code |
| Health check | `node dist/cli/index.js doctor --root /path/to/your/workspace --json` | `status` is `clean` or a warning with explicit remediation details |
| Audit | `node dist/cli/index.js audit --root /path/to/your/workspace --json` | No unexpected `missingManagedPaths` or `missingBundles` |
| Guidance output | `/path/to/your/workspace/.hforge/state/post-install-guidance.txt` | Post-install guidance was written for the selected target |
| State file | `/path/to/your/workspace/.hforge/state/install-state.json` | Managed install state exists and tracks installed targets and bundles |
| Shared runtime index | `/path/to/your/workspace/.hforge/runtime/index.json` | One workspace-level runtime document records all installed targets and bridge contributions |
| Shared runtime repo map | `/path/to/your/workspace/.hforge/runtime/repo/repo-map.json` | Baseline repo cartography is persisted for downstream runtime and operator flows |
| Shared runtime findings | `/path/to/your/workspace/.hforge/runtime/findings/risk-signals.json` | Install writes risk-oriented findings alongside the shared runtime intelligence baseline |
| Target runtime | `/path/to/your/workspace/.codex/` or `/path/to/your/workspace/.claude/` | Target runtime files were materialized in the workspace |

If you want a fast confidence check after installation:

```bash
node dist/cli/index.js status --root /path/to/your/workspace --json
node dist/cli/index.js commands --json
node dist/cli/index.js doctor --root /path/to/your/workspace --json
node dist/cli/index.js audit --root /path/to/your/workspace --json
```

## Common operator commands

| Goal | Command |
| --- | --- |
| Autodetect targets and bootstrap the repo | `node dist/cli/index.js bootstrap --root /path/to/your/workspace --yes` |
| Inspect the available catalog | `node dist/cli/index.js catalog --json` |
| List commands and npm scripts that agents can use | `node dist/cli/index.js commands --json` |
| See what is installed and recommended | `node dist/cli/index.js list --root /path/to/your/workspace --json` |
| Generate repo-aware recommendations | `node dist/cli/index.js recommend /path/to/your/workspace --json` |
| Build a repo map and service boundary picture | `node dist/cli/index.js cartograph /path/to/your/workspace --json` |
| Synthesize target-aware instructions for Codex or Claude Code | `node dist/cli/index.js synthesize-instructions /path/to/your/workspace --target codex --json` |
| Inspect what a target actually supports | `node dist/cli/index.js target inspect codex --json` |
| Review local observability effectiveness | `node dist/cli/index.js observability summarize --json` |
| Plan or check parallel shard work | `node dist/cli/index.js parallel plan specs/<feature>/tasks.md --json` |
| Inspect flow recovery state | `node dist/cli/index.js flow status --root /path/to/your/workspace --json` |
| Validate shipped templates | `node dist/cli/index.js template validate --json` |
| Compare managed install state against the workspace | `node dist/cli/index.js diff-install --root /path/to/your/workspace --json` |

## Repo intelligence and guidance synthesis

Harness Forge can inspect a repository and recommend packs, profiles, skills,
and missing validation surfaces with evidence:

```bash
node scripts/intelligence/score-recommendations.mjs tests/fixtures/benchmarks/typescript-web-app --json
node dist/cli/index.js recommend tests/fixtures/benchmarks/typescript-web-app --json
node dist/cli/index.js cartograph tests/fixtures/benchmarks/monorepo --json
node dist/cli/index.js classify-boundaries tests/fixtures/benchmarks/monorepo --json
node dist/cli/index.js synthesize-instructions tests/fixtures/benchmarks/monorepo --target codex --dry-run --json
node scripts/intelligence/cartograph-repo.mjs tests/fixtures/benchmarks/monorepo --json
node scripts/intelligence/synthesize-instructions.mjs tests/fixtures/benchmarks/monorepo --dry-run --json
```

## Target-specific self-service commands

Users working in their own repositories can inspect exactly what Harness Forge
supports for their AI runtime before installing anything:

```bash
npx @harness-forge/cli target inspect codex --json
npx @harness-forge/cli target inspect claude-code --json
npx @harness-forge/cli target inspect opencode --json
npx @harness-forge/cli capabilities --target codex --json
```

That works especially well for Codex, Claude Code, and OpenCode users who want
to know whether hooks, flow recovery, observability, and packaged runtime
surfaces are first-class, partial, or documentation-only for their target.

## Release validation

Before publish or handoff, run:

```bash
npm run build
npm run commands:catalog
npm run bootstrap:current
npm run recommend:current
npm run cartograph:current
npm run instructions:codex
npm run target:codex
npm run target:claude-code
npm run target:opencode
npm run validate:release
npm run validate:compatibility
npm run validate:skill-depth
npm run validate:framework-coverage
npm run validate:doc-command-alignment
npm run validate:runtime-consistency
npm run observability:summary
npm run knowledge:coverage
npm run knowledge:drift
```

`npm run validate:release` is the front-door release gate and should be treated
as mandatory for shipped changes.
