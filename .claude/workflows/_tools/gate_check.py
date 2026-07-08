#!/usr/bin/env python3
"""gate_check.py — PRD/Plan/TC 기계 게이트 (BOSU).

에이전트 자가신고 불신 — 산출물(.claude/specs/)을 직접 재파싱해 PASS/FAIL 판정.
exit 0=PASS, 1=FAIL, 2=산출물 누락. 결과는 _data/manifests/{stage}.manifest.json 에 기록.

usage:
  gate_check.py facts --feature {feature}
  gate_check.py prd   --feature {feature}
  gate_check.py plan  --feature {feature}
  gate_check.py tc    --feature {feature}
  gate_check.py e2e   --feature {feature}

계약 모델: prd.contract.json (CONTRACT.md). 스택 어댑터는 helpers.js 가 TC 실행 시점에 해석.
"""
import argparse
import glob
import hashlib
import json
import os
import re
import sys

SPECS = os.environ.get("SPECS_BASE") or os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", ".claude", "specs")
)
MANIFEST_DIR = os.path.join(SPECS, "_data", "manifests")

AC_RE = re.compile(r"^AC-[A-Z][A-Z0-9]*(?:-[0-9]+)*-[0-9]{2}$")
AC_SCAN = re.compile(r"AC-[A-Z][A-Z0-9]*(?:-[0-9]+)*-[0-9]{2}\b")
FORBIDDEN = ["waitForTimeout", "test.skip("]


def jread(p):
    with open(p, encoding="utf-8") as f:
        return json.load(f)


def read(p):
    with open(p, encoding="utf-8") as f:
        return f.read()


def write_manifest(stage, m):
    os.makedirs(MANIFEST_DIR, exist_ok=True)
    with open(os.path.join(MANIFEST_DIR, f"{stage}.manifest.json"), "w", encoding="utf-8") as f:
        json.dump(m, f, ensure_ascii=False, indent=1)


def emit(stage, ok, fails, extra=None):
    m = {"stage": stage, "pass": ok, "fails": fails}
    if extra:
        m.update(extra)
    write_manifest(stage, m)
    tag = "PASS" if ok else "FAIL"
    print(f"── gate {stage}: {tag}")
    for fl in fails:
        print(f"   ✗ {fl}")
    return 0 if ok else 1


# ─────────────────────────── FACTS ───────────────────────────
def gate_facts(feature):
    """FACTS_{feature}.json 검증 — Human Gate 산식 재계산 + 승인 무결성.
    - human_gate_required 값이 산식(overall<0.75 OR screen<0.70 OR blocking 존재) 재계산과 일치
    - blocking issue 전부 questions[].source_issue 로 참조됨 (고아 0)
    - approved:true 면 questions[] 전부 answer 존재
    """
    fails = []
    facts_path = os.path.join(SPECS, "_data", "facts", f"FACTS_{feature}.json")
    if not os.path.exists(facts_path):
        emit("facts", False, ["FACTS_{feature}.json 누락"])
        return 2

    try:
        data = jread(facts_path)
    except json.JSONDecodeError as e:
        emit("facts", False, [f"FACTS_{feature}.json JSON 파싱 오류: {e}"])
        return 2

    for fld in ("feature", "screens", "overall_confidence", "human_gate_required", "questions", "approved"):
        if fld not in data:
            fails.append(f"최상위 필수 필드 '{fld}' 누락")

    screens = data.get("screens", [])
    if not screens:
        fails.append("screens 비어있음")

    blocking_ids = set()
    for s in screens:
        ref = s.get("screen_ref", "?")
        if not (0.5 <= float(s.get("confidence", 0)) <= 1.0):
            fails.append(f"screen {ref}: confidence 범위(0.5~1.0) 위반")
        for i in s.get("issues", []):
            if i.get("severity") == "blocking":
                blocking_ids.add(i.get("id"))

    questions = data.get("questions", [])
    referenced = {q.get("source_issue") for q in questions if q.get("source_issue")}
    orphan_blocking = blocking_ids - referenced
    if orphan_blocking:
        fails.append(f"고아 blocking issue {len(orphan_blocking)}건(질문 미연결): {sorted(orphan_blocking)[:5]}")

    overall = data.get("overall_confidence", 0)
    expect_gate = (
        overall < 0.75
        or any(s.get("confidence", 1.0) < 0.70 for s in screens)
        or bool(blocking_ids)
    )
    if bool(data.get("human_gate_required")) != expect_gate:
        fails.append(f"human_gate_required 산식 불일치 (재계산={expect_gate}, 기록={data.get('human_gate_required')})")

    if data.get("approved"):
        unanswered = [q for q in questions if not q.get("answer")]
        if unanswered:
            fails.append(f"approved:true 인데 미답변 질문 {len(unanswered)}건")

    return emit("facts", not fails, fails)


