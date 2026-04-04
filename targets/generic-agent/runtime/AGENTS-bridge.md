# Generic Agent Support

This workspace has been configured with Harness Forge using the **generic-agent** target.

## What this means

The generic-agent target provides contract-level support for any capable agentic
environment that does not yet have a dedicated Harness Forge adapter. It installs
portable runtime surfaces (AGENTS.md, .agents/skills, .hforge/) without creating
vendor-specific directories such as .codex or .claude.

## Recommended reading order

1. **AGENTS.md** - Primary instruction entrypoint
2. **.hforge/agent-manifest.json** - Machine-readable manifest describing surfaces, commands, and resolution order
3. **.hforge/runtime/repo/onboarding-brief.json** - Repository onboarding context (if generated)
4. **.hforge/generated/agent-command-catalog.json** - Available CLI commands
5. **.hforge/runtime/index.json** - Shared runtime state
6. **.hforge/library/skills/** - Canonical skill library (load task-relevant skills only)

## Limitations

- No native hooks or IDE-specific integrations
- No plugin system support
- No vendor-specific context files
- Flow orchestration and observability are not shipped for this target
