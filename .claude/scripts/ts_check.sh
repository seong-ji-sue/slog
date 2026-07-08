#!/bin/bash
# Claude hook script — NOT a runtime script. Runs automatically via PostToolUse(Edit|Write) hook.
# Purpose: TypeScript type check on frontend file edits.

input=$(cat)

file=$(python3 -c "
import json, sys
try:
    d = json.load(sys.stdin)
    fp = d.get('file_path') or d.get('new_file_path') or ''
    print(fp)
except:
    print('')
" <<< "$input" 2>/dev/null)

# 프론트엔드 파일(.ts/.tsx)이 아니면 즉시 종료
if [[ "$file" != *"web/frontend"* ]] || [[ "$file" != *".ts"* && "$file" != *".tsx"* ]]; then
  exit 0
fi

# 저장소 루트 기준 프론트엔드 디렉토리로 이동 (없으면 건너뜀)
ROOT=$(git -C "$(dirname "$file")" rev-parse --show-toplevel 2>/dev/null)
[[ -z "$ROOT" ]] && exit 0
cd "$ROOT/web/frontend" 2>/dev/null || exit 0

# node_modules 없으면 건너뜀
[[ ! -d "node_modules" ]] && exit 0

result=$(npx tsc --noEmit 2>&1 | tail -10)
if [[ -n "$result" ]]; then
  echo ""
  echo "┌─ [TS Check] $file ─────────────────────────────────────────"
  echo "$result"
  echo "└────────────────────────────────────────────────────────────"
  echo ""
fi
