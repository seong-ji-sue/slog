#!/usr/bin/env python3
"""gen_structure_spec.py — prd.contract.json에서 구조 검증 spec을 결정론 생성.

창작 없음: 계약에 있는 grid/button/search/field/tab 의 존재·라벨만 검증한다.
화면당 1개 tc/tests/{screen_id}_structure.spec.js (제목 STRUCT-{screen_id}).
modal/badge/link 는 상호작용이라 제외(AC spec 담당).

소비 계약: prd/prd.contract.json.screens[].components (CONTRACT.md §0 — TC portability).
components.json 불사용.

usage: gen_structure_spec.py --feature {area}
"""
import argparse
import json
import os

SPECS = os.environ.get("SPECS_BASE") or os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", ".claude", "specs")
)

# 구조 검증 대상 kind (상호작용이 아닌 렌더 존재 검증 가능한 것)
STRUCT_KINDS = {"grid", "button", "search", "field", "tab", "list", "text"}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--feature", required=True)
    a = ap.parse_args()

    contract_path = os.path.join(SPECS, "prd", "prd.contract.json")
    # modify/testcase 폴백: tc/spec/contract_*.json
    if not os.path.exists(contract_path):
        spec_dir = os.path.join(SPECS, "tc", "spec")
        if os.path.isdir(spec_dir):
            for fname in sorted(os.listdir(spec_dir)):
                if fname.startswith("contract_") and fname.endswith(".json"):
                    contract_path = os.path.join(spec_dir, fname)
                    break
    if not os.path.exists(contract_path):
        raise SystemExit("prd.contract.json 없음 (tc/spec/contract_*.json 폴백도 없음)")

    prd = json.load(open(contract_path, encoding="utf-8"))
    screens = prd.get("screens", [])

    out_dir = os.path.join(SPECS, "tc", "tests")
    os.makedirs(out_dir, exist_ok=True)

    lines = [
        "const { test, expect } = require('@playwright/test');",
        "const { gotoScreen, ui } = require('../helpers');",
        "",
    ]
    count = 0
    for s in screens:
        sid = s.get("screen_id")
        if not sid:
            continue
        comps = [c for c in s.get("components", []) if c.get("kind") in STRUCT_KINDS and c.get("key")]
        if not comps:
            continue
        count += 1
        lines.append(f"test('STRUCT-{sid}: 계약 컴포넌트가 렌더링된다', async ({{ page }}) => {{")
        lines.append(f"  await gotoScreen(page, '{sid}');")
        for c in comps:
            key = c["key"]
            lines.append(f"  await expect(ui(page, '{sid}', '{key}')).toBeVisible();")
            for col in c.get("columns", []) or []:
                lines.append(
                    f"  await expect(page.getByText({json.dumps(col, ensure_ascii=False)}).first()).toBeVisible();"
                )
        lines.append("});")
        lines.append("")

    out_path = os.path.join(out_dir, "_structure.spec.js")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print(f"✅ _structure.spec.js 생성: {count} 화면 ({contract_path})")


if __name__ == "__main__":
    main()
