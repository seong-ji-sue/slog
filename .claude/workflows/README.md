# workflows — 4단계 파이프라인 엔진 (기획→명세→구현→테스트, ECC TDD)

Claude Code **Workflow 툴 DSL**로 작성된 4개 메인 오케스트레이션 + 게이트 툴 + 계약 스키마.

> **설치**: `setup.sh`가 이 디렉터리를 대상 프로젝트 `.claude/workflows/`로 복사한다(Workflow 툴이 `name`으로 찾고, 산출물이 프로젝트 로컬 `.claude/specs/`에 있어야 하므로). **소유는 BOSU(SSOT)** — 사본 수정 금지, BOSU에서 고쳐 재설치. 에이전트·스킬·훅은 BOSU 플러그인이 `bosu:` 프리픽스로 직접 제공.

---

## 워크플로우 — 4단계 + 브라운필드 진입로

| # | 워크플로우 | 역할 | Human Gate |
|---|-----------|------|-----------|
| 1 | `brief-workflow.js` | **기획**: 아이디어/기존 자료 → 표준 기획서(BRIEF: 선제 가정+EARS) → 디자인 토큰(design_system.json) → FACTS(confidence·질문 최대 5) | **Gate 1** — FACTS 질문 승인 |
| 2 | `spec-workflow.js` | **명세**: PRD→PLAN→TC(RED 락) 순차 위임. 단계마다 기계 게이트+LLM judge(spec-lead) 하이브리드. `startAt`으로 단계 독립 실행 | **Gate 2** — 계약·RED 락 승인 |
| 3 | `impl-workflow.js` | **구현(ECRC)**: plan 위상정렬 병렬 구현(Execute, 소유권 배타) → build/lint(Check) → 리뷰 합의 루프(Review, 🔴 0까지 max 3) → 락 드리프트 확인(Complete) | 없음 — 완전 자동 |
| 4 | `test-workflow.js` | **테스트**: E2E 생성 → 실앱 GREEN 실측 → TRIAGE 3분류(BUG/SPEC_MISMATCH/FLAKY) → BUG만 재구현 루프 | 없음 — 완전 자동 |
| — | `baseline-workflow.js` | (브라운필드) 기존 코드 도입: SCAN→FACTS(HG)→PRD 역도출→PLAN→TC(빈 셸 RED 락)→MARK→VERIFY. 상세: `_schema/CONTRACT.md` §8 | FACTS 승인 |

**Human Gate는 2곳뿐** (2-Gate Semi-Autonomous): 기획 승인(Gate 1) · 명세/락 승인(Gate 2). 이후 구현→테스트는 100% 자동 — RED가 GREEN이 되거나 중단 신호(SPEC_MISMATCH·해시 드리프트·human_gate_required)가 나올 때까지 사람이 개입하지 않는다.

## 단계 구성 (각 단계 = [agent+skill+RULES+hook+계약] 단위)

```
[1 기획 brief-workflow]
BRIEF  agent:bosu:brief-writer skill:brief-spec → _data/brief/BRIEF_{f}.md (선제가정+EARS)
DESIGN agent:bosu:designer     (DESIGN_SCHEMA)  → _data/design/design_system.json + DESIGN_{f}.md
FACTS  agent:bosu:facts-writer skill:facts-spec → _data/facts/FACTS_{f}.json (Human Gate 1)

[2 명세 spec-workflow]              ← 진입조건: FACTS approved (하드 게이트)
PRD   agent:bosu:prd-writer  skill:prd-spec  → prd/prd.contract.json + PRD_{f}.md   (+judge)
PLAN  agent:bosu:plan-writer skill:plan-spec → plan/plan.contract.json + PLAN_{f}.md (+judge)
TC    agent:bosu:tc-writer   skill:tc-spec   → tc/tests/*.spec.js(RED) + sheet.xlsx + tc.lock.json

[3 구현 impl-workflow — ECRC]       ← 진입조건: valid RED + tc.lock (하드 게이트)
Execute  bosu:ui_developer/api_developer/db_manager (병렬·소유권 배타·디자인 토큰 준수)
Check    build/lint 루프(max 2)
Review   bosu:code-reviewer ↔ 워커 합의 핑퐁 (critical/major 0까지, max 3)
Complete bosu:impl-lead 인수검수 + 락 해시 드리프트 확인

[4 테스트 test-workflow]
GEN-E2E  bosu:tc-writer → specs/e2e/*.spec.js
VERIFY   red_run.sh real → all_green 실측
TRIAGE   bosu:test-lead → IMPLEMENTATION_BUG(재구현) | SPEC_MISMATCH(중단·역행) | TEST_FLAKY(재검증 1회)
FEEDBACK impl-workflow(focusAcs) 자식 호출 (max 3라운드)
REPORT   TC.md GREEN열·PLAN 완료열·sheet result 실측 갱신
```

결정론(순서·게이트·루프 상한)은 JS 하드코딩 — **"창작=agent, 검증=코드"**. 기계 게이트 FAIL은 어떤 에이전트도 역전 불가.

## 계약 체인 (SSOT: `_schema/CONTRACT.md`)

```
BRIEF §3 EARS [REQ-xx] → prd.contract.json acs[].id → plan.contract.json tasks[].ac_refs → tc spec 테스트 제목
```
- **TC portability**: TC는 `prd.contract.json`만 소비(Plan 미참조) — 떼어 다른 PRD/Plan에 붙여도 동작.
- 스키마: `_schema/BRIEF_SCHEMA.md` · `_schema/DESIGN_SCHEMA.md` · `_schema/prd.contract.schema.json` · `_schema/plan.contract.schema.json`.
- **하이브리드 게이트**: 기계(gate_check.py — 형태)가 1차, LLM judge(spec-lead — 의미 누락·모순)가 2차. judge는 기계 PASS를 역전할 수 없다.

