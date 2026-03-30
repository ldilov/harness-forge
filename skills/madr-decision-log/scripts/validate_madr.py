#!/usr/bin/env python3
"""Validate MADR-style ADR files for common structural mistakes."""

from __future__ import annotations

import argparse
import re
from pathlib import Path

REQUIRED_SECTIONS = [
    "## Context and Problem Statement",
    "## Considered Options",
    "## Decision Outcome",
]

CANONICAL_OPTION_SECTION = "## Pros and Cons of the Options"


def collect_files(target: Path) -> list[Path]:
    if target.is_file():
        return [target]
    return sorted(path for path in target.rglob("*.md") if path.name != "ADR-LOG.md")


def extract_considered_options(text: str) -> list[str]:
    match = re.search(r"^## Considered Options\n(.*?)(?:\n## |\Z)", text, re.MULTILINE | re.DOTALL)
    if not match:
        return []
    options_block = match.group(1)
    return [m.group(1).strip() for m in re.finditer(r"^\*\s+(.+)$", options_block, re.MULTILINE)]


def validate_file(path: Path) -> tuple[list[str], list[str]]:
    errors: list[str] = []
    warnings: list[str] = []
    text = path.read_text(encoding="utf-8")

    if not text.startswith("---\n"):
        warnings.append("missing yaml front matter")

    title_match = re.search(r"^#\s+(.+)$", text, re.MULTILINE)
    if not title_match:
        errors.append("missing top-level title")

    for section in REQUIRED_SECTIONS:
        if section not in text:
            errors.append(f"missing required section: {section}")

    options = extract_considered_options(text)
    if len(options) < 2:
        warnings.append("fewer than two considered options")

    outcome_match = re.search(r'^Chosen option:\s+"(.+?)",\s+because\s+.+$', text, re.MULTILINE)
    if not outcome_match:
        errors.append('decision outcome should contain: Chosen option: "...", because ...')
    else:
        chosen = outcome_match.group(1).strip()
        if options and chosen not in options:
            errors.append(f'chosen option "{chosen}" does not match any considered option exactly')

    if CANONICAL_OPTION_SECTION in text:
        for option in options:
            if f"### {option}" not in text:
                warnings.append(f'missing pros/cons subsection for option: {option}')

    if "### Confirmation" not in text:
        warnings.append("missing confirmation section")

    name_match = re.match(r"^(\d{4})-[a-z0-9-]+\.md$", path.name)
    if not name_match and path.name != "ADR-LOG.md":
        warnings.append("filename does not match NNNN-title-with-dashes.md")

    return errors, warnings


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate MADR-style ADR files")
    parser.add_argument("target", help="ADR markdown file or directory")
    args = parser.parse_args()

    target = Path(args.target).resolve()
    if not target.exists():
        raise SystemExit(f"Target not found: {target}")

    files = collect_files(target)
    if not files:
        raise SystemExit("No markdown ADR files found")

    total_errors = 0
    total_warnings = 0
    for path in files:
        errors, warnings = validate_file(path)
        print(f"FILE {path}")
        if not errors and not warnings:
            print("  OK")
        for err in errors:
            print(f"  ERROR: {err}")
        for warn in warnings:
            print(f"  WARN: {warn}")
        total_errors += len(errors)
        total_warnings += len(warnings)

    print(f"SUMMARY errors={total_errors} warnings={total_warnings} files={len(files)}")
    return 1 if total_errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
