# Scoring Model

Use 0 to 5 for each factor.

- **0** = none / not applicable / strongly mitigated
- **1** = minimal
- **2** = limited
- **3** = moderate
- **4** = major
- **5** = extreme

Keep impact quantity, risk, and confidence separate.

## 1. Impact Quantity

### Factors and weights

| Factor | Weight | Meaning |
|---|---:|---|
| components_touched | 20 | number of components, repos, modules, services, or apps touched |
| interface_surface | 20 | number and importance of contracts, APIs, events, schemas, or file formats affected |
| data_surface | 15 | breadth of data model, migrations, storage paths, cache keys, or derived data touched |
| deployment_surface | 10 | environments, regions, pipelines, release steps, or infra layers affected |
| user_workflow_reach | 15 | breadth of user, support, analyst, or operator workflows affected |
| dependency_fanout | 20 | number of direct and indirect dependents or consumers |

### Formula

impact quantity = weighted average of the six factors, normalized to 0..100.

### Bands

| Score | Band |
|---:|---|
| 0-19 | tiny |
| 20-39 | contained |
| 40-59 | broad |
| 60-79 | wide |
| 80-100 | systemic |

## 2. Risk

### Factors and weights

| Factor | Weight | Meaning |
|---|---:|---|
| technical_complexity | 12 | algorithmic, concurrency, state, or integration complexity introduced |
| coupling | 14 | hidden dependencies and tight cross-boundary coupling |
| business_criticality | 18 | severity if the change fails in production |
| rollback_difficulty | 12 | difficulty of safe reversal, repair, or compatibility fallback |
| observability_gap | 10 | probability that failure will be hard to detect or diagnose |
| novelty | 8 | unfamiliarity of approach, stack, or execution path |
| security_data_sensitivity | 14 | exposure to auth, permissions, money, privacy, or regulated data |
| runtime_exposure | 12 | scale, traffic, concurrency, or operational exposure of the change |

### Formula

risk = weighted average of the eight factors, normalized to 0..100, then adjusted by escalators.

### Escalators

Apply these after the base score:

- if `security_data_sensitivity >= 4` and `runtime_exposure >= 4`, set risk to at least **80**
- if `business_criticality >= 4` and `rollback_difficulty >= 4`, add **8**
- if `observability_gap >= 4`, add **5**
- if `coupling >= 4` and `interface_surface >= 4`, add **5**

Cap the final score at 100.

### Bands

| Score | Band |
|---:|---|
| 0-19 | negligible |
| 20-39 | low |
| 40-59 | medium |
| 60-79 | high |
| 80-100 | critical |

## 3. Confidence

Confidence measures the quality of the analysis, not the safety of the change.

### Factors and weights

| Factor | Weight | Meaning |
|---|---:|---|
| primary_evidence | 35 | presence of real diffs, schemas, manifests, or runtime artifacts |
| dependency_coverage | 25 | confidence that key consumers and dependencies were identified |
| validation_coverage | 20 | strength of tests, checks, and rollout probes |
| observability_readiness | 20 | confidence that regressions will be visible quickly |

### Formula

confidence = weighted average of the four factors, normalized to 0..100.

### Bands

| Score | Band |
|---:|---|
| 0-19 | speculative |
| 20-39 | weak |
| 40-59 | usable |
| 60-79 | strong |
| 80-100 | high assurance |

## 4. Interpretation Rules

- high impact quantity + low risk often means broad but well-contained work, such as internal refactors with strong boundaries
- low impact quantity + high risk often means a small but dangerous change, such as permissions, migrations, or retry behavior
- high risk + low confidence is the most important red flag
- high impact quantity + high confidence can still be acceptable if rollout and rollback are designed well

## 5. Minimum narrative after scoring

Always explain:
- what mostly drove impact quantity
- what mostly drove risk
- what mostly reduced confidence
- which safeguards would lower risk fastest
