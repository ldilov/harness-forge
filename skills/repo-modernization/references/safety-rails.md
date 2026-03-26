# Safety Rails

## Before a risky phase

- identify the commands that prove the repo still works
- add smoke tests or contract tests for the highest-risk seams
- define rollback or feature-flag posture
- decide what metrics or telemetry would show regression quickly

## During modernization

- prefer one irreversible move at a time
- keep migration notes close to the change
- avoid mixing refactors with behavioral changes unless the repo forces that trade-off
- keep old and new paths observable during transitions
