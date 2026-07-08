#!/bin/bash
# secret_scan.sh — 블로그 초안 마스킹 스캔
# 사용: bash secret_scan.sh <파일경로>
# exit 0 = CLEAN, exit 1 = 위반 발견

set -u

FILE="$1"

if [ ! -f "$FILE" ]; then
  echo "ERROR: 파일이 존재하지 않음 — $FILE" >&2
  exit 1
fi

FOUND=0

check() {
  local label="$1"
  local pattern="$2"
  local matches
  matches=$(grep -nE "$pattern" "$FILE" 2>/dev/null)
  if [ -n "$matches" ]; then
    echo "[WARN] $label"
    echo "$matches"
    echo ""
    FOUND=1
  fi
}

# 이메일 주소
check "이메일 주소" "[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}"

# AWS Access Key
check "AWS Access Key (AKIA...)" "AKIA[0-9A-Z]{16}"

# OpenAI API Key
check "OpenAI API Key (sk-...)" "sk-[a-zA-Z0-9]{20,}"

# GitHub Personal Access Token
check "GitHub PAT (ghp_...)" "ghp_[a-zA-Z0-9]{36}"

# Slack token
check "Slack token (xox...)" "xox[baprs]-[0-9A-Za-z\-]+"

# 일반 API 키 패턴 (변수에 할당된 형태)
check "API Key 할당" "(api[_\-]?key|apikey|access[_\-]?token)[[:space:]]*=[[:space:]]*['\"][^'\"]{8,}['\"]"

# 사내 도메인 (*.internal / *.corp / *.local)
check "사내 내부 도메인 (*.internal/*.corp/*.local)" "[a-zA-Z0-9\-]+\.(internal|corp|local)(:[0-9]+)?(/[^\s]*)?"

# IP 주소 (전대역 경고)
check "IP 주소" "\b([0-9]{1,3}\.){3}[0-9]{1,3}\b"

# .env 류 시크릿 변수
check ".env 시크릿 변수 (PASSWORD=, SECRET=, TOKEN= 등)" "(PASSWORD|SECRET|TOKEN|PRIVATE_KEY|DB_PASS|DB_PASSWORD)[[:space:]]*=[[:space:]]*[^[:space:]]+"

# 한글 인명 패턴 — role 호칭 뒤 한글 성+이름 (예: 부장님 김철수)
check "role 호칭 뒤 한글 실명" "(부장님|대리님|과장님|팀장님|차장님|이사님|사장님|대표님|선임|주임)[[:space:]]*[가-힣]{2,4}[[:space:]]"

if [ "$FOUND" -eq 0 ]; then
  echo "CLEAN"
  exit 0
else
  echo "---"
  echo "위 항목을 마스킹한 뒤 재실행하세요."
  exit 1
fi
