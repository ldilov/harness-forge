# Decision Rubric

## Write an ADR when

- the decision changes long-lived architecture or operations
- reversing it later will be expensive
- multiple teams or future features will depend on it
- the rationale is easy to lose after the current implementation lands

## Skip or defer an ADR when

- the change is tiny, local, and low risk
- the decision is purely tactical and short-lived
- requirements are still moving too fast to state a stable rationale

## Good decision drivers

- reliability and operability
- migration cost and reversibility
- complexity and maintenance burden
- security and compliance posture
- developer experience and delivery speed
