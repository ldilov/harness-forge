# Feature Spec

## Outcome

Define a complete, evidence-backed specification for adopting the Semi-formal Agentic Reasoning Kit as a standard operating model for repository investigation, change review, and merge decisions.

The feature outcome is a fully scoped reasoning system that preserves every capability represented in the evaluated kit:

1. Core reasoning contract
2. Structured exploration log
3. Function-trace ledger
4. Data-flow and semantic-properties ledger
5. Patch-equivalence certificate
6. Fault-localization certificate
7. Code-question-answering certificate
8. Change-safety certificate
9. Universal investigation workflow
10. Pre-merge review workflow
11. Template-selection guidance
12. Adoption strategy guidance
13. Paper-to-template source mapping
14. Harness Forge placement guidance
15. Two teaching case studies
16. Bundle-level rules, principles, and rollout model
17. Metadata and traceability expectations for all artifacts

In scope:

1. Behavioral and governance requirements for all artifacts in the kit
2. Risk-based template selection and escalation rules
3. User and reviewer decision gates
4. Evidence quality and trace completeness standards
5. Merge-readiness criteria and recommendation classes
6. Adoption modes (Lite, Standard, Deep)
7. Explicit anti-pattern bans and non-negotiable constraints

Out of scope:

1. Product runtime automation implementation outside validation and governance checks
2. Product-code changes in business modules
3. Runtime-specific prompt formatting decisions
4. Replacing local repository governance with this feature

Key entities:

1. Reasoning Contract: universal minimum structure for premises, evidence, claims, alternatives, and conclusion
2. Exploration Entry: hypothesis-led investigation step with before/after evidence capture
3. Evidence Item: location-backed observation used to support claims
4. Premise: explicit starting fact, assumption, or external semantic dependency
5. Claim: derived statement linked to premises and evidence
6. Trace Path: verified behavior path through execution, dependency, lifecycle, or registration flow
7. Certificate: task-specific formal artifact proving a decision or ranking
8. Counterexample Record: explicit falsification evidence or no-counterexample argument
9. Risk Hypothesis: plausible way the conclusion could be wrong
10. Merge Recommendation: safe to merge, safe with conditions, or not yet safe
11. Adoption Mode: Lite, Standard, or Deep rigor profile
12. Source Alignment Record: mapping from artifact behavior to source-method intent

Evaluated source artifacts (full inventory):

1. `README.md`: bundle purpose, principles, rollout levels, and non-negotiable rules.
2. `docs/adoption-strategy.md`: risk-tiered operating modes and team policy rollout.
3. `docs/paper-source-map.md`: direct adaptation versus careful generalization boundaries.
4. `docs/template-selection-guide.md`: task/risk/uncertainty template routing and escalation.
5. `examples/django-name-shadowing-mini-case-study.md`: semantic shadowing equivalence trap training case.
6. `examples/mockito-root-cause-mini-case-study.md`: manifestation-versus-root-cause localization training case.
7. `integration/harness-forge-placement.md`: canonical and thin-bridge placement model.
8. `templates/contracts/semiformal-core-contract.md`: universal evidence contract.
9. `templates/logs/semiformal-exploration-log.md`: hypothesis-led exploration logging surface.
10. `templates/ledgers/function-trace-table.md`: verified symbol behavior ledger.
11. `templates/ledgers/data-flow-and-semantic-properties.md`: state and semantic dependency ledger.
12. `templates/certificates/patch-equivalence-certificate.md`: equivalence-modulo-tests certificate.
13. `templates/certificates/fault-localization-certificate.md`: four-phase ranked root-cause certificate.
14. `templates/certificates/code-question-answering-certificate.md`: evidence-backed repository QA certificate.
15. `templates/certificates/change-safety-certificate.md`: generalized merge-safety certificate.
16. `workflows/universal-semiformal-investigation-workflow.md`: standard investigative execution sequence.
17. `workflows/pre-merge-semiformal-review-workflow.md`: pre-merge governance and recommendation workflow.
## Users and jobs to be done

Primary users:

1. Investigation Engineer: needs to answer repository behavior questions without unsupported intuition
2. Change Author: needs to prove change safety before proposing merge
3. Reviewer: needs to evaluate whether conclusions are evidence-backed and replayable
4. Maintainer: needs a universal standard that scales from light analysis to high-risk decisions
5. Incident Responder: needs to localize root causes instead of stopping at crash locations
6. Team Lead: needs policy-level consistency across contributors and tasks

Jobs to be done:

1. As an investigation engineer, I need a structured way to gather and evaluate evidence so my conclusions are reproducible.
2. As a change author, I need to separate preserved behavior from changed behavior so I can explain risk clearly.
3. As a reviewer, I need to validate claims quickly by tracing premises to evidence and conclusions.
4. As a maintainer, I need a risk-scaled workflow so the process remains usable for both low-risk and high-risk tasks.
5. As an incident responder, I need ranked fault candidates tied to test semantics and divergence claims.
6. As a team lead, I need governance rules that ban unsupported reasoning patterns.

User scenarios and testing coverage:

