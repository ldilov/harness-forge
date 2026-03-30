#!/usr/bin/env python3
"""Scaffold a new MADR-style ADR markdown file."""

from __future__ import annotations

import argparse
import re
from datetime import date
from pathlib import Path


def slugify(text: str) -> str:
    text = text.strip().lower()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return re.sub(r"-+", "-", text).strip("-") or "untitled-decision"


def parse_people(csv_value: str | None) -> list[str]:
    if not csv_value:
        return []
    return [part.strip() for part in csv_value.split(",") if part.strip()]


def find_next_number(decisions_dir: Path) -> int:
    max_num = 0
    for path in decisions_dir.rglob("*.md"):
        match = re.match(r"^(\d{4})-", path.name)
        if match:
            max_num = max(max_num, int(match.group(1)))
    return max_num + 1


def ensure_list_block(key: str, values: list[str]) -> str:
    if not values:
        return f"{key}:\n  - TBD"
    lines = "\n".join(f"  - {value}" for value in values)
    return f"{key}:\n{lines}"


def build_template(title: str, when: str, status: str, decision_makers: list[str], consulted: list[str], informed: list[str]) -> str:
    return f"""---
status: {status}
date: {when}
{ensure_list_block('decision-makers', decision_makers)}
{ensure_list_block('consulted', consulted)}
{ensure_list_block('informed', informed)}
---

# {title}

## Context and Problem Statement

Describe the situation that requires a decision and the problem to solve.

## Decision Drivers

* Driver 1
* Driver 2
* Driver 3

## Considered Options

* Option A
* Option B
* Option C

## Decision Outcome

Chosen option: "Option A", because it best satisfies the key decision drivers while keeping the main trade-offs acceptable.

### Consequences

* Good, because ...
* Neutral, because ...
* Bad, because ...

### Confirmation

Describe how the decision will be confirmed in implementation or operations.

## Pros and Cons of the Options

### Option A

* Good, because ...
* Bad, because ...

### Option B

* Good, because ...
* Bad, because ...

### Option C

* Good, because ...
* Bad, because ...

## More Information

Add links to related ADRs, issues, RFCs, diagrams, or rollout notes.
"""


def main() -> int:
    parser = argparse.ArgumentParser(description="Create a new MADR-style ADR file")
    parser.add_argument("--dir", required=True, help="Path to docs/decisions directory")
    parser.add_argument("--title", required=True, help="Human-readable ADR title")
    parser.add_argument("--status", default="proposed", help="ADR status")
    parser.add_argument("--date", dest="adr_date", default=date.today().isoformat(), help="ADR date in YYYY-MM-DD format")
    parser.add_argument("--decision-makers", help="Comma-separated decision makers")
    parser.add_argument("--consulted", help="Comma-separated consulted stakeholders")
    parser.add_argument("--informed", help="Comma-separated informed stakeholders")
    parser.add_argument("--category", help="Optional single-level category subdirectory")
    args = parser.parse_args()

    decisions_dir = Path(args.dir).resolve()
    target_dir = decisions_dir / args.category if args.category else decisions_dir
    target_dir.mkdir(parents=True, exist_ok=True)

    number = find_next_number(decisions_dir)
    filename = f"{number:04d}-{slugify(args.title)}.md"
    target_path = target_dir / filename
    if target_path.exists():
        raise SystemExit(f"Target file already exists: {target_path}")

    content = build_template(
        title=args.title.strip(),
        when=args.adr_date,
        status=args.status.strip(),
        decision_makers=parse_people(args.decision_makers),
        consulted=parse_people(args.consulted),
        informed=parse_people(args.informed),
    )
    target_path.write_text(content, encoding="utf-8")
    print(target_path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
