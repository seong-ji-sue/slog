#!/usr/bin/env python3
"""gen_test_sheet.py — 시나리오 시트(sheet_{area}.json)를 사람용 md/csv 로 export.

시트 자체는 tc-writer 에이전트가 작성(전수 시나리오). 본 도구는 export + 무결성 요약만.
csv 는 엑셀에서 바로 열림(xlsx 라이브러리 의존 회피).

소비: tc/sheet_{area}.json (mock 의존 없음).

usage: gen_test_sheet.py --feature {area}
"""
import argparse
import csv
import json
import os

SPECS = os.environ.get("SPECS_BASE") or os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", ".claude", "specs")
)
COLS = ["scenario_id", "screen_id", "no", "feature_fn", "test_item", "expected", "ac_refs", "e2e", "result"]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--feature", required=True)
    a = ap.parse_args()

    sp = os.path.join(SPECS, "tc", f"sheet_{a.feature}.json")
    if not os.path.exists(sp):
        raise SystemExit(f"sheet_{a.feature}.json 없음")

    rows = json.load(open(sp, encoding="utf-8")).get("rows", [])

    # CSV
    csv_p = os.path.join(SPECS, "tc", f"sheet_{a.feature}.csv")
    with open(csv_p, "w", newline="", encoding="utf-8-sig") as f:
        w = csv.writer(f)
        w.writerow(COLS)
        for r in rows:
            w.writerow([_cell(r.get(c)) for c in COLS])

    # MD
    md_p = os.path.join(SPECS, "tc", f"sheet_{a.feature}.md")
    with open(md_p, "w", encoding="utf-8") as f:
        f.write(f"# 테스트 시나리오 시트 — {a.feature}\n\n")
        f.write("| " + " | ".join(COLS) + " |\n")
        f.write("|" + "|".join(["---"] * len(COLS)) + "|\n")
        for r in rows:
            f.write("| " + " | ".join(_cell(r.get(c)) for c in COLS) + " |\n")

    e2e = sum(1 for r in rows if r.get("e2e"))
    print(f"✅ export: {len(rows)}행 (E2E {e2e}) → {os.path.basename(csv_p)}, {os.path.basename(md_p)}")


def _cell(v):
    if isinstance(v, list):
        return ", ".join(str(x) for x in v)
    return "" if v is None else str(v)


if __name__ == "__main__":
    main()
