# Certificate Selection Matrix

| Situation | Primary Artifact | Supporting Artifacts | Minimum Recommendation Constraint |
|---|---|---|---|
| Compare two fixes for behavioral equivalence | Patch Equivalence Certificate | Exploration log, function trace, data-flow ledger | Counterexample found OR explicit no-counterexample argument |
| Localize root cause for failing test | Fault Localization Certificate | Exploration log | Ranked predictions tied to claims and premises |
| Answer semantics-heavy repository question | Code QA Certificate | Function trace, data-flow ledger | Final answer bounded by verified source evidence |
| Decide if risky change is safe to merge | Change Safety Certificate | Core contract, exploration log, pre-merge workflow | Recommendation must be one of: safe-to-merge, safe-with-conditions, not-yet-safe |

## Selection Rule

Choose the smallest artifact that still forces the required reasoning behavior.
Escalate when uncertainty or consequence increases.
