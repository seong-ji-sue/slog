#!/bin/bash
# red_run.sh — TC RED/GREEN 실측 러너 (ECC TDD, CONTRACT.md §5).
#
# usage:
#   ./red_run.sh [port]           # RED: 코드 부재 실앱 대상 (기본 port=8931)
#   ./red_run.sh real <baseUrl>   # GREEN: 구동 중인 실앱 대상
#
# RED 원칙 (CONTRACT.md §5):
#   - 목업 없음. RED는 코드 부재 실앱(또는 빈 셸) 단일 실행.
#   - valid RED = 컴파일·실행되고 미구현으로 실패 (LOGIC_ABSENT).
#   - 문법오류·설정깨짐(INFRA)은 valid RED 아님.
#
# 산출: _data/manifests/red_report.json (RED) / red_report_real.json (real)
#       valid RED 확정 시 tc/tc.lock.json 자동 생성.
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE="${SPECS_BASE:-$(cd "$SCRIPT_DIR/../../.claude/specs" 2>/dev/null && pwd || echo "$SCRIPT_DIR/../../.claude/specs")}"
TESTS_DIR="$BASE/tc/tests"

[ -d "$TESTS_DIR/node_modules/@playwright" ] || {
  echo "ERROR: playwright 미설치 — (cd $TESTS_DIR && npm install) 먼저 실행" >&2; exit 2; }

MODE="${1:-}"
SRV_PID=""

if [ "$MODE" = "real" ]; then
  RUN_BASE_URL="${2:?real 모드는 baseUrl 필요: ./red_run.sh real http://host:port}"
else
  # RED 모드: 빈 셸 앱 또는 APP_DOCROOT 지정 대상으로 실측
  PORT="${MODE:-8931}"
  DOCROOT="${APP_DOCROOT:-$SCRIPT_DIR/shell_app}"
  [ -d "$DOCROOT" ] || {
    echo "ERROR: 대상 없음: $DOCROOT (APP_DOCROOT 환경변수로 지정하거나 shell_app 생성)" >&2; exit 2; }
  python3 -m http.server "$PORT" --bind 127.0.0.1 --directory "$DOCROOT" >/dev/null 2>&1 &
  SRV_PID=$!
  trap 'kill $SRV_PID 2>/dev/null' EXIT
  for _ in $(seq 1 20); do
    curl -sf "http://127.0.0.1:$PORT/" >/dev/null 2>&1 && break
    sleep 0.2
  done
  RUN_BASE_URL="http://127.0.0.1:$PORT"
  MODE="app"
fi

( cd "$TESTS_DIR" && TC_TARGET="$MODE" BASE_URL="$RUN_BASE_URL" npx playwright test )
PW_EXIT=$?

python3 - "$BASE" "$MODE" "$PW_EXIT" <<'PYEOF'
import json, os, re, sys, glob, hashlib

base, mode, pw_exit = sys.argv[1], sys.argv[2], int(sys.argv[3])
rpt_path = os.path.join(base, "_data/manifests/playwright_report.json")
if not os.path.exists(rpt_path):
    print(json.dumps({"valid_red": False, "error": "playwright_report.json 없음"}, ensure_ascii=False))
    sys.exit(3)

rpt = json.load(open(rpt_path, encoding="utf-8"))

# INFRA 판정: 문법·설정·서버연결·모듈 오류 (이 경우 valid RED 아님)
INFRA = re.compile(
    r"ECONNREFUSED|net::ERR|browserType\.launch|Cannot find module"
    r"|SyntaxError|ReferenceError|ENOENT"
)

tests = []

