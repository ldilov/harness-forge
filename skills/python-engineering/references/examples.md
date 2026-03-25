# Examples

## Example: Add a repository-backed service feature
1. Extend request/DTO schema.
2. Add domain-level validation.
3. Update service method.
4. Add repository query or persistence logic.
5. Add unit test for validation and integration test for persistence.

## Example: Fix async timeout bug
- Symptom: requests hang under load.
- Investigation: inspect HTTP client timeout defaults, retry policy, cancellation handling.
- Fix: explicit timeout config + cancellation-aware awaits + regression test using a delayed fake server.

## Example: Refactor script into package
- move logic from monolithic script to package modules
- keep thin CLI entrypoint
- preserve backward-compatible command surface
- add smoke test for CLI and focused unit tests for extracted logic
