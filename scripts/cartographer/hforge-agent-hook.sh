#!/usr/bin/env sh
set -eu

EVENT="${1:-task.started}"
GOAL="${2:-}"
FILES="${3:-}"
HFORGE_BIN="${HFORGE_BIN:-hforge}"

quote() {
  printf '"%s"' "$(printf '%s' "$1" | sed 's/"/\\"/g')"
}

print_cmd() {
  printf '%s\n' "$1"
}

printf 'Event: %s\n' "$EVENT"
printf 'Mode: dry-run\n'
printf 'Recommended commands:\n'

case "$EVENT" in
  task.started)
    print_cmd "- $HFORGE_BIN graph build --if-stale"
    print_cmd "- $HFORGE_BIN context compile --goal $(quote "$GOAL")"
    ;;
  task.context_needed)
    print_cmd "- $HFORGE_BIN context compile --goal $(quote "$GOAL")"
    ;;
  files.pre_edit)
    print_cmd "- $HFORGE_BIN impact --files $(quote "$FILES") --json"
    ;;
  files.changed)
    print_cmd "- $HFORGE_BIN impact --files $(quote "$FILES") --json"
    ;;
  command.failed|tests.failed)
    print_cmd "- $HFORGE_BIN impact --files $(quote "$FILES") --json"
    ;;
  pr.prep|task.completed)
    print_cmd "- $HFORGE_BIN impact --changed --json"
    ;;
  *)
    print_cmd "- $HFORGE_BIN context compile --goal $(quote "$GOAL")"
    ;;
esac

printf 'Note: this helper only prints a plan; execution and audit go through "hforge agent hook".\n'
