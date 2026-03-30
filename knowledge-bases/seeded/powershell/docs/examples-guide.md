# PowerShell examples guide

These examples are task playbooks, not toy snippets. Use the nearest one as the default plan scaffold.

## How to use an example

1. Select the closest scenario.
2. Copy its touched-file thinking and validation shape.
3. Adjust for the repo's framework and deployment assumptions.
4. Keep the example's anti-pattern checks in your final review.

## Available scenarios

### Idempotent admin script

- file: `01-idempotent-admin-script.md`
- use when: Parameter validation, ShouldProcess, secure remoting, and repeatable environment changes.
- always confirm: contracts, validation, tests, and operational impact

### Module command surface

- file: `02-module-command-surface.md`
- use when: Public/private function split, help metadata, module manifest, and output contract stability.
- always confirm: contracts, validation, tests, and operational impact

### Pipeline-aware data tool

- file: `03-pipeline-aware-data-tool.md`
- use when: Advanced functions, Begin/Process/End blocks, error records, and object-first output.
- always confirm: contracts, validation, tests, and operational impact

### CI automation script

- file: `04-ci-automation-script.md`
- use when: Exit codes, strict mode, secret handling, and deterministic logs for build agents.
- always confirm: contracts, validation, tests, and operational impact
