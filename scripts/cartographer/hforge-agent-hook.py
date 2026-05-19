#!/usr/bin/env python3
"""Recommend-only Harness Forge agent hook helper.

Prints the command plan for an agent lifecycle event. It never executes
commands; execution and audit happen in-process via ``hforge agent hook``.
"""
from __future__ import annotations

import argparse
import json
import os
from dataclasses import dataclass, asdict
from typing import List


@dataclass(frozen=True)
class Recommendation:
    command: str
    reason: str
    autoExecutable: bool = True


def q(value: str) -> str:
    escaped = value.replace('"', '\\"')
    return f'"{escaped}"'


def split_files(value: str | None) -> List[str]:
    if not value:
        return []
    return [item.strip() for item in value.split(',') if item.strip()]


def build_plan(event: str, goal: str, files: List[str], hforge: str) -> List[Recommendation]:
    file_arg = ','.join(files)
    recs: List[Recommendation] = []
    if event == 'task.started':
        recs.append(Recommendation(f'{hforge} graph build --if-stale', 'Keep project graph fresh.'))
        recs.append(Recommendation(f'{hforge} context compile --goal {q(goal or "")}', 'Produce focused task context.'))
    elif event == 'task.context_needed':
        recs.append(Recommendation(f'{hforge} context compile --goal {q(goal or "")}', 'Agent requested focused context.'))
    elif event in ('files.pre_edit', 'files.changed'):
        recs.append(Recommendation(f'{hforge} impact --files {q(file_arg)} --json', 'Estimate change impact.'))
    elif event in ('command.failed', 'tests.failed'):
        recs.append(Recommendation(f'{hforge} impact --files {q(file_arg)} --json', 'Link failure to impacted modules.'))
    elif event in ('pr.prep', 'task.completed'):
        recs.append(Recommendation(f'{hforge} impact --changed --json', 'Summarize changed-file impact.'))
    else:
        recs.append(Recommendation(f'{hforge} context compile --goal {q(goal or event)}', 'Fallback context.', False))
    return recs


def main() -> int:
    parser = argparse.ArgumentParser(description='Recommend-only Harness Forge agent hook helper')
    parser.add_argument('--event', required=True)
    parser.add_argument('--goal', default='')
    parser.add_argument('--files', default='')
    parser.add_argument('--command', default='')
    parser.add_argument('--log', default='')
    parser.add_argument('--execute', action='store_true')
    parser.add_argument('--json', action='store_true')
    args = parser.parse_args()

    hforge = os.environ.get('HFORGE_BIN', 'hforge')
    files = split_files(args.files)
    recs = build_plan(args.event, args.goal, files, hforge)
    diagnostics: List[str] = []
    if args.execute:
        diagnostics.append(
            "this helper never executes commands; run 'hforge agent hook --execute' for in-process diagnostic execution"
        )

    payload = {
        'event': args.event,
        'mode': 'dry-run',
        'recommendedCommands': [asdict(r) for r in recs],
        'executedCommands': [],
        'diagnostics': diagnostics,
        'nextAction': "review the plan, then call 'hforge agent hook' for execution and audit",
    }

    if args.json:
        print(json.dumps(payload, indent=2))
    else:
        print(f'Event: {args.event}')
        print('Mode: dry-run')
        for item in diagnostics:
            print(f'Note: {item}')
        print('Recommended commands:')
        for rec in recs:
            print(f'- {rec.command}')
            print(f'  reason: {rec.reason}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