def walk(suite, fh=""):
    f = suite.get("file", fh)
    for spec in suite.get("specs", []):
        for t in spec.get("tests", []):
            res = (t.get("results") or [{}])[-1]
            st = res.get("status", "unknown")
            msg = ""
            for e in (res.get("errors") or ([res.get("error")] if res.get("error") else [])):
                if e and e.get("message"):
                    msg += e["message"][:300] + " "
            if st == "passed":
                cls = "PASS"
            elif INFRA.search(msg):
                cls = "INFRA"
            elif (
                "Timed out" in msg
                or "toBeVisible" in msg
                or "expect(" in msg
                or "strict mode" in msg
                or st == "timedOut"
            ):
                # 계약 key 부재(locator timeout) = 미구현으로 실패 = valid RED 후보
                cls = "LOGIC_ABSENT"
            elif st == "failed":
                cls = "OTHER_FAIL"
            else:
                cls = st.upper()
            tests.append({
                "file": os.path.basename(spec.get("file", f) or f),
                "title": spec.get("title", ""),
                "status": st,
                "class": cls,
                "reason": msg.strip()[:220],
            })
    for s in suite.get("suites", []):
        walk(s, f)

for s in rpt.get("suites", []):
    walk(s)

n = len(tests)
cnt = {}
for t in tests:
    cnt[t["class"]] = cnt.get(t["class"], 0) + 1

passed = cnt.get("PASS", 0)
logic  = cnt.get("LOGIC_ABSENT", 0)
infra  = cnt.get("INFRA", 0)
other  = n - passed - logic - infra

report = {
    "mode": mode,
    "total": n,
    "passed": passed,
    "logic_absent_fail": logic,
    "infra_fail": infra,
    "other_fail": other,
    "summary": f"total={n} pass={passed} logic_absent={logic} infra={infra} other={other}",
    "tests": tests,
}

os.makedirs(os.path.join(base, "_data/manifests"), exist_ok=True)

if mode == "app":
    # valid RED: 전건 LOGIC_ABSENT (컴파일·실행 O, 미구현 실패 O, INFRA 0)
    valid = (n > 0 and passed == 0 and infra == 0 and other == 0 and logic == n)
    report["valid_red"] = valid
    out = os.path.join(base, "_data/manifests/red_report.json")
    json.dump(report, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"\n── RED 실측: {report['summary']}")
    if valid:
        # tc.lock.json 생성 (tc.lock.json 이름 — 구 test_lock.json 대체)
        lock = {
            "unlock_condition": "구현 GREEN + 리드 승인 (락 이후 spec 수정 = HUMAN GATE)",
            "red_report": "_data/manifests/red_report.json",
            "files": [],
        }
        spec_glob = os.path.join(base, "tc/tests/**/*.spec.js")
        for sf in sorted(glob.glob(spec_glob, recursive=True)):
            digest = hashlib.sha256(open(sf, "rb").read()).hexdigest()
            acs = sorted(set(re.findall(
                r"AC-[A-Z][A-Z0-9]*(?:-[0-9]+)*-[0-9]{2}\b",
                open(sf, encoding="utf-8").read()
            )))
            lock["files"].append({
                "path": os.path.relpath(sf, base),
                "sha256": digest,
                "ac_refs": acs,
            })
        lock_path = os.path.join(base, "tc/tc.lock.json")
        json.dump(lock, open(lock_path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
        print(f"✅ 유효 RED 확정 ({n}건 전부 LOGIC_ABSENT) — tc.lock.json 락({len(lock['files'])}파일)")
        sys.exit(0)
    else:
        print("❌ 유효 RED 아님 — PASS/INFRA/OTHER 존재. red_report.json 확인")
        sys.exit(1)

elif mode == "real":
    report["all_green"] = (n > 0 and passed == n)
    report["green_ratio"] = f"{passed}/{n}"
    report["failing"] = [t["title"] for t in tests if t["class"] != "PASS"]
    out = os.path.join(base, "_data/manifests/red_report_real.json")
    json.dump(report, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"\n── REAL 실측: {report['summary']}")
    if report["all_green"]:
        print("✅ 전체 GREEN")
        sys.exit(0)
    else:
        print(f"❌ 미통과 {len(report['failing'])}건: {report['failing'][:8]}")
        sys.exit(1)

else:
    print(f"ERROR: 알 수 없는 mode '{mode}'", file=sys.stderr)
    sys.exit(2)
PYEOF