1. Patch Equivalence Decision: two solutions are compared and judged equivalent or non-equivalent modulo the same test scope, with explicit counterexample handling.
2. Fault Localization: failing behavior is analyzed through four reasoning phases and delivered as ranked root-cause candidates.
3. Code Semantics QA: a repository question is answered with verified trace behavior, data flow, and semantic-property evidence.
4. Change Safety Review: a proposed change is assessed for merge readiness with explicit preserved-vs-changed behavior claims.
5. Pre-Merge Governance Gate: reviewer evaluates evidence spine, counterexample pressure, and unresolved assumptions before merge recommendation.
6. Lite Investigation: low-risk task uses minimal contract and short exploration log while preserving alternative-hypothesis checks.
7. Standard Investigation: medium-risk task escalates to one certificate with explicit traced paths.
8. Deep Investigation: high-risk task requires full exploration record, full certificate, unresolved assumptions, and ship/no-ship posture.
9. Hidden Semantics Ambiguity: investigation explicitly records unresolved third-party or lifecycle semantics and adjusts confidence accordingly.
10. Multi-file Indirection: investigation follows configuration, registration, adapter, or lifecycle hops before claiming causality.
11. Reviewer Replay: independent reviewer reconstructs decision from artifacts without relying on author intuition.
12. Training and Onboarding: case studies are used to demonstrate name-shadowing and manifestation-vs-root-cause traps.

## Acceptance criteria

Functional requirements:

1. FR-001: The feature shall define and govern all 17 evaluated kit artifacts as required surfaces within the reasoning system.
2. FR-002: The feature shall classify all artifacts into explicit groups: contract, log, ledgers, certificates, workflows, strategy docs, mapping docs, examples, and integration guidance.
3. FR-003: Each artifact shall include a clear intended decision context and minimum required output quality.
4. FR-004: The feature shall preserve the distinction between direct task-template adaptations and generalized operational templates.
5. FR-005: The feature shall require that all meaningful behavior conclusions are reconstructable from documented premises, evidence, and claims.
6. FR-006: The core reasoning contract shall require six outputs: premises, evidence ledger, derived claims, alternative-hypothesis check, formal conclusion, unresolved assumptions.
7. FR-007: Every premise shall be tagged as repository fact, task fact, assumption, or external semantics dependency.
8. FR-008: Every evidence item shall include source, location, observation, and relevance.
9. FR-009: Every decisive claim shall reference specific premises and specific evidence items.
10. FR-010: The system shall prohibit high-confidence conclusions with low evidence completeness unless explicitly flagged as a risk.
11. FR-011: Unresolved assumptions and blind spots shall remain visible in final outputs and never be silently omitted.
12. FR-012: Exploration logging shall require a pre-read hypothesis and rationale before each new file, symbol, or configuration request.
13. FR-013: Exploration logging shall capture post-read observations with locations, hypothesis updates, unresolved questions, and continue/stop justification.
14. FR-014: Every exploration step shall record both evidence quality and trace completeness.
15. FR-015: Exploration shall escalate to full certification when decision impact, branching uncertainty, hidden semantics, or multi-file complexity is present.
16. FR-016: Function-trace artifacts shall include only inspected symbols and verified behavior, with decisive hidden semantics called out when present.
17. FR-017: Data-flow artifacts shall capture creation, mutation, read sites, downstream effects, and edge conditions for material state items.
18. FR-018: Semantic-properties artifacts shall differentiate verified, inferred, and externally assumed semantics.
19. FR-019: Semantic reasoning shall include an explicit opposite-assumption check and result classification.
20. FR-020: Patch-equivalence certification shall define equivalence modulo test outcomes and explicitly analyze both fail-to-pass and pass-to-pass test classes when relevant.
21. FR-021: Patch-equivalence certification shall include exactly one of two outcomes: explicit counterexample or explicit no-counterexample argument with residual assumptions.
22. FR-022: Fault-localization certification shall follow four phases: test semantics analysis, path tracing, divergence analysis, and ranked predictions.
23. FR-023: Fault-localization rankings shall map each ranked candidate to supporting claims and premises.
24. FR-024: Fault-localization outputs shall explicitly distinguish root-cause candidates from crash-site manifestations.
25. FR-025: Code-question-answering certification shall require function trace, data-flow analysis, semantic-property analysis, and alternative-hypothesis validation.
26. FR-026: Change-safety certification shall separate preserved-behavior claims from changed-behavior claims.
27. FR-027: Change-safety certification shall include regression hypotheses with evidence for and against each hypothesis.
28. FR-028: Change-safety outputs shall issue one of three recommendations: safe to merge, safe with conditions, or not yet safe.
29. FR-029: All certificate conclusions shall explicitly separate directly supported findings from assumptions.
30. FR-030: The universal investigation workflow shall enforce a seven-step sequence from decision framing through conclusion synthesis.
31. FR-031: The pre-merge workflow shall define trigger conditions for correctness-sensitive, cross-cutting, security-relevant, migration-related, or high-impact changes.
32. FR-032: Pre-merge review shall evaluate problem framing quality, evidence quality, counterexample pressure, and conclusion quality before recommendation.
33. FR-033: Reviewer outputs shall use a standard comment pattern including strongest support, strongest unresolved concern, counterexample status, and decision-changing evidence.
34. FR-034: Template selection shall be available by task type, risk level, and uncertainty source, with explicit escalation criteria.
35. FR-035: Adoption policy shall support Lite, Standard, and Deep modes with clearly defined minimum artifacts and minimum evidence bar per mode.
36. FR-036: Team-level non-negotiable rules shall ban unsupported conclusions, surface-only equivalence claims, and reasoning that omits alternatives on consequential decisions.
37. FR-037: The feature shall preserve bundle-level anti-pattern bans, including random file exploration without hypothesis and assertion without location-backed evidence.
38. FR-038: The feature shall include a placement model supporting canonical reasoning assets and optional thin bridge visibility.
39. FR-039: The feature shall provide integration guidance for planning, investigation, and review phases with artifact expectations per phase.
40. FR-040: The feature shall include training coverage using both mini case studies and the reusable lessons they encode.
41. FR-041: The feature shall maintain source-alignment mapping between artifacts and originating reasoning patterns to prevent accidental method drift.
42. FR-042: The feature shall preserve rollout guidance that maximizes evidentiary pressure where correctness matters while minimizing unnecessary ceremony in low-risk tasks.
43. FR-043: The feature shall remain target-agnostic across supported agent environments and human review workflows.
44. FR-044: The feature shall require explicit final decision statements and bounded confidence/evidence completeness in every consequential artifact.

