#!/usr/bin/env bash
# Claude hook script — NOT a runtime script. Runs automatically via PostToolUse(Edit|Write) hook.
# Purpose: Python syntax check on .py file edits; silently passes for non-Python files.

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('file_path',''))" 2>/dev/null)

[[ "$FILE_PATH" != *.py ]] && exit 0
[[ ! -f "$FILE_PATH" ]] && exit 0

python3 -m py_compile "$FILE_PATH" 2>&1
