#!/usr/bin/env python3
"""Deterministic impact, risk, and confidence score calculator.

Input JSON schema:
{
  "impact": {
    "components_touched": 0-5,
    "interface_surface": 0-5,
    "data_surface": 0-5,
    "deployment_surface": 0-5,
    "user_workflow_reach": 0-5,
    "dependency_fanout": 0-5
  },
  "risk": {
    "technical_complexity": 0-5,
    "coupling": 0-5,
    "business_criticality": 0-5,
    "rollback_difficulty": 0-5,
    "observability_gap": 0-5,
    "novelty": 0-5,
    "security_data_sensitivity": 0-5,
    "runtime_exposure": 0-5
  },
  "confidence": {
    "primary_evidence": 0-5,
    "dependency_coverage": 0-5,
    "validation_coverage": 0-5,
    "observability_readiness": 0-5
  }
}
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Dict, List, Tuple

IMPACT_WEIGHTS = {
    "components_touched": 20,
    "interface_surface": 20,
    "data_surface": 15,
    "deployment_surface": 10,
    "user_workflow_reach": 15,
    "dependency_fanout": 20,
}

RISK_WEIGHTS = {
    "technical_complexity": 12,
    "coupling": 14,
    "business_criticality": 18,
    "rollback_difficulty": 12,
    "observability_gap": 10,
    "novelty": 8,
    "security_data_sensitivity": 14,
    "runtime_exposure": 12,
}

CONFIDENCE_WEIGHTS = {
    "primary_evidence": 35,
    "dependency_coverage": 25,
    "validation_coverage": 20,
    "observability_readiness": 20,
}


BANDS = {
    "impact": [(19, "tiny"), (39, "contained"), (59, "broad"), (79, "wide"), (100, "systemic")],
    "risk": [(19, "negligible"), (39, "low"), (59, "medium"), (79, "high"), (100, "critical")],
    "confidence": [(19, "speculative"), (39, "weak"), (59, "usable"), (79, "strong"), (100, "high assurance")],
}


def load_input(path: Path) -> Dict[str, Dict[str, float]]:
    data = json.loads(path.read_text())
    if not isinstance(data, dict):
        raise ValueError("Top-level JSON must be an object")
    return data


def validate_section(name: str, data: Dict[str, float], weights: Dict[str, int]) -> None:
    missing = [key for key in weights if key not in data]
    extra = [key for key in data if key not in weights]
    if missing:
        raise ValueError(f"Section '{name}' is missing keys: {', '.join(missing)}")
    if extra:
        raise ValueError(f"Section '{name}' has unknown keys: {', '.join(extra)}")
    for key, value in data.items():
        if not isinstance(value, (int, float)):
            raise ValueError(f"Section '{name}' key '{key}' must be numeric")
        if value < 0 or value > 5:
            raise ValueError(f"Section '{name}' key '{key}' must be between 0 and 5")


def weighted_score(data: Dict[str, float], weights: Dict[str, int]) -> float:
    total_weight = sum(weights.values())
    weighted = sum(data[key] * weights[key] for key in weights)
    return (weighted / (5.0 * total_weight)) * 100.0


def top_drivers(data: Dict[str, float], weights: Dict[str, int], limit: int = 3) -> List[Tuple[str, float]]:
    contributions = []
    total_weight = sum(weights.values())
    for key, weight in weights.items():
        contribution = (data[key] * weight / (5.0 * total_weight)) * 100.0
        contributions.append((key, contribution))
    contributions.sort(key=lambda item: item[1], reverse=True)
    return contributions[:limit]


def band_for(score: float, dimension: str) -> str:
    rounded = max(0, min(100, round(score)))
    for threshold, label in BANDS[dimension]:
        if rounded <= threshold:
            return label
    return BANDS[dimension][-1][1]


def apply_risk_escalators(base_risk: float, risk: Dict[str, float], impact: Dict[str, float]) -> Tuple[float, List[str]]:
    adjusted = base_risk
    escalators: List[str] = []

    if risk["security_data_sensitivity"] >= 4 and risk["runtime_exposure"] >= 4:
        adjusted = max(adjusted, 80.0)
        escalators.append("security_data_sensitivity>=4 and runtime_exposure>=4 => risk floor 80")

    if risk["business_criticality"] >= 4 and risk["rollback_difficulty"] >= 4:
        adjusted += 8.0
        escalators.append("business_criticality>=4 and rollback_difficulty>=4 => +8")

    if risk["observability_gap"] >= 4:
        adjusted += 5.0
        escalators.append("observability_gap>=4 => +5")

    if risk["coupling"] >= 4 and impact["interface_surface"] >= 4:
        adjusted += 5.0
        escalators.append("coupling>=4 and interface_surface>=4 => +5")

    return min(100.0, adjusted), escalators


def as_markdown(results: Dict[str, object]) -> str:
    lines = []
    lines.append("| Dimension | Score | Band | Top drivers |")
    lines.append("|---|---:|---|---|")
    for dimension in ("impact", "risk", "confidence"):
        entry = results[dimension]
        drivers = ", ".join(f"{k} ({v:.1f})" for k, v in entry["drivers"])
        lines.append(f"| {dimension} | {entry['score']:.1f} | {entry['band']} | {drivers} |")
    lines.append("")
    lines.append("Escalators:")
    escalators = results["risk"]["escalators"]
    if escalators:
        for item in escalators:
            lines.append(f"- {item}")
    else:
        lines.append("- none")
    return "\n".join(lines)


def main() -> None:
    parser = argparse.ArgumentParser(description="Calculate impact, risk, and confidence scores from a JSON scorecard.")
    parser.add_argument("--input", required=True, help="Path to the input JSON file")
    parser.add_argument("--format", choices=["json", "markdown"], default="json", help="Output format")
    args = parser.parse_args()

    data = load_input(Path(args.input))

    for section_name, weights in (("impact", IMPACT_WEIGHTS), ("risk", RISK_WEIGHTS), ("confidence", CONFIDENCE_WEIGHTS)):
        if section_name not in data:
            raise ValueError(f"Missing section '{section_name}'")
        validate_section(section_name, data[section_name], weights)

    impact_score = weighted_score(data["impact"], IMPACT_WEIGHTS)
    risk_base = weighted_score(data["risk"], RISK_WEIGHTS)
    risk_score, escalators = apply_risk_escalators(risk_base, data["risk"], data["impact"])
    confidence_score = weighted_score(data["confidence"], CONFIDENCE_WEIGHTS)

    results = {
        "impact": {
            "score": impact_score,
            "band": band_for(impact_score, "impact"),
            "drivers": top_drivers(data["impact"], IMPACT_WEIGHTS),
        },
        "risk": {
            "score": risk_score,
            "band": band_for(risk_score, "risk"),
            "drivers": top_drivers(data["risk"], RISK_WEIGHTS),
            "escalators": escalators,
            "base_score": risk_base,
        },
        "confidence": {
            "score": confidence_score,
            "band": band_for(confidence_score, "confidence"),
            "drivers": top_drivers(data["confidence"], CONFIDENCE_WEIGHTS),
        },
    }

    if args.format == "markdown":
        print(as_markdown(results))
    else:
        print(json.dumps(results, indent=2))


if __name__ == "__main__":
    main()
