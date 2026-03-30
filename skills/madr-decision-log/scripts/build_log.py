#!/usr/bin/env python3
"""Generate ADR-LOG.md from MADR-style ADR files."""

from __future__ import annotations

import argparse
import re
from pathlib import Path


def read_field(text: str, key: str) -> str:
    pattern = rf"^{re.escape(key)}:\s*(.+)$"
    match = re.search(pattern, text, re.MULTILINE)
    return match.group(1).strip() if match else ""


def read_title(text: str) -> str:
    match = re.search(r"^#\s+(.+)$", text, re.MULTILINE)
    return match.group(1).strip() if match else "(missing title)"


def adr_records(decisions_dir: Path) -> list[dict[str, str]]:
    records: list[dict[str, str]] = []
    for path in sorted(decisions_dir.rglob("*.md")):
        if path.name == "ADR-LOG.md":
            continue
        text = path.read_text(encoding="utf-8")
        num_match = re.match(r"^(\d{4})-", path.name)
        adr_id = f"ADR-{num_match.group(1)}" if num_match else "ADR-????"
        rel_path = path.relative_to(decisions_dir)
        category = rel_path.parts[0] if len(rel_path.parts) > 1 else "-"
        records.append(
            {
                "id": adr_id,
                "title": read_title(text),
                "status": read_field(text, "status") or "-",
                "date": read_field(text, "date") or "-",
                "category": category,
                "path": rel_path.as_posix(),
            }
        )
    return records


def build_markdown(records: list[dict[str, str]]) -> str:
    lines = [
        "# ADR Log",
        "",
        "Generated from MADR-style ADR files. The ADR files remain the source of truth.",
        "",
        "| ID | Title | Status | Date | Category | Path |",
        "| --- | --- | --- | --- | --- | --- |",
    ]
    for record in records:
        lines.append(
            f"| {record['id']} | {record['title']} | {record['status']} | {record['date']} | {record['category']} | `{record['path']}` |"
        )
    lines.append("")
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description="Build ADR-LOG.md from ADR files")
    parser.add_argument("decisions_dir", help="Path to docs/decisions directory")
    args = parser.parse_args()

    decisions_dir = Path(args.decisions_dir).resolve()
    decisions_dir.mkdir(parents=True, exist_ok=True)
    log_path = decisions_dir / "ADR-LOG.md"
    records = adr_records(decisions_dir)
    log_path.write_text(build_markdown(records), encoding="utf-8")
    print(log_path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
