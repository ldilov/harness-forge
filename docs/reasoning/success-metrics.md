# Success Metrics

This document operationalizes specification success criteria for semiformal reasoning rollout.

| ID | Metric | Target | Measurement Method | Cadence |
|---|---|---|---|---|
| SC-001 | Artifact family coverage | 100% | Coverage matrix parity review | Per release |
| SC-002 | Consequential decision evidence completeness | 100% | Contract test + spot audit | Weekly |
| SC-003 | Preserved-vs-changed behavior separation on high-risk reviews | >=95% | Change-safety certificate audit | Weekly |
| SC-004 | Reviewer replayability in <5 minutes | >=90% | Reviewer dry-run audit | Bi-weekly |
| SC-005 | Counterexample/no-counterexample handling in patch equivalence | 100% | Patch-equivalence artifact audit | Weekly |
| SC-006 | Root cause vs manifestation distinction in fault reports | >=90% | Fault-localization audit | Weekly |
| SC-007 | Trace + semantic evidence in code-QA answers | 100% | Code-QA contract checks | Weekly |
| SC-008 | Correct escalation mode application | >=90% | Risk-mode audit | Bi-weekly |
| SC-009 | Explicit unresolved assumptions in final recommendations | 100% | Pre-merge contract review | Weekly |
| SC-010 | Unsupported/location-free claim rate in merge-bound artifacts | <5% | CI validation + manual sample | Monthly |
