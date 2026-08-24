#!/usr/bin/env python3
"""gen_structure_spec.py — prd.contract.json에서 구조 검증 spec을 결정론 생성.

창작 없음: 계약에 있는 grid/button/search/field/tab 의 존재·라벨만 검증한다.
화면당 1개 tc/tests/{screen_id}_structure.spec.js (제목 STRUCT-{screen_id}).
modal/badge/link 는 상호작용이라 제외(AC spec 담당).

소비 계약: prd/prd.contract.json.screens[].components (CONTRACT.md §0 — TC portability).
components.json 불사용.

[실측 TRIAGE 재작업 1차] STRUCT-H-01/H-02: 로딩 스켈레톤·에러·empty·정상목록처럼 상호배타 상태의
컴포넌트를 전부 동시 가시로 단언해 실측 SPEC_MISMATCH 발생. behavior 문구에 조건부 표시 마커
("때(만) 표시" / "함께 표시")가 있는 컴포넌트는 blanket "conditional" 로 분류해 개별 단언 대신
"적어도 하나는 표시됨" 완화 단언으로 생성했었다.

[재작업 2차] 1차 완화가 여전히 자기모순이었던 두 사례:
  - STRUCT-H-02: text-title 등 4개 상시 필드를 always로 강제하면서, 동시에 text-not-found
    (식별자 없음 — 이 4개 필드 자체가 렌더되지 않는 완전히 다른 진입 상태) 를 conditional
    blanket에 섞어 "둘 다 만족"을 요구 → 원리적으로 통과 불가.
  - STRUCT-B-06: list-tags/list-graph 처럼 뷰 토글로 하나만 렌더되는 상호배타 그룹을
    "always 전부 동시 가시"로 단언 → 항상 하나는 렌더 안 됨.

이 문제를 화면별 예외 처리가 아니라 behavior 문구 패턴으로 일반화해 분류한다(창작 아님 —
계약 behavior 텍스트에서 결정론 판정). 컴포넌트는 아래 우선순위로 분류된다:

  1) LOADING (스켈레톤 등 "로딩 중 ... 때(만) 표시") → 구조 스모크에서 완전 제외.
     전환 상태이며 실제 검증은 별도 AC(예: throttleNetwork 기반 전용 테스트)가 담당.
  2) NOTFOUND (존재하지 않는 식별자로 접근했을 때만 표시) → 구조 스모크에서 완전 제외.
     기본 진입 경로(gotoScreen 기본 파라미터)에서는 도달하지 않는 대안 라우팅 상태이며,
     실제 검증은 별도 AC가 담당.
  3) VIEW-TOGGLE ("OO 뷰 활성 시 표시" 패턴 — 상호배타 대안 뷰 그룹) → 같은 화면의 tab
     컴포넌트 behavior에서 "기본값은 OO" 를 찾아 매칭되는 기본 뷰 컴포넌트만 가시 단언,
     나머지 대안 뷰는 제외(기본 진입 시 렌더되지 않으므로).
  4) REPLACE ("OO 영역 대신 표시" — 특정 상시 필드를 대체하는 대안 문구) → 참조된 라벨과
     매칭되는 always 컴포넌트를 always 목록에서 빼고, 두 컴포넌트 중 "적어도 하나 가시"로
     완화 단언(항상-표시 강제와 대체-문구 상호배타를 동시에 요구하지 않음).
  5) 그 외 조건부 마커("때(만) 표시" / "함께 표시") → 기존 방식대로 화면 전체 conditional
     묶음에 넣어 "적어도 하나는 표시됨"으로 완화 단언(참조 대상을 특정할 수 없는 경우의 폴백).
  6) 마커 없음 → 상시 렌더 컴포넌트로 개별 단언.

usage: gen_structure_spec.py --feature {area}
"""
import argparse
import json
import os
import re

SPECS = os.environ.get("SPECS_BASE") or (lambda r: os.path.join(r, "specs") if os.path.basename(r) == ".claude" else os.path.join(r, ".claude", "specs"))(
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
)

# 구조 검증 대상 kind (상호작용이 아닌 렌더 존재 검증 가능한 것)
STRUCT_KINDS = {"grid", "button", "search", "field", "tab", "list", "text"}

# behavior 텍스트 분류 마커 — 전부 계약 behavior 문구에서 결정론 판정(창작 아님).
LOADING_RE = re.compile(r"로딩\s*중.*?때만?\s*표시")
NOTFOUND_RE = re.compile(r"존재하지\s*않는.*?(?:접근|식별자).*?때만?\s*표시")
VIEW_ACTIVE_RE = re.compile(r"(.+?)\s*활성\s*시\s*표시")
VIEW_DEFAULT_RE = re.compile(r"기본값은\s*([^;]+)")
REPLACE_REF_RE = re.compile(r"([\w가-힣]+)\s*영역\s*대신")
CONDITIONAL_RE = re.compile(r"때만?\s*.{0,15}표시|함께\s*표시")