# ─────────────────────────── PRD ───────────────────────────
def gate_prd(feature):
    """prd.contract.json 검증 — prd.contract.schema.json 준수.
    screens·acs·impl_requirements 필수. AC-ID 포맷. acs[].components key 실재.
    HTML/목업/phantom 검사 없음.
    """
    fails = []
    contract_path = os.path.join(SPECS, "prd", "prd.contract.json")
    if not os.path.exists(contract_path):
        emit("prd", False, ["prd.contract.json 누락"])
        return 2

    try:
        data = jread(contract_path)
    except json.JSONDecodeError as e:
        emit("prd", False, [f"prd.contract.json JSON 파싱 오류: {e}"])
        return 2

    # 최상위 필수 필드
    for fld in ("feature", "screens", "acs", "impl_requirements"):
        if not data.get(fld):
            fails.append(f"최상위 필수 필드 '{fld}' 누락/비어있음")

    screens = data.get("screens", [])
    acs = data.get("acs", [])
    impl = data.get("impl_requirements", {})

    # screens 검증: screen_id·title·components 필수
    screen_component_keys = {}  # screen_id → set(key)
    for s in screens:
        sid = s.get("screen_id")
        if not sid:
            fails.append("screen.screen_id 누락")
            continue
        if not s.get("title"):
            fails.append(f"screen {sid}: title 누락")
        comps = s.get("components", [])
        if not comps:
            fails.append(f"screen {sid}: components 비어있음")
        keys = set()
        for c in comps:
            key = c.get("key")
            if not key:
                fails.append(f"screen {sid}: component key 누락")
                continue
            if not c.get("kind"):
                fails.append(f"screen {sid} component {key}: kind 누락")
            if not c.get("label"):
                fails.append(f"screen {sid} component {key}: label 누락")
            keys.add(key)
        screen_component_keys[sid] = keys

    # acs 검증: id·screen_id·layer·given·when·then 필수 + AC-ID 포맷 + components key 실재
    ac_ids = []
    for ac in acs:
        ac_id = ac.get("id", "")
        if not AC_RE.match(ac_id):
            fails.append(f"AC id 포맷 오류: '{ac_id}' (기대: AC-[A-Z][A-Z0-9]*-NN)")
        else:
            ac_ids.append(ac_id)

        sid = ac.get("screen_id")
        if not sid:
            fails.append(f"AC {ac_id}: screen_id 누락")
        for fld in ("layer", "given", "when", "then"):
            if not ac.get(fld):
                fails.append(f"AC {ac_id}: 필수 필드 '{fld}' 누락")

        # acs[].components key → 해당 screen의 components에 실재하는지
        ref_keys = ac.get("components", [])
        if sid and sid in screen_component_keys:
            for rk in ref_keys:
                if rk not in screen_component_keys[sid]:
                    fails.append(f"AC {ac_id}: components 참조 key '{rk}' → screen {sid}에 미존재")

    if not ac_ids:
        fails.append("AC 0건")

    # impl_requirements 검증: frontend 필수
    if isinstance(impl, dict):
        if not impl.get("frontend"):
            fails.append("impl_requirements.frontend 누락/비어있음")
    else:
        fails.append("impl_requirements 형식 오류 (object 필요)")

    ac_ids_sorted = sorted(set(ac_ids))
    return emit("prd", not fails, fails, {"ac_ids": ac_ids_sorted})


