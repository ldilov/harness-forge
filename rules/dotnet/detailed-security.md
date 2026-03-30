# .NET Detailed Security

## Boundaries to review

- request or command input
- configuration and environment loading
- file paths and shell execution
- serialization and logging
- authentication and authorization shortcuts

## Minimum expectations

- validate untrusted input
- use least privilege for external systems
- do not leak secrets, tokens, credentials, or sensitive payloads into logs or snapshots
- document any risky runtime assumptions instead of hiding them in helper code
