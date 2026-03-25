# Remoting and Operations

## Remoting Guidance
- detect whether the repo uses WinRM, SSH remoting, Azure automation, or custom orchestration
- fail clearly on connectivity/auth issues
- design for idempotency when acting on infrastructure
- log enough context for later operational triage

## Safety
- support `-WhatIf` and confirmation where appropriate
- avoid global preference mutation unless scoped and restored
- treat credentials and secrets explicitly
