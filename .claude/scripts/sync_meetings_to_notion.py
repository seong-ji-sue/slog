#!/usr/bin/env python3
"""
docs/meetings/*.md → Notion 데이터베이스 자동 동기화 (BOSU)

- 중복 방지: Notion DB 에 같은 제목 페이지가 있으면 스킵
- 실행: python3 .claude/scripts/sync_meetings_to_notion.py [특정파일.md]
       (인자 없으면 회의록 디렉토리 전체 스캔)

필수 env (.env 또는 .env.local, 실제 환경변수 우선):
    NOTION_API_KEY          Notion 통합 토큰 (https://www.notion.so/my-integrations)
    NOTION_MEETINGS_DB_ID   회의록을 쌓을 데이터베이스 ID

선택 env (기본값은 키트 회의록 템플릿 기준):
    MEETINGS_DIR            회의록 디렉토리 (기본: docs/meetings)
    NOTION_PROP_TITLE       제목 속성명     (기본: 이름)
    NOTION_PROP_DATE        날짜 속성명     (기본: 날짜)
    NOTION_PROP_TAGS        태그 속성명     (기본: 태그)
    NOTION_MEETING_TAG      태그 값         (기본: 회의록)

회의록 형식: .claude/template/meeting_template.md 와 동일한 한글 섹션 헤더
(영문 헤더도 병행 인식: Background / Key Discussions / Technical Decisions 등)
"""
import json
import os
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path

# 스크립트 위치(.claude/scripts/) 기준 프로젝트 루트
_root = Path(__file__).resolve().parent.parent.parent


def _load_env(fp: Path):
    """단순 KEY=VALUE 파서 — 이미 설정된 환경변수는 건드리지 않음.
    `export KEY=...` 접두와 양끝 따옴표 1쌍을 허용."""
    if not fp.exists():
        return
    for line in fp.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line.startswith("export "):
            line = line[7:].lstrip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            v = v.strip()
            if len(v) >= 2 and v[0] == v[-1] and v[0] in ('"', "'"):
                v = v[1:-1]
            os.environ.setdefault(k.strip(), v)


# 우선순위: 실제 환경변수 > .env.local > .env
_load_env(_root / ".env.local")
_load_env(_root / ".env")

TOKEN = os.getenv("NOTION_API_KEY", "")
DB_ID = os.getenv("NOTION_MEETINGS_DB_ID", "")
MEETINGS = _root / os.getenv("MEETINGS_DIR", "docs/meetings")
PROP_TITLE = os.getenv("NOTION_PROP_TITLE", "이름")
PROP_DATE = os.getenv("NOTION_PROP_DATE", "날짜")
PROP_TAGS = os.getenv("NOTION_PROP_TAGS", "태그")
MEETING_TAG = os.getenv("NOTION_MEETING_TAG", "회의록")


