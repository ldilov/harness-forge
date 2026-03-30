# .NET review checklist

Treat this as a release gate for changes dominated by .NET.

## 1. Orientation

- Dominant runtime and host are known
- Entry points are identified
- Public contracts or exported commands are listed
- The closest scenario file from `examples/` was used

## 2. Boundary safety

- External inputs are validated
- Serialization or deserialization seams are explicit
- Config/env/file access is bounded and documented
- Failure modes are safe and debuggable

## 3. Code quality

- Business rules are separated from framework or host glue
- State ownership is obvious
- Long functions or giant modules were not expanded further
- Public names and errors describe intent clearly

## 4. Test and verification
- build
- unit tests
- integration tests
- OpenAPI/smoke verification
- publish/config review

## 5. Operational readiness

- logging/telemetry impact understood
- retries or background work are bounded
- compatibility or migration notes are captured
- rollback or containment path is obvious

## 6. Stop-ship conditions

- input crosses a trust boundary without validation
- public API or command behavior changed silently
- tests cover only internals and not the changed seam
- stateful behavior changed without documenting operational impact
