#!/bin/bash
# Claude hook script — NOT a runtime script. Runs automatically via PostToolUse(Edit|Write) hook.
# Purpose: .claude/ index consistency check when curator modifies files.

input=$(cat)

# 수정된 파일 경로 추출
file=$(python3 -c "
import json, sys
try:
    d = json.load(sys.stdin)
    fp = d.get('file_path') or d.get('new_file_path') or ''
    print(fp)
except:
    print('')
" <<< "$input" 2>/dev/null)

# .claude/ 변경이 아니면 즉시 종료
[[ "$file" != *"/.claude/"* ]] && exit 0

# 저장소 루트 기준 .claude 경로 산출 (git 밖이면 경로 문자열에서 추출)
ROOT=$(git -C "$(dirname "$file")" rev-parse --show-toplevel 2>/dev/null)
if [[ -n "$ROOT" && -d "$ROOT/.claude" ]]; then
  BASE="$ROOT/.claude"
else
  BASE="${file%%/.claude/*}/.claude"
fi
WARNS=()

# 특정 디렉토리의 실제 .md 파일 vs README.md 등록 여부 검사
check_dir() {
  local dir="$1"
  local readme="$BASE/$dir/README.md"
  [[ ! -f "$readme" ]] && return
  for f in "$BASE/$dir"/*.md; do
    [[ ! -f "$f" ]] && continue
    fname=$(basename "$f")
    [[ "$fname" == "README.md" ]] && continue
    if ! grep -qF "$fname" "$readme" 2>/dev/null; then
      WARNS+=("  ⚠ $dir/$fname → README.md 미등록")
    fi
  done
}

check_dir "agents"
check_dir "workflow"
check_dir "rules"
check_dir "template"

# skills 는 subdirectory 구조 — skill.md 파일명으로 확인
skills_readme="$BASE/skills/README.md"
if [[ -f "$skills_readme" ]]; then
  for d in "$BASE/skills"/*/; do
    sname=$(basename "$d")
    [[ "$sname" == "README.md" ]] && continue
    if ! grep -qF "$sname" "$skills_readme" 2>/dev/null; then
      WARNS+=("  ⚠ skills/$sname → README.md 미등록")
    fi
  done
fi

if [ ${#WARNS[@]} -gt 0 ]; then
  echo ""
  echo "┌─ [큐레이터 싱크 알림] 인덱스 불일치 감지 ─────────────────"
  for w in "${WARNS[@]}"; do echo "$w"; done
  echo "└─ claude_curator 동기화 권장 ──────────────────────────────"
  echo ""
fi

# ── 회의록 중복 감지 ────────────────────────────────────────────
# meetings/ 에 새 .md 파일이 생성될 때 유사 파일 존재 여부 경고
if [[ "$file" == *"/meetings/"* ]] && [[ "$file" == *.md ]]; then
  fname=$(basename "$file" .md)
  [[ "$fname" == "README" ]] && exit 0

  # 새 파일의 날짜·슬러그 추출 (형식: YYYY-MM-DD_HHMM_슬러그)
  new_slug=$(echo "$fname" | cut -d_ -f3-)          # Phase1_초기세팅 등
  meeting_dir=$(dirname "$file")

  similar=()
  for existing in "$meeting_dir"/*.md; do
    [[ ! -f "$existing" ]] && continue
    efname=$(basename "$existing" .md)
    [[ "$efname" == "README" ]] && continue
    [[ "$efname" == "$fname" ]] && continue          # 자기 자신 제외

    eslug=$(echo "$efname" | cut -d_ -f3-)

    # 슬러그 첫 단어가 같으면 유사로 판단 (같은 Phase·기능·주제)
    new_first=$(echo "$new_slug" | cut -d_ -f1)
    e_first=$(echo "$eslug" | cut -d_ -f1)
    if [[ "$new_first" == "$e_first" && ${#new_first} -gt 2 ]]; then
      similar+=("  ⚠ 유사 파일: $efname")
    fi
  done

  if [ ${#similar[@]} -gt 0 ]; then
    echo ""
    echo "┌─ [회의록 중복 경고] 신규 파일: $fname ─────────────────"
    for s in "${similar[@]}"; do echo "$s"; done
    echo "│  → 연속 작업이라면 기존 파일 갱신 권장 (meeting_log.md 참조)"
    echo "└────────────────────────────────────────────────────────"
    echo ""
  fi
fi