Edge cases:

1. Third-party semantics cannot be directly verified from repository source.
2. Critical behavior is influenced by hidden registration, lifecycle, or configuration indirection.
3. Two patches appear syntactically similar but resolve through different semantic paths.
4. Failure manifestation point differs from origin of incorrect state mutation.
5. Multiple plausible root causes remain after initial divergence analysis.
6. Decision must proceed under partial evidence due execution constraints.
7. Expected and observed outcomes differ only under rare input or boundary behavior.
8. Evidence volume is high but trace completeness is low.

Dependencies:

1. Contributors can access and cite repository evidence locations.
2. Review process accepts structured reasoning artifacts as merge inputs.
3. Task briefs identify intended decision scope and non-goals.
4. Teams have authority to enforce pre-merge evidence gates for high-risk work.
5. Owners maintain template and policy consistency over time.

Success criteria:

1. SC-001: 100% of evaluated kit artifacts are represented in the final reasoning-system scope and requirement set.
2. SC-002: 100% of consequential decisions include explicit premises, evidence, alternative-hypothesis outcome, and formal conclusion.
3. SC-003: At least 95% of reviewed high-risk changes include explicit preserved-vs-changed behavior separation.
4. SC-004: At least 90% of reviewer spot-checks can replay the decisive reasoning path in under 5 minutes.
5. SC-005: 100% of patch-equivalence reviews contain either a counterexample or a no-counterexample argument with stated assumptions.
6. SC-006: At least 90% of fault-localization reports explicitly distinguish root cause from manifestation site.
7. SC-007: 100% of code-semantics answers include trace evidence and semantic-property evidence.
8. SC-008: At least 90% of medium/high-risk investigations escalate to the correct artifact weight based on the documented escalation rule.
9. SC-009: 100% of final recommendations include explicit unresolved assumptions when uncertainty remains.
10. SC-010: Unsupported or location-free material claims in merge-bound artifacts are reduced to under 5% of sampled artifacts within one adoption cycle.

Scope boundaries:

1. The feature specifies reasoning behavior and governance, not runtime execution tooling.
2. The feature governs evidence quality and decision quality, not product feature scope.
3. The feature standardizes artifact expectations but does not mandate one team topology.

## Risks and assumptions

Risks:

1. Overly heavy process adoption for low-risk tasks can reduce usage consistency.
2. Superficial template completion may create the appearance of rigor without real tracing.
3. Reviewers may check prose quality instead of evidence spine quality.
4. Teams may skip alternative-hypothesis checks under schedule pressure.
5. Hidden semantics may remain unresolved and be mistaken for proven behavior.
6. Confidence language may drift ahead of evidence completeness.

Assumptions:

1. Teams adopting this feature prioritize correctness and replayability over speed-only decision making for high-impact changes.
2. Contributors are able to cite concrete evidence locations in reviewed repositories.
3. Reviewers can perform at least one decisive-path spot-check for merge-sensitive changes.
4. The organization accepts risk-tiered process depth instead of one-size-fits-all rigor.
5. The evaluated archive content is treated as authoritative baseline for this specification version.

Risk mitigations:

1. Use Lite/Standard/Deep modes to keep ceremony proportional to risk.
2. Enforce mandatory minimum fields that require trace and evidence linkage.
3. Require explicit alternative-hypothesis section on consequential decisions.
4. Require unresolved assumptions to remain visible through final recommendation.
5. Audit artifacts weekly and at each release gate against the checklist before planning or implementation phases.