def _emit_or_block(lines, sid, keys, var_suffix):
    keys_json = json.dumps(keys, ensure_ascii=False)
    lines.append(f"  const conditionalKeys{var_suffix} = {keys_json};")
    lines.append("  await expect(async () => {")
    lines.append(
        "    const visibleFlags = await Promise.all("
        f"conditionalKeys{var_suffix}.map((k) => ui(page, '{sid}', k).isVisible()));"
    )
    lines.append("    expect(visibleFlags.some(Boolean)).toBe(true);")
    lines.append("  }).toPass();")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--feature", required=True)
    a = ap.parse_args()

    contract_path = os.path.join(SPECS, "prd", "prd.contract.json")
    if not os.path.exists(contract_path):
        raise SystemExit("prd.contract.json 없음 — PRD 단계를 먼저 실행할 것")

    prd = json.load(open(contract_path, encoding="utf-8"))
    screens = prd.get("screens", [])

    out_dir = os.path.join(SPECS, "tc", "tests")
    os.makedirs(out_dir, exist_ok=True)

    lines = [
        "const { test, expect } = require('@playwright/test');",
        "const { gotoScreen, ui } = require('./helpers');",  # helpers.js는 tc/tests/ 동일 디렉터리에 설치됨
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

        always = []
        view_group = []  # (component, view_name)
        replace_group = []  # (component, referenced_label)
        generic_conditional = []

        for c in comps:
            behavior = c.get("behavior", "") or ""
            if LOADING_RE.search(behavior):
                continue  # 전환 상태 — 전용 AC가 담당, 구조 스모크에서 제외
            if NOTFOUND_RE.search(behavior):
                continue  # 대안 라우팅 상태 — 기본 진입에서 도달 안 함, 구조 스모크에서 제외
            m = VIEW_ACTIVE_RE.search(behavior)
            if m:
                view_group.append((c, m.group(1).strip()))
                continue
            m2 = REPLACE_REF_RE.search(behavior)
            if m2:
                replace_group.append((c, m2.group(1).strip()))
                continue
            if CONDITIONAL_RE.search(behavior):
                generic_conditional.append(c)
                continue
            always.append(c)

        # VIEW-TOGGLE 그룹 해소: 같은 화면 tab 컴포넌트의 "기본값은 OO" 로 기본 뷰만 채택
        view_keep = []
        if view_group:
            default_view = None
            for c in comps:
                dm = VIEW_DEFAULT_RE.search(c.get("behavior", "") or "")
                if dm:
                    default_view = dm.group(1).strip()
                    break
            if default_view:
                view_keep = [
                    c for c, view_name in view_group
                    if default_view in view_name or view_name in default_view
                ]
            if not view_keep:
                # 기본값을 특정할 수 없으면 최초 항목을 결정론 선택(재생성 시 동일 결과 보장)
                view_keep = [view_group[0][0]]

        # REPLACE 그룹 해소: 참조 라벨과 매칭되는 always 컴포넌트를 찾아 OR-쌍으로 전환
        or_pairs = []
        for alt_c, ref_label in replace_group:
            base = None
            for c in always:
                label = c.get("label", "") or ""
                if label and (ref_label in label or label in ref_label):
                    base = c
                    break
            if base:
                always.remove(base)
                or_pairs.append((base, alt_c))
            else:
                # 참조 대상을 특정 못하면 안전하게 기존 blanket 완화로 폴백
                generic_conditional.append(alt_c)

        count += 1
        lines.append(f"test('STRUCT-{sid}: 계약 컴포넌트가 렌더링된다', async ({{ page }}) => {{")
        lines.append(f"  await gotoScreen(page, '{sid}');")
        for c in always + view_keep:
            key = c["key"]
            lines.append(f"  await expect(ui(page, '{sid}', '{key}')).toBeVisible();")
            for col in c.get("columns", []) or []:
                lines.append(
                    f"  await expect(page.getByText({json.dumps(col, ensure_ascii=False)}).first()).toBeVisible();"
                )
        for idx, (base, alt) in enumerate(or_pairs):
            _emit_or_block(lines, sid, [base["key"], alt["key"]], f"Replace{idx}")
        if generic_conditional:
            _emit_or_block(lines, sid, [c["key"] for c in generic_conditional], "")
        lines.append("});")
        lines.append("")

    out_path = os.path.join(out_dir, "_structure.spec.js")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print(f"✅ _structure.spec.js 생성: {count} 화면 ({contract_path})")


if __name__ == "__main__":
    main()
