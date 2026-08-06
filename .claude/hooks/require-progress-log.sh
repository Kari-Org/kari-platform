#!/usr/bin/env bash
# PreToolUse guard (Bash): require a context/progress-log.md entry before a real
# `git commit` or `git push` invocation, per the standing instruction in that file.
#
# - Only fires on an actual git commit/push at a command boundary (start of the
#   command, or after ; & | ( or `). A mere MENTION of the words inside a quoted
#   string (e.g. a `gh pr create --body "...git push..."`) does NOT trigger it.
# - `git commit`: context/progress-log.md must be in the staged set.
# - `git push`:   context/progress-log.md must appear in the commits this branch
#                 adds over origin/main.
# - Escape hatch: include the literal token [skip-log] in the command.
# - Fail OPEN on any git/parse error — a broken guard must never wedge all git.
set -u
LOG="context/progress-log.md"

payload="$(cat)"
cmd="$(printf '%s' "$payload" | jq -r '.tool_input.command // ""' 2>/dev/null || printf '')"

RE_COMMIT='(^|[;&|(`])[[:space:]]*git[[:space:]]+commit([[:space:];&|]|$)'
RE_PUSH='(^|[;&|(`])[[:space:]]*git[[:space:]]+push([[:space:];&|]|$)'

is_commit() { printf '%s' "$cmd" | grep -Eq "$RE_COMMIT"; }
is_push() { printf '%s' "$cmd" | grep -Eq "$RE_PUSH"; }

is_commit || is_push || exit 0

# Documented bypass for log-exempt changes.
case "$cmd" in
*"[skip-log]"*) exit 0 ;;
esac

root="$(git rev-parse --show-toplevel 2>/dev/null)" || exit 0
cd "$root" 2>/dev/null || exit 0

deny() {
  jq -cn --arg r "$1" \
    '{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"deny",permissionDecisionReason:$r}}'
  exit 0
}

if is_commit; then
  if ! git diff --cached --name-only 2>/dev/null | grep -qx "$LOG"; then
    deny "No context/progress-log.md entry staged for this commit. Per the standing instruction in context/progress-log.md, prepend a progress entry and stage it before committing. If this change genuinely needs no entry, re-run with [skip-log] in the command."
  fi
elif is_push; then
  if git rev-parse --verify -q origin/main >/dev/null 2>&1; then
    if ! git diff --name-only origin/main...HEAD 2>/dev/null | grep -qx "$LOG"; then
      deny "This branch adds no context/progress-log.md entry over origin/main. Per the standing instruction in context/progress-log.md, add a progress entry before pushing. If this change genuinely needs no entry, re-run with [skip-log] in the command."
    fi
  fi
fi

exit 0
