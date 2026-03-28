# Decision rubric

Create or update a record when the choice affects one or more of these:
- runtime behavior
- package or bundle boundaries
- target support posture
- migration or rollback strategy
- validation, release, or maintenance guarantees

Prefer ASR when:
- exploration is still active
- the trade-offs are being narrowed
- the work needs a reviewable candidate before acceptance

Prefer ADR when:
- the direction is stable enough to guide future work
- the team needs a durable accepted rationale
- the decision supersedes an earlier record
