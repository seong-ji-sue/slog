#!/bin/bash
# Claude hook script — NOT a runtime script. Installs git hooks from .claude/scripts/git_hooks/ into .git/hooks/.
# Auto-detects main .git/ location and applies to all worktrees.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GIT_COMMON_DIR=$(git rev-parse --git-common-dir 2>/dev/null)

if [[ -z "$GIT_COMMON_DIR" ]]; then
  echo "❌ git 저장소 외부에서 실행됨" >&2
  exit 1
fi

# 절대 경로 변환
case "$GIT_COMMON_DIR" in
  /*) ;;  # 이미 절대
  *) GIT_COMMON_DIR="$PWD/$GIT_COMMON_DIR" ;;
esac

HOOKS_DIR="$GIT_COMMON_DIR/hooks"
mkdir -p "$HOOKS_DIR"

# 설치
cp "$SCRIPT_DIR/git_hooks/pre-commit"    "$HOOKS_DIR/pre-commit"
cp "$SCRIPT_DIR/git_hooks/post-checkout" "$HOOKS_DIR/post-checkout"
cp "$SCRIPT_DIR/git_hooks/pre-push"      "$HOOKS_DIR/pre-push"
chmod +x "$HOOKS_DIR/pre-commit"
chmod +x "$HOOKS_DIR/post-checkout"
chmod +x "$HOOKS_DIR/pre-push"

# 메인 저장소 디렉토리 이름 (정책 안내용)
MAIN_DIR_NAME=$(basename "$(git rev-parse --show-toplevel 2>/dev/null)")
[[ -z "$MAIN_DIR_NAME" ]] && MAIN_DIR_NAME="<project>"

echo "✅ Git hooks 설치 완료"
echo "   pre-commit:    $HOOKS_DIR/pre-commit"
echo "   post-checkout: $HOOKS_DIR/post-checkout"
echo "   pre-push:      $HOOKS_DIR/pre-push"
echo ""
echo "정책:"
echo "  - 메인 디렉토리($MAIN_DIR_NAME/)에서 feature/fix/refactor/chore/docs 커밋 reject"
echo "  - feature/* 등 브랜치는 $MAIN_DIR_NAME-<주제>/ worktree에서만 커밋 허용"
echo "  - develop/master/main push: 사용자 승인 토큰(.git/PUSH_APPROVED) 필수"
echo ""
echo "develop push 절차:"
echo "  1. Main Claude가 사용자에게 승인 요청"
echo "  2. 사용자 '승인' 응답"
echo "  3. Main Claude: touch \$(git rev-parse --git-common-dir)/PUSH_APPROVED"
echo "  4. git push origin develop"
echo ""
echo "재설치: 본 스크립트 다시 실행"
echo "수동 우회 금지: --no-verify 사용 금지 (git_convention.md 절대 규칙)"
