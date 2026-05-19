# Generic Agent Support

This workspace has been configured with Harness Forge using the **generic-agent** target.

## What this means

The generic-agent target provides contract-level support for any capable agentic
environment that does not yet have a dedicated Harness Forge adapter. It installs
portable runtime surfaces (AGENTS.md, .agents/skills, .hforge/) without creating
vendor-specific directories such as .codex or .claude.

## Recommended reading order

1. **AGENTS.md** - Primary instruction entrypoint
2. **.hforge/runtime/agent-brief.md** - Compact first-hop Harness Forge orientation for meaningful coding work
3. **.hforge/agent-manifest.json** - Machine-readable manifest describing surfaces, commands, and resolution order
4. **.hforge/runtime/repo/onboarding-brief.json** - Repository onboarding context (if generated)
5. **.hforge/generated/agent-command-catalog.json** - Available CLI commands
6. **.hforge/runtime/index.json** - Shared runtime state
7. **.hforge/library/skills/** - Canonical skill library (load task-relevant skills only)

## Complex task protocol

Before meaningful coding work, classify the task as simple or complex. Use
`.hforge/library/skills/complex-task-protocol/SKILL.md` automatically when at
least two ordinary complexity signals are present, or when one high-signal
condition such as security, release, cross-target, recursive, runtime, or
orchestration work is present.

Keep simple requests lightweight. For complex work, keep the main agent on the
critical path, use at most two bounded sidecar agents by default when independent
work exists, verify before completion, and capture durable learning only in the
appropriate project or runtime surface.

## Limitations

- No native hooks or IDE-specific integrations
- No plugin system support
- No vendor-specific context files
- Flow orchestration and observability are not shipped for this target
