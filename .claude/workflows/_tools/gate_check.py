#!/usr/bin/env python3
"""gate_check.py — PRD/Plan/TC 기계 게이트 (BOSU).

에이전트 자가신고 불신 — 산출물(.claude/specs/)을 직접 재파싱해 판정.
결과는 _data/manifests/{stage}.manifest.json 에 기록.

판정 어휘 (루프백 목적지가 판정에 내장됨):
  APPROVE          exit 0  통과 — 다음 단계 진행
  REVISE_THIS      exit 1  이 단계 산출물 최소 수정 후 재게이트
  (산출물 누락)     exit 2  REVISE_THIS 특수형 — 산출물 자체가 없음
  REVISE_EARLIER   exit 1  상류 문제 — 이 단계 수정으로 못 고침, 상류 단계 재실행
  REVIEW_REQUIRED  exit 3  실패 아님 — 사람 결정 대기 (blocking unknown·tc.lock 해시 드리프트)

상류 변경 감지(stale): 각 게이트는 manifest 에 계약 sha256 을 기록하고,
하류 게이트는 상류 계약의 현재 해시와 대조한다. 불일치 = REVISE_EARLIER.
하류 산출물 자동 재생성 금지 — 감지·보고까지만, 반영은 사람이 결정한다.

usage:
  gate_check.py prd  --feature {feature}
  gate_check.py plan --feature {feature}
  gate_check.py tc   --feature {feature}

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
U_RE = re.compile(r"^U-[0-9]{3}$")
FORBIDDEN = ["waitForTimeout", "test.skip("]


def jread(p):
    with open(p, encoding="utf-8") as f:
        return json.load(f)


def read(p):
    with open(p, encoding="utf-8") as f:
        return f.read()


def sha256_file(p):
    with open(p, "rb") as f:
        return hashlib.sha256(f.read()).hexdigest()


def write_manifest(stage, m):
    os.makedirs(MANIFEST_DIR, exist_ok=True)
    with open(os.path.join(MANIFEST_DIR, f"{stage}.manifest.json"), "w", encoding="utf-8") as f:
        json.dump(m, f, ensure_ascii=False, indent=1)


def emit(stage, fails, earlier=None, reviews=None, extra=None, missing=False):
    """판정 우선순위: 누락(2) > 상류(REVISE_EARLIER) > 이 단계(REVISE_THIS) > 사람 대기(REVIEW_REQUIRED) > 통과."""
    earlier = earlier or []
    reviews = reviews or []
    if missing:
        verdict, code = "REVISE_THIS", 2
    elif earlier:
        verdict, code = "REVISE_EARLIER", 1
    elif fails:
        verdict, code = "REVISE_THIS", 1
    elif reviews:
        verdict, code = "REVIEW_REQUIRED", 3
    else:
        verdict, code = "APPROVE", 0
    m = {
        "stage": stage,
        "pass": code == 0,
        "verdict": verdict,
        "fails": fails,
        "earlier": earlier,
        "reviews": reviews,
    }
    if extra:
        m.update(extra)
    write_manifest(stage, m)
    print(f"── gate {stage}: {verdict}")
    for fl in earlier:
        print(f"   ⇡ {fl}")
    for fl in fails:
        print(f"   ✗ {fl}")
    for fl in reviews:
        print(f"   ☐ {fl}")
    return code


def load_upstream_prd(earlier):
    """하류(plan·tc) 공통 — prd manifest 로드 + stale(계약 sha256) 대조.

    반환: prd ac_ids 집합. 문제는 earlier 리스트에 기록됨.
    """
    contract = os.path.join(SPECS, "prd", "prd.contract.json")
    m_path = os.path.join(MANIFEST_DIR, "prd.manifest.json")
    if not os.path.exists(m_path):
        earlier.append("prd.manifest.json 없음 — gate_prd 미실행 (상류 게이트 먼저)")
        return set()
    try:
        m = jread(m_path)
    except json.JSONDecodeError:
        earlier.append("prd.manifest.json 파싱 오류 — gate_prd 재실행")
        return set()
    if not os.path.exists(contract):
        earlier.append("prd/prd.contract.json 소실 — PRD 단계 재실행")
        return set(m.get("ac_ids", []))
    recorded = m.get("contract_sha256")
    if recorded and recorded != sha256_file(contract):
        earlier.append(
            "상류 PRD 계약 변경 감지(sha256 불일치) — gate_prd 재실행 + 하류 영향 검토. "
            "자동 재생성 금지(표시·보고까지만)"
        )
    if m.get("verdict") not in (None, "APPROVE"):
        earlier.append(f"상류 gate prd 판정이 APPROVE 아님({m.get('verdict')}) — 상류 해소 먼저")
    return set(m.get("ac_ids", []))


# ─────────────────────────── PRD ───────────────────────────
def gate_prd(feature):
    """prd.contract.json 검증 — prd.contract.schema.json 준수.
    screens·acs·impl_requirements·non_goals 필수. AC-ID 포맷. acs[].components key 실재.
    화면당 render AC ≥ 1(표면 완비). unknowns(U-xxx): blocking=true → REVIEW_REQUIRED.
    HTML/목업/phantom 검사 없음.
    """
    fails, reviews = [], []
    contract_path = os.path.join(SPECS, "prd", "prd.contract.json")
    if not os.path.exists(contract_path):
        return emit("prd", ["prd.contract.json 누락"], missing=True)

    try:
        data = jread(contract_path)
    except json.JSONDecodeError as e:
        return emit("prd", [f"prd.contract.json JSON 파싱 오류: {e}"], missing=True)

    # 최상위 필수 필드
    for fld in ("feature", "screens", "acs", "impl_requirements", "non_goals"):
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

    # 화면당 render AC ≥ 1 (표면 완비 — AC 커버리지는 '있는 AC'만 보므로 화면 누락은 여기서 잡는다)
    render_screens = {ac.get("screen_id") for ac in acs if ac.get("layer") == "render"}
    for sid in screen_component_keys:
        if sid not in render_screens:
            fails.append(f"screen {sid}: render AC 없음 (화면당 render ≥1)")

    # impl_requirements 검증: frontend 필수
    if isinstance(impl, dict):
        if not impl.get("frontend"):
            fails.append("impl_requirements.frontend 누락/비어있음")
    else:
        fails.append("impl_requirements 형식 오류 (object 필요)")

    # non_goals 검증: 비어있지 않은 문자열 배열 (§6 비목표 — 스코프 경계의 기계화)
    non_goals = data.get("non_goals")
    if non_goals is not None and not (
        isinstance(non_goals, list)
        and all(isinstance(x, str) and x.strip() for x in non_goals)
    ):
        fails.append("non_goals 형식 오류 (문자열 배열 필요)")

    # unknowns(U-xxx 원장) 검증 — 근거 없으면 지어내지 말고 남긴다
    for u in data.get("unknowns") or []:
        uid = u.get("id", "")
        if not U_RE.match(uid):
            fails.append(f"unknown id 포맷 오류: '{uid}' (기대: U-NNN)")
        for fld in ("unknown", "impact"):
            if not u.get(fld):
                fails.append(f"unknown {uid}: 필수 필드 '{fld}' 누락")
        if "blocking" not in u:
            fails.append(f"unknown {uid}: 'blocking'(bool) 누락")
        elif u["blocking"]:
            reviews.append(
                f"blocking unknown {uid}: {u.get('unknown', '')} — "
                f"결정 필요: {u.get('required_decision', '(미기재)')}"
            )

    ac_ids_sorted = sorted(set(ac_ids))
    return emit(
        "prd", fails, reviews=reviews,
        extra={"ac_ids": ac_ids_sorted, "contract_sha256": sha256_file(contract_path)},
    )


# ─────────────────────────── PLAN ───────────────────────────
def gate_plan(feature):
    """plan.contract.json 검증 — 고아 AC(prd manifest ac_ids − task ac_refs) FAIL.
    상류 stale(prd 계약 sha256 대조) = REVISE_EARLIER.
    """
    fails, earlier = [], []
    plan_path = os.path.join(SPECS, "plan", "plan.contract.json")
    if not os.path.exists(plan_path):
        return emit("plan", ["plan.contract.json 누락"], missing=True)

    try:
        data = jread(plan_path)
    except json.JSONDecodeError as e:
        return emit("plan", [f"plan.contract.json JSON 파싱 오류: {e}"], missing=True)

    tasks = data.get("tasks", [])
    if not tasks:
        fails.append("tasks 비어있음")

    # 상류 prd manifest 로드 + stale 대조
    prd_acs = load_upstream_prd(earlier)

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

    return emit(
        "plan", fails, earlier=earlier,
        extra={"ac_ids": sorted(covered_ac), "contract_sha256": sha256_file(plan_path)},
    )


# ─────────────────────────── TC ───────────────────────────
def gate_tc(feature):
    """TC 검증.
    - spec 제목=AC-ID 커버 (prd ac_ids − spec_acs = 0)
    - ghost 셀렉터 (계약 외 key)
    - valid RED (red_report.json.valid_red)
    - tc.lock.json 해시 드리프트 = REVIEW_REQUIRED (HUMAN GATE — 사후 검출.
      사전 차단은 hooks/scripts/tc_lock_guard.py)
    - 상류 stale(prd 계약 sha256 대조) = REVISE_EARLIER
    mock 정합(red_report_mock) 검사 없음.
    """
    fails, earlier, reviews = [], [], []

    # prd.contract.json에서 계약 key 집합 구성
    contract_path = os.path.join(SPECS, "prd", "prd.contract.json")
    contract_keys = set()  # (screen_id, key)
    if not os.path.exists(contract_path):
        earlier.append("prd/prd.contract.json 없음 — PRD 단계 먼저")
    else:
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

    # 상류 prd manifest 로드 + stale 대조
    prd_acs = load_upstream_prd(earlier)

    # spec 파일 탐색
    spec_glob = os.path.join(SPECS, "tc", "tests", "**", "*.spec.js")
    specs = sorted(glob.glob(spec_glob, recursive=True))
    if not specs:
        return emit("tc", ["spec 파일 0건"], earlier=earlier, missing=True)

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

    # valid RED
    rr_path = os.path.join(MANIFEST_DIR, "red_report.json")
    if not os.path.exists(rr_path) or not jread(rr_path).get("valid_red"):
        fails.append("valid RED 미확인 (red_report.json.valid_red = false 또는 파일 없음)")
    else:
        # tc.lock.json 해시 드리프트 — 실패가 아니라 사람 결정 대기 (HUMAN GATE)
        lock_path = os.path.join(SPECS, "tc", "tc.lock.json")
        if not os.path.exists(lock_path):
            fails.append("tc.lock.json 부재 (valid RED 확정인데 락 없음)")
        else:
            drift = hash_drift(lock_path)
            if drift:
                reviews.append(
                    f"해시 드리프트 {len(drift)}건 — HUMAN GATE"
                    f"(승인: red_run.sh 재실행으로 재-RED + tc.lock.json 갱신 / 반려: spec 원복): {drift[:3]}"
                )

    return emit("tc", fails, earlier=earlier, reviews=reviews)


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
        description="gate_check.py {prd|plan|tc} --feature {feature}"
    )
    ap.add_argument("stage", choices=["prd", "plan", "tc"])
    ap.add_argument("--feature", required=True, help="기능/업무영역 식별자")
    a = ap.parse_args()

    fn = {"prd": gate_prd, "plan": gate_plan, "tc": gate_tc}[a.stage]
    result = fn(a.feature)
    sys.exit(result)


if __name__ == "__main__":
    main()