# ─────────────────────────── PLAN ───────────────────────────
def gate_plan(feature):
    """plan.contract.json 검증 — 고아 AC(prd manifest ac_ids − task ac_refs) FAIL."""
    fails = []
    plan_path = os.path.join(SPECS, "plan", "plan.contract.json")
    if not os.path.exists(plan_path):
        emit("plan", False, ["plan.contract.json 누락"])
        return 2

    try:
        data = jread(plan_path)
    except json.JSONDecodeError as e:
        emit("plan", False, [f"plan.contract.json JSON 파싱 오류: {e}"])
        return 2

    tasks = data.get("tasks", [])
    if not tasks:
        fails.append("tasks 비어있음")

    # prd manifest에서 ac_ids 로드
    prd_m_path = os.path.join(MANIFEST_DIR, "prd.manifest.json")
    prd_acs = set(jread(prd_m_path).get("ac_ids", [])) if os.path.exists(prd_m_path) else set()

    task_ids = {t.get("task_id") for t in tasks}
    covered_ac = set()

    for t in tasks:
        tid = t.get("task_id", "?")
        for fld in ("task_id", "ac_refs", "steps", "success_criteria"):
            if not t.get(fld):
                fails.append(f"{tid}: 필수 필드 '{fld}' 공백/누락")
        for r in t.get("ac_refs", []):
            if not r.startswith("BE-"):
                covered_ac.add(r)
        for d in t.get("depends_on", []):
            if d not in task_ids:
                fails.append(f"{tid}: broken depends_on '{d}'")

    if prd_acs:
        orphan = prd_acs - covered_ac
        if orphan:
            fails.append(f"고아 AC {len(orphan)}건: {sorted(orphan)[:5]}")

    return emit("plan", not fails, fails, {"ac_ids": sorted(covered_ac)})