## 기동

```
# 1. 기획 (아이디어만으로 시작)
Workflow(name:"brief-workflow", args:{
  base: "<abs>/.claude/specs", feature: "feed",
  idea: "러프한 아이디어 텍스트",     // 또는 brief: "기존 기획 자료 경로/텍스트"
  startAt: "brief"                   // "brief"|"design"|"facts"
})
# → {user_gate:'AWAITING_USER_APPROVAL', questions} 반환 시 Main이 AskUserQuestion으로 실제로 묻고:
Workflow(name:"brief-workflow", args:{ base, feature, factsAnswers:[...], factsApproved:true, startAt:"facts" })

# 2. 명세 (FACTS 승인 후)
Workflow(name:"spec-workflow", args:{ base, feature, startAt: "prd" })   // "prd"|"plan"|"tc"
# → 완료 반환의 user_gate:'AWAITING_SPEC_APPROVAL' — Main이 계약·RED 락 요약을 보고하고 사용자 승인 후 진행

# 3. 구현 (완전 자동)
Workflow(name:"impl-workflow", args:{ base, feature })                   // 재구현: {focusAcs, focusScreens, hints}

# 4. 테스트 (완전 자동 — 내부에서 impl-workflow 재호출 루프)
Workflow(name:"test-workflow", args:{ base, feature, baseUrl: "http://localhost:3000" })
```

역행 재진입: 반환의 `root_cause_level`이 `brief|facts`면 `brief-workflow(startAt:level, hints)`, `prd|plan|tc`면 `spec-workflow(startAt:level, hints)`.

브라운필드(기존 코드) 기동:

```
Workflow(name:"baseline-workflow", args:{
  base: "<abs>/.claude/specs", feature: "legacy-feed",
  targetDir: "<abs>/apps/web",      // 기존 코드 루트 — startAt scan|facts 에 필수
  baseUrl: "http://localhost:3000", // 구동 앱 — startAt mark|verify 에 필수(VERIFY 도달 시 항상 필요)
  brief: "기존 화면/기능 요약 또는 문서 경로",
  startAt: "scan"                   // "scan"|"facts"|"prd"|"plan"|"tc"|"mark"|"verify" (기본값 scan)
})
```

## 도구 (`_tools/`)

| 도구 | 역할 |
|------|------|
| `gate_check.py {brief\|design\|facts\|prd\|plan\|tc\|e2e} --feature {f}` | 산출물 재파싱 기계 게이트 (자가신고 불신). exit 0=PASS/1=FAIL/2=누락 |
| `red_run.sh [port]` / `red_run.sh real <baseUrl>` | RED(코드 부재 실앱)/GREEN(구현 후 실앱) 실측. real 모드는 `<baseUrl>` 필수 위치 인자. valid RED 시 `tc.lock.json` 생성 |
| `gen_structure_spec.py --feature {f}` | prd.contract → 구조 검증 spec(`_structure.spec.js`) 결정론 생성 |
| `gen_test_sheet.py --feature {f}` | 시나리오 시트 → 실제 `.xlsx`(+csv/md) export. **openpyxl 하드 의존**(`requirements.txt`) — 미설치 시 실패(CSV 폴백 없음, req#4) |
| `spec_retry.py {bump\|reset\|get} --feature {f} --stage {stage}` | 단계별 연속 재게이트 실패 횟수 카운터(feature 스코프 파일) — 3회 초과 시 Human Gate 전환 판단 근거 |
| `shell_app/` | 코드 부재 RED 대상 기본 빈 셸 |

## RED 판정 (ECC valid RED)

`valid_red = total>0 AND PASS=0 AND INFRA=0 AND OTHER_FAIL=0 AND LOGIC_ABSENT=total`.
INFRA(문법·모듈·서버)=무효. LOGIC_ABSENT(계약 key 부재)=유효 RED. **목업 모드 없음** — 실행 대상은 항상 실앱(부재 or 구현).
확정 시 spec sha256 → `tc/tc.lock.json`. 이후 spec 변조 = HUMAN GATE.

## 스택 어댑터 (유일한 스택 종속 지점)

계약(AC-ID·G/W/T·key·label)은 스택 무관. `helpers.js`가 TC 실행 시점에 해석:
- `ui(page, screen_id, key)` → 웹 기본 `getByTestId("{screen_id}-{key}")` — 타 스택은 `resolveLocator`만 교체
- `gotoScreen(page, screen_id)` → 프리셋 환경변수(`PRESET_SPEC_APP_ROUTE_{screen_id의 '-'를 '_'로 치환}`, 예: `A-18` → `PRESET_SPEC_APP_ROUTE_A_18`), 폴백 `/{screen_id}` (계약 `entry`는 사용자 경로 서술 — 라우팅에 쓰지 않음)

## 산출물 (`.claude/specs/`)

```
_data/brief/BRIEF_{feature}.md
_data/design/design_system.json · DESIGN_{feature}.md
_data/facts/FACTS_{feature}.json
prd/PRD_{feature}.md · prd.contract.json
plan/PLAN_{feature}.md · plan.contract.json
tc/TC.md · tests/{screen_id}.spec.js · tests/_structure.spec.js · tests/specs/e2e/*.spec.js
tc/sheet_{feature}.json · sheet_{feature}.xlsx · tc.lock.json · tc.e2e.lock.json
_data/manifests/{stage}.manifest.json · spec_retry_{feature}.json · red_report.json
```
