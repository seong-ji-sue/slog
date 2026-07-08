#!/usr/bin/env python3
"""
Claude hook script — NOT a runtime script. PostToolUse(Edit|Write) 훅으로 자동 실행됨.
회의록(docs/meetings/*.md, README 제외) 저장 시 sync_meetings_to_notion.py 를 호출.

- 회의록 외 경로는 즉시 종료 (레이턴시 최소화)
- 어떤 실패도 Claude 대화 흐름을 막지 않음 (항상 exit 0)
- 회의록 디렉토리는 MEETINGS_DIR 환경변수로 오버라이드 가능 (기본: docs/meetings)
"""
import json
import os
import subprocess
import sys
from pathlib import Path


def main():
    try:
        data = json.load(sys.stdin)
    except (json.JSONDecodeError, ValueError):
        return

    # Claude Code 훅 입력: tool_input.file_path (구버전 호환: 최상위 file_path)
    tool_input = data.get("tool_input") or {}
    fp = tool_input.get("file_path") or data.get("file_path") or ""
    if not fp.endswith(".md"):
        return

    path = Path(fp)
    if path.name == "README.md":
        return

    meetings_dir = os.getenv("MEETINGS_DIR", "docs/meetings")
    norm = str(fp).replace(os.sep, "/")
    if os.path.isabs(meetings_dir):
        # 절대경로 오버라이드: 디렉토리 prefix 일치로 판정
        base = meetings_dir.replace(os.sep, "/").rstrip("/") + "/"
        if not norm.startswith(base):
            return
    else:
        md = meetings_dir.strip("/")
        if f"/{md}/" not in norm and not norm.startswith(f"{md}/"):
            return

    root = Path(__file__).resolve().parent.parent.parent
    sync = Path(__file__).resolve().parent / "sync_meetings_to_notion.py"
    if not sync.exists() or not path.exists():
        return

    proc = subprocess.run(
        [sys.executable, str(sync), str(path)],
        capture_output=True, text=True, cwd=str(root), timeout=60,
    )
    out = (proc.stdout or proc.stderr or "").strip()
    if out:
        print(out)


if __name__ == "__main__":
    try:
        main()
    except Exception:
        pass  # 훅 실패가 Claude 를 막으면 안 됨
    sys.exit(0)