# ─────────────────────────── TC ───────────────────────────
def gate_tc(feature):
    """TC 검증.
    - spec 제목=AC-ID 커버 (prd ac_ids − spec_acs = 0)
    - ghost 셀렉터 (계약 외 key)
    - valid RED (red_report.json.valid_red)
    - tc.lock.json 해시 드리프트
    mock 정합(red_report_mock) 검사 없음.
    """
    fails = []

    # prd.contract.json에서 계약 key 집합 구성
    contract_path = os.path.join(SPECS, "prd", "prd.contract.json")
    contract_keys = set()  # (screen_id, key)
    if os.path.exists(contract_path):
        try:
            prd = jread(contract_path)
            for s in prd.get("screens", []):
                sid = s.get("screen_id", "")
                for c in s.get("components", []):
                    key = c.get("key")
                    if key:
                        contract_keys.add((sid, key))
        except json.JSONDecodeError:
            fails.append("prd.contract.json JSON 파싱 오류 — ghost 검사 불가")

    # prd manifest에서 ac_ids 로드
    prd_m_path = os.path.join(MANIFEST_DIR, "prd.manifest.json")
    prd_acs = set(jread(prd_m_path).get("ac_ids", [])) if os.path.exists(prd_m_path) else set()

    # AC 유닛 spec만 대상 — 비재귀(하위 specs/e2e/ 는 gate_e2e 소관, _structure.spec.js 는 구조검증 소관)
    spec_glob = os.path.join(SPECS, "tc", "tests", "*.spec.js")
    specs = [s for s in sorted(glob.glob(spec_glob)) if os.path.basename(s) != "_structure.spec.js"]
    if not specs:
        emit("tc", False, ["spec 파일 0건"])
        return 2

    spec_acs = set()
    ui_re = re.compile(r"ui\(\s*page\s*,\s*['\"]([^'\"]+)['\"]\s*,\s*['\"]([^'\"]+)['\"]")
    ghost = 0

    for sp in specs:
        src = read(sp)
        bname = os.path.basename(sp)

        # 금지 패턴
        for pat in FORBIDDEN:
            if pat in src:
                fails.append(f"{bname}: 금지패턴 '{pat}'")

        # expect 단언 필수
        if "expect(" not in src:
            fails.append(f"{bname}: expect 단언 없음")

        # 제목 = AC-ID
        for m in re.finditer(r"test\(\s*['\"]([^'\"]+)['\"]", src):
            title = m.group(1)
            ac_match = AC_SCAN.match(title)
            if ac_match:
                spec_acs.add(ac_match.group(0))
            else:
                fails.append(f"{bname}: 제목이 AC-ID 형식이 아님 — '{title[:50]}'")

        # ghost 셀렉터 (계약 외 key)
        if contract_keys:
            for sid, key in ui_re.findall(src):
                if (sid, key) not in contract_keys:
                    ghost += 1

    if ghost:
        fails.append(f"ghost 셀렉터 {ghost}건 (계약 외 key 사용)")

    # AC 커버리지
    if prd_acs:
        miss = prd_acs - spec_acs
        if miss:
            fails.append(f"AC 미커버 {len(miss)}건: {sorted(miss)[:5]}")

    # 구조검증 spec 위생 (있으면만 — AC-ID 타이틀 요구 제외, 최소 위생만)
    struct_path = os.path.join(SPECS, "tc", "tests", "_structure.spec.js")
    if os.path.exists(struct_path):
        struct_src = read(struct_path)
        for pat in FORBIDDEN:
            if pat in struct_src:
                fails.append(f"_structure.spec.js: 금지패턴 '{pat}'")
        if "expect(" not in struct_src:
            fails.append("_structure.spec.js: expect 단언 없음")

    # 시나리오 시트 + 실제 엑셀 산출 (req#4 — TC 완료의 필수 산출물)
    sheet_path = os.path.join(SPECS, "tc", f"sheet_{feature}.json")
    xlsx_path = os.path.join(SPECS, "tc", f"sheet_{feature}.xlsx")
    if not os.path.exists(sheet_path):
        fails.append(f"sheet_{feature}.json 없음 — TC 단계 시나리오 시트 필수")
    else:
        try:
            sheet_rows = jread(sheet_path).get("rows", [])
        except json.JSONDecodeError:
            sheet_rows = []
            fails.append("sheet json 파싱 오류")
        covered = {a for r in sheet_rows for a in (r.get("ac_refs") or [])}
        if prd_acs:
            uncovered = prd_acs - covered
            if uncovered:
                fails.append(f"시나리오 시트 AC 미커버 {len(uncovered)}건: {sorted(uncovered)[:5]}")
    if not os.path.exists(xlsx_path):
        fails.append(f"sheet_{feature}.xlsx 없음 — 실제 엑셀 산출 필수(gen_test_sheet.py 실행)")

    # valid RED
    rr_path = os.path.join(MANIFEST_DIR, "red_report.json")
    if not os.path.exists(rr_path) or not jread(rr_path).get("valid_red"):
        fails.append("valid RED 미확인 (red_report.json.valid_red = false 또는 파일 없음)")
    else:
        # tc.lock.json 해시 드리프트
        lock_path = os.path.join(SPECS, "tc", "tc.lock.json")
        if not os.path.exists(lock_path):
            fails.append("tc.lock.json 부재 (valid RED 확정인데 락 없음)")
        else:
            drift = hash_drift(lock_path)
            if drift:
                fails.append(f"해시 드리프트 {len(drift)}건 (HUMAN GATE): {drift[:3]}")

    return emit("tc", not fails, fails)