def api(method, path, body=None):
    # urllib 사용 — 토큰이 자식 프로세스 인자(argv)로 노출되지 않음 (curl -H 방식 금지)
    req = urllib.request.Request(
        f"https://api.notion.com/v1{path}",
        data=json.dumps(body, ensure_ascii=False).encode("utf-8") if body else None,
        method=method,
        headers={
            "Authorization": f"Bearer {TOKEN}",
            "Notion-Version": "2022-06-28",
            "Content-Type": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        try:
            return json.loads(e.read().decode("utf-8"))
        except (json.JSONDecodeError, ValueError):
            return {"object": "error", "message": f"HTTP {e.code}"}
    except Exception as e:  # 네트워크 단절 등 — 호출부가 메시지로 처리
        return {"object": "error", "message": str(e)[:200]}


# ── 기존 제목 목록 조회 (중복 방지) ──────────────────
def fetch_existing_titles():
    resp = api("POST", f"/databases/{DB_ID}/query", {"page_size": 100})
    titles = set()
    for page in resp.get("results", []):
        t = page.get("properties", {}).get(PROP_TITLE, {}).get("title", [])
        if t:
            titles.add(t[0]["plain_text"].strip())
    return titles


# ── 블록 헬퍼 ─────────────────────────────────────────
def rt(text, bold=False):
    return [{"type": "text", "text": {"content": str(text)[:2000]},
             "annotations": {"bold": bold}}]


def callout(text, emoji, color):
    return {"type": "callout", "callout": {"rich_text": rt(text),
            "icon": {"type": "emoji", "emoji": emoji}, "color": color}}


def h2(text):
    return {"type": "heading_2", "heading_2": {"rich_text": rt(text, bold=True)}}


def toggle(title, children):
    return {"type": "toggle", "toggle": {"rich_text": rt(title, bold=True),
            "children": children or [p("—")]}}


def quote(speaker, content):
    return {"type": "quote", "quote": {"rich_text":
            rt(speaker, bold=True) + [{"type": "text", "text": {"content": f"  {content}"}}]}}


def todo(text, checked=False):
    return {"type": "to_do", "to_do": {"rich_text": rt(text), "checked": checked}}


def divider():
    return {"type": "divider", "divider": {}}


def p(text):
    return {"type": "paragraph", "paragraph": {"rich_text": rt(text)}}


def notion_table(rows):
    def cell(t):
        return [{"type": "text", "text": {"content": str(t)[:300]}}]
    trows = [{"type": "table_row", "table_row":
              {"cells": [cell("결정 항목"), cell("선택"), cell("이유")]}}]
    for r in rows:
        trows.append({"type": "table_row", "table_row":
                      {"cells": [cell(r[0]), cell(r[1]), cell(r[2])]}})
    return {"type": "table", "table": {"table_width": 3, "has_column_header": True,
            "has_row_header": False, "children": trows}}


# ── 파싱 ──────────────────────────────────────────────
def parse(fp: Path) -> dict:
    text = fp.read_text(encoding="utf-8")

    def find(pat):
        m = re.search(pat, text, re.M)
        return m.group(1).strip() if m else ""

    def section(*names):
        for name in names:
            m = re.search(rf'## {re.escape(name)}\n([\s\S]+?)(?=\n##|\Z)', text)
            if m:
                return m.group(1).strip()
        return ""

    raw = find(r'^# (.+)')
    title = re.sub(r'^(회의록|Meeting Note)\s*[—\-]+\s*', '', raw).strip()

    date_m = re.search(
        r'(?:\*\*일시\*\*|\*\*Date/Time\*\*)[：:]\s*(\d{4}-\d{2}-\d{2})(?:\s+(\S+))?', text
    )

    discussions = []
    for line in section('주요 논의', 'Key Discussions').splitlines():
        m = re.match(r'>\s*\*{0,2}(.+?)\*{0,2}:\s*(.+)', line.strip())
        if m:
            discussions.append((m.group(1).strip(), m.group(2).strip()))

    decisions = []
    for r in re.findall(r'\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|',
                        section('기술 결정', 'Technical Decisions')):
        if any(re.fullmatch(r'[-\s]+', c) for c in r):
            continue
        if r[0] in ('결정 항목', '항목', 'Decision Item', 'Item'):
            continue
        decisions.append(r)

    # 섹션 구분선(---)이 항목으로 잡히지 않도록 대시·공백뿐인 매치는 제외
    def real_items(items):
        return [x for x in items if not re.fullmatch(r'[-\s]*', x)]

    done = real_items(re.findall(r'-\s*✅?\s*(.+)', section('완료 사항', 'Completed Items')))
    actions = real_items(re.findall(r'-\s*\[.\]\s*(.+)', section('다음 액션', 'Next Actions')))
    memos = real_items([l.strip().lstrip('-').strip()
                        for l in section('메모', 'Notes', '미결/보류').splitlines()
                        if l.strip().startswith('-')])

    return {
        "title": title,
        "date": date_m.group(1) if date_m else fp.stem[:10],
        "time": (date_m.group(2) or "") if date_m else "",
        "unit": find(r'(?:\*\*작업 단위\*\*|\*\*Task unit\*\*)[：:]\s*(.+)'),
        "attend": find(r'(?:\*\*참석\*\*|\*\*Attendees\*\*)[：:]\s*(.+)'),
        "author": find(r'(?:\*\*작성\*\*|\*\*Author\*\*)[：:]\s*(.+)'),
        "bg": section('배경', 'Background'),
        "discussions": discussions,
        "decisions": decisions,
        "done": done,
        "actions": actions,
        "memos": memos,
    }


# ── 블록 조립 ─────────────────────────────────────────
def make_blocks(d: dict) -> list:
    B = []

    # 메타 callout
    meta = f"📅 {d['date']}"
    if d['time']:
        meta += f" {d['time']}"
    if d['attend']:
        meta += f"   |   👥 {d['attend']}"
    if d['author']:
        meta += f"   |   ✍️ {d['author']}"
    B.append(callout(meta, "📋", "blue_background"))
    if d['unit']:
        B.append(callout(d['unit'], "🎯", "yellow_background"))

    B.append(divider())

    # 배경 (토글)
    if d['bg']:
        bg_lines = [p(l.strip()) for l in d['bg'].splitlines() if l.strip()]
        B.append(toggle("배경", bg_lines))

    # 주요 논의
    if d['discussions']:
        B.append(h2("주요 논의"))
        for speaker, content in d['discussions']:
            B.append(quote(speaker, content))

    # 기술 결정 (테이블)
    if d['decisions']:
        B.append(h2("기술 결정"))
        B.append(notion_table(d['decisions']))

    B.append(divider())

    # 완료 사항
    if d['done']:
        B.append(h2("✅  완료 사항"))
        for item in d['done']:
            B.append(todo(item.lstrip('✅ ').strip(), checked=True))

    # 다음 액션
    if d['actions']:
        B.append(h2("📋  다음 액션"))
        for item in d['actions']:
            B.append(todo(item, checked=False))

    # 메모
    if d['memos']:
        B.append(divider())
        B.append(h2("메모"))
        for m in d['memos']:
            is_security = any(k in m for k in ["보안", "API", "attack", "시크릿", "무결성", "구멍"])
            B.append(callout(m, "🔐" if is_security else "💬",
                             "orange_background" if is_security else "gray_background"))

    return B[:100]  # Notion children 한도


# ── 페이지 생성 ───────────────────────────────────────
def create_page(d: dict):
    resp = api("POST", "/pages", {
        "parent": {"database_id": DB_ID},
        "properties": {
            PROP_TITLE: {"title": rt(d["title"])},
            PROP_DATE: {"date": {"start": d["date"]}},
            PROP_TAGS: {"multi_select": [{"name": MEETING_TAG}]},
        },
        "children": make_blocks(d),
    })
    return resp.get("object") == "page", resp.get("url", resp.get("message", ""))


# ── 메인 ──────────────────────────────────────────────
def main():
    if not TOKEN:
        print("ERROR: NOTION_API_KEY 가 설정되지 않음 (.env 확인)")
        sys.exit(1)
    if not DB_ID:
        print("ERROR: NOTION_MEETINGS_DB_ID 가 설정되지 않음 (.env 확인)")
        sys.exit(1)
    # 특정 파일 인자가 있으면 그것만, 없으면 전체 스캔
    target = Path(sys.argv[1]) if len(sys.argv) > 1 else None
    files = [target] if target and target.exists() else sorted(MEETINGS.glob("*.md"))

    existing = fetch_existing_titles()

    for md in files:
        if md.name == "README.md":
            continue
        d = parse(md)
        if not d["title"]:
            print(f"⏭  스킵 (제목 없음): {md.name}")
            continue
        if d["title"] in existing:
            print(f"⏭  스킵 (이미 등록됨): {d['title']}")
            continue
        ok, url = create_page(d)
        print(f"{'✅' if ok else '❌'} [{d['date']}] {d['title']}")
        if url:
            print(f"   {url}")


if __name__ == "__main__":
    main()
