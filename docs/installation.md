# Installation

Harness Forge supports local repo-root usage with both Codex and Claude Code.

## Prerequisites

- Node.js 22+
- npm
- PowerShell 7+ when you want to run the shipped PowerShell validators

## Local repo usage

### Build once

```bash
npm install
npm run build
```

### Run through the launcher scripts

```bash
./install.sh catalog --json
pwsh ./install.ps1 catalog --json
```

## Preview an install

### Codex

```bash
node dist/cli/index.js add --target codex --profile developer --lang typescript --dry-run
```

### Claude Code

```bash
node dist/cli/index.js add --target claude-code --profile developer --lang powershell --dry-run
```

## Apply an install

```bash
node dist/cli/index.js add --target codex --profile developer --lang typescript --with workflow-quality --yes
```

## Repair and status

- `node dist/cli/index.js status --json`
- `node dist/cli/index.js repair --json`
- `node dist/cli/index.js backup --json`
- `node dist/cli/index.js restore --json`

## Offline verification

Use these checks to confirm the package includes the full seeded and validator
surface before distributing it:

```bash
npm run validate:seeded-coverage
npm run validate:package-surface
npm run validate:release
```

Confirm the package includes:

- `knowledge-bases/seeded/`
- `.agents/skills/`
- `.specify/`
- `scripts/templates/`
- `AGENTS.md`

## Uninstall and rollback

- use the maintenance commands to inspect backups before cleanup
- uninstall only after confirming the install state and backup snapshot
- if you need to recover, restore from the backup captured during the install or
  repair flow