# ─────────────────────────── E2E ───────────────────────────
def gate_e2e(feature):
    """tc/tests/specs/e2e/*.spec.js 검증.
    - 제목 SC-{feature}-{NNN} 형식 · 금지패턴 0 · expect 필수 · ghost 셀렉터 0
    - sheet_{feature}.json e2e=true 행 ↔ spec 양방향 커버리지
    - tc.e2e.lock.json 해시 드리프트(최초 PASS 시 자동 생성)
    """
    fails = []
    e2e_dir = os.path.join(SPECS, "tc", "tests", "specs", "e2e")
    specs = sorted(glob.glob(os.path.join(e2e_dir, "*.spec.js")))

    # 시트에 e2e 행이 0건이면 E2E spec이 없는 것이 정상 — PASS
    sheet_path = os.path.join(SPECS, "tc", f"sheet_{feature}.json")
    sheet_e2e_ids = None
    if os.path.exists(sheet_path):
        try:
            sheet_e2e_ids = {
                r.get("scenario_id")
                for r in jread(sheet_path).get("rows", [])
                if r.get("e2e")
            }
        except json.JSONDecodeError:
            fails.append("sheet json 파싱 오류")

    if not specs:
        if sheet_e2e_ids is not None and not sheet_e2e_ids and not fails:
            return emit("e2e", True, [], {"note": "시트 e2e 행 0건 — E2E spec 불필요"})
        emit("e2e", False, fails + ["e2e spec 0건 (tc/tests/specs/e2e/*.spec.js)"])
        return 2

    contract_keys = set()
    contract_path = os.path.join(SPECS, "prd", "prd.contract.json")
    if os.path.exists(contract_path):
        try:
            for s in jread(contract_path).get("screens", []):
                for c in s.get("components", []):
                    if c.get("key"):
                        contract_keys.add((s.get("screen_id", ""), c["key"]))
        except json.JSONDecodeError:
            fails.append("prd.contract.json JSON 파싱 오류 — ghost 검사 불가")

    sc_re = re.compile(rf"^SC-{re.escape(feature)}-[0-9]{{3}}\b")
    ui_re = re.compile(r"ui\(\s*page\s*,\s*['\"]([^'\"]+)['\"]\s*,\s*['\"]([^'\"]+)['\"]")
    found_ids, ghost = set(), 0

    for sp in specs:
        src, bname = read(sp), os.path.basename(sp)
        for pat in FORBIDDEN:
            if pat in src:
                fails.append(f"{bname}: 금지패턴 '{pat}'")
        if "expect(" not in src:
            fails.append(f"{bname}: expect 단언 없음")
        for m in re.finditer(r"test\(\s*['\"]([^'\"]+)['\"]", src):
            title = m.group(1)
            sm = sc_re.match(title)
            if sm:
                found_ids.add(sm.group(0))
            else:
                fails.append(f"{bname}: 제목이 SC-{feature}-NNN 형식이 아님 — '{title[:50]}'")
        if contract_keys:
            for sid, key in ui_re.findall(src):
                if (sid, key) not in contract_keys:
                    ghost += 1
    if ghost:
        fails.append(f"ghost 셀렉터 {ghost}건 (E2E spec)")

    if sheet_e2e_ids is None:
        fails.append(f"sheet_{feature}.json 없음 — e2e 행 대조 불가")
    else:
        if sheet_e2e_ids - found_ids:
            fails.append(f"sheet e2e 행 중 spec 없음 {len(sheet_e2e_ids - found_ids)}건: {sorted(sheet_e2e_ids - found_ids)[:5]}")
        if found_ids - sheet_e2e_ids:
            fails.append(f"sheet에 없는 e2e spec {len(found_ids - sheet_e2e_ids)}건: {sorted(found_ids - sheet_e2e_ids)[:5]}")

    lock_path = os.path.join(SPECS, "tc", "tc.e2e.lock.json")
    if not fails:
        if os.path.exists(lock_path):
            drift = hash_drift(lock_path)
            if drift:
                fails.append(f"E2E 해시 드리프트 {len(drift)}건 (HUMAN GATE): {drift[:3]}")
        if not fails:
            lock = {
                "unlock_condition": "E2E 재확정 필요 시만 수정(락 이후 변조=HUMAN GATE)",
                "files": [
                    {"path": os.path.relpath(sf, SPECS), "sha256": hashlib.sha256(open(sf, "rb").read()).hexdigest()}
                    for sf in specs
                ],
            }
            with open(lock_path, "w", encoding="utf-8") as f:
                json.dump(lock, f, ensure_ascii=False, indent=1)

    return emit("e2e", not fails, fails)


def hash_drift(lock_path):
    drift = []
    for e in jread(lock_path).get("files", []):
        fp = os.path.join(SPECS, e["path"])
        if not os.path.exists(fp):
            drift.append(e["path"] + " (소실)")
            continue
        with open(fp, "rb") as fh:
            if hashlib.sha256(fh.read()).hexdigest() != e["sha256"]:
                drift.append(e["path"])
    return drift


# ─────────────────────────── main ───────────────────────────
def main():
    ap = argparse.ArgumentParser(
        description="gate_check.py {facts|prd|plan|tc|e2e} --feature {feature}"
    )
    ap.add_argument("stage", choices=["facts", "prd", "plan", "tc", "e2e"])
    ap.add_argument("--feature", required=True, help="기능/업무영역 식별자")
    a = ap.parse_args()

    fn = {"facts": gate_facts, "prd": gate_prd, "plan": gate_plan, "tc": gate_tc, "e2e": gate_e2e}[a.stage]
    result = fn(a.feature)
    sys.exit(result)


if __name__ == "__main__":
    main()
