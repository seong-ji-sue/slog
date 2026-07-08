#!/usr/bin/env python3
"""gen_test_sheet.py — 시나리오 시트(sheet_{feature}.json)를 사람용 실제 .xlsx(+csv/md)로 export.

시트 자체는 tc-writer 에이전트가 작성(전수 시나리오). 본 도구는 export + 무결성 요약만(창작 없음, 정본 값 재배열).
실제 .xlsx가 TC 단계 완료 필수 산출물(req#4)이므로 openpyxl 미설치 시 CSV 폴백 없이 즉시 실패한다.

소비: tc/sheet_{feature}.json.

usage: gen_test_sheet.py --feature {feature}
"""
import argparse
import csv
import json
import os
import sys

SPECS = os.environ.get("SPECS_BASE") or (lambda r: os.path.join(r, "specs") if os.path.basename(r) == ".claude" else os.path.join(r, ".claude", "specs"))(
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
)
COLS = ["scenario_id", "screen_id", "no", "feature_fn", "test_item", "method_steps", "expected", "ac_refs", "e2e", "result"]
HEADERS_KO = {
    "scenario_id": "시나리오ID", "screen_id": "화면", "no": "No",
    "feature_fn": "기능", "test_item": "테스트 항목", "method_steps": "수행 절차",
    "expected": "기대 결과", "ac_refs": "AC", "e2e": "E2E", "result": "결과",
}
WRAP_COLS = {"test_item", "method_steps", "expected"}
COL_WIDTHS = {
    "scenario_id": 16, "screen_id": 10, "no": 6, "feature_fn": 16,
    "test_item": 28, "method_steps": 36, "expected": 32, "ac_refs": 18, "e2e": 8, "result": 10,
}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--feature", required=True)
    a = ap.parse_args()

    sp = os.path.join(SPECS, "tc", f"sheet_{a.feature}.json")
    if not os.path.exists(sp):
        print(json.dumps({"ok": False, "error": f"sheet_{a.feature}.json 없음"}, ensure_ascii=False))
        raise SystemExit(1)

    rows = json.load(open(sp, encoding="utf-8")).get("rows", [])
    if not rows:
        print(json.dumps({"ok": False, "error": f"sheet_{a.feature}.json rows 비어있음"}, ensure_ascii=False))
        raise SystemExit(1)

    # CSV (부산물 — 프로그램적 diff/미리보기용)
    csv_p = os.path.join(SPECS, "tc", f"sheet_{a.feature}.csv")
    with open(csv_p, "w", newline="", encoding="utf-8-sig") as f:
        w = csv.writer(f)
        w.writerow(COLS)
        for r in rows:
            w.writerow([_cell(r.get(c)) for c in COLS])

    # MD (부산물)
    md_p = os.path.join(SPECS, "tc", f"sheet_{a.feature}.md")
    with open(md_p, "w", encoding="utf-8") as f:
        f.write(f"# 테스트 시나리오 시트 — {a.feature}\n\n")
        f.write("| " + " | ".join(COLS) + " |\n")
        f.write("|" + "|".join(["---"] * len(COLS)) + "|\n")
        for r in rows:
            f.write("| " + " | ".join(_cell(r.get(c)) for c in COLS) + " |\n")

    # XLSX (필수 산출물 — req#4: 실제 엑셀 없이 TC 완료 아님)
    try:
        xlsx_p = build_xlsx(rows, os.path.join(SPECS, "tc", f"sheet_{a.feature}.xlsx"))
    except ImportError:
        print(json.dumps({
            "ok": False,
            "error": "openpyxl 미설치 — pip install -r workflows/_tools/requirements.txt 필요. "
                     "TC 단계는 실제 .xlsx 산출이 필수 요구사항이라 CSV 폴백 없음.",
        }, ensure_ascii=False))
        raise SystemExit(1)

    e2e = sum(1 for r in rows if r.get("e2e"))
    print(json.dumps({
        "ok": True, "xlsx": os.path.basename(xlsx_p), "rows": len(rows), "e2e": e2e,
    }, ensure_ascii=False))


def build_xlsx(rows, out_path):
    from openpyxl import Workbook, load_workbook
    from openpyxl.styles import Alignment, Border, Font, PatternFill, Side

    wb = Workbook()
    ws = wb.active
    ws.title = "시나리오"

    header_fill = PatternFill(start_color="FF2F5496", end_color="FF2F5496", fill_type="solid")
    header_font = Font(bold=True, color="FFFFFFFF")
    thin = Side(style="thin", color="FFB7B7B7")
    border = Border(left=thin, right=thin, top=thin, bottom=thin)
    wrap = Alignment(wrap_text=True, vertical="top")
    center = Alignment(horizontal="center", vertical="center")

    ws.append([HEADERS_KO[c] for c in COLS])
    for cell in ws[1]:
        cell.fill = header_fill
        cell.font = header_font
        cell.border = border
        cell.alignment = center

    for r in rows:
        ws.append([_cell(r.get(c)) for c in COLS])

    for ridx in range(2, len(rows) + 2):
        for cidx, col in enumerate(COLS, start=1):
            cell = ws.cell(row=ridx, column=cidx)
            cell.border = border
            cell.alignment = wrap if col in WRAP_COLS else center

    # screen_id 컬럼 연속 동일값 구간 세로 병합
    sid_col = COLS.index("screen_id") + 1
    last_row = len(rows) + 1  # 데이터 마지막 행(헤더=1행)
    run_start = 2
    for ridx in range(3, last_row + 1):
        prev_val = ws.cell(row=ridx - 1, column=sid_col).value
        cur_val = ws.cell(row=ridx, column=sid_col).value
        if cur_val != prev_val:
            if ridx - 1 > run_start:
                ws.merge_cells(start_row=run_start, start_column=sid_col, end_row=ridx - 1, end_column=sid_col)
            run_start = ridx
    if last_row > run_start:
        ws.merge_cells(start_row=run_start, start_column=sid_col, end_row=last_row, end_column=sid_col)

    for cidx, col in enumerate(COLS, start=1):
        ws.column_dimensions[ws.cell(row=1, column=cidx).column_letter].width = COL_WIDTHS.get(col, 16)
    ws.freeze_panes = "A2"

    wb.save(out_path)

    # 재오픈 검증 — 산출물이 실제로 읽히고 행수가 일치하는지 확인(자가신고 불신)
    check = load_workbook(out_path)
    check_ws = check.active
    if check_ws.max_row != len(rows) + 1:
        raise AssertionError(f"xlsx 재오픈 검증 실패: 기대 {len(rows) + 1}행, 실제 {check_ws.max_row}행")

    return out_path


def _cell(v):
    if isinstance(v, list):
        return ", ".join(str(x) for x in v)
    return "" if v is None else str(v)


if __name__ == "__main__":
    main()
