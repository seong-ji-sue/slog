# CONTRACT — 파이프라인 단계 간 계약 (기획 → 명세 → 구현 → 테스트)

> **이 문서가 이 시스템에서 제일 중요하다 (SSOT).**
> 방법론은 **ECC TDD** — 테스트를 코드보다 먼저 쓰고, **코드가 전무한 상태에서 valid RED**를 확정한 뒤, 구현이 그 테스트를 GREEN으로 만든다.
> 목업(HTML)·구현물은 **명세 단계 어디서도 만들지 않는다.** BRIEF/FACTS/PRD/Plan/TC는 전부 **명세**다.

---

## 0. 파이프라인 (4개 메인 워크플로우 · Human Gate 2곳)

```
[1 기획  brief-workflow]  아이디어/기존 자료
  → [BRIEF 단계]  agent:brief-writer · skill:brief-spec → BRIEF_{feature}.md (선제 가정 + EARS)
  → [DESIGN 단계] agent:designer     · DESIGN_SCHEMA    → design_system.json + DESIGN_{feature}.md
  → [FACTS 단계]  agent:facts-writer · skill:facts-spec → FACTS_{feature}.json  🛑 Human Gate 1

[2 명세  spec-workflow]   ← 진입조건: FACTS approved (하드 게이트)
  → [PRD 단계]  agent:prd-writer  · skill:prd-spec   → PRD.md  + prd.contract.json  (기계 게이트+judge)
  → [PLAN 단계] agent:plan-writer · skill:plan-spec  → PLAN.md + plan.contract.json (기계 게이트+judge)
  → [TC 단계]   agent:tc-writer   · skill:tc-spec    → tests/*(RED) + 시트(.xlsx) + tc.lock.json
                                                                                    🛑 Human Gate 2 (계약·락 승인)
[3 구현  impl-workflow — ECRC]  ← 진입조건: valid RED + tc.lock (하드 게이트) · 이후 완전 자동
  → Execute(병렬 구현·소유권 배타) → Check(build/lint) → Review(code-reviewer 합의 max 3) → Complete(락 드리프트)

[4 테스트 test-workflow]  ← 완전 자동
  → VERIFY(실앱 GREEN 실측) → TRIAGE(3분류) → FEEDBACK(BUG만 재구현 루프) → REPORT
```

- **워크플로우 4개**가 각 단계를 **순차 위임**만 한다. 단계 자체는 워크플로우가 아니라 `[agent+skill+hook+rule+계약]` 단위다.
- **Human Gate 2곳 고정**: Gate 1 = FACTS 질문 승인(기획 확정), Gate 2 = 계약+RED 락 승인(명세 확정). 구현→테스트 구간은 100% 자동 — 중단 신호(SPEC_MISMATCH·해시 드리프트·human_gate_required)만 사람에게 올라온다.
- **하이브리드 게이트**: 각 명세 단계는 기계 게이트(`gate_check.py` — 형태·ID 체인)가 1차, LLM judge(`spec-lead` — 상류 대비 의미 누락·모순)가 2차. judge는 기계 PASS를 역전할 수 없다.
- **단계 독립**: 각 단계는 앞 단계의 **계약 파일(json/md)만** 입력으로 받는다. 계약만 있으면 단계 하나를 단독 실행할 수 있다(앞 단계 재실행 불필요).
- **FACTS는 계약이 아니라 Human Gate**: FACTS_{feature}.json은 PRD의 참고 입력일 뿐 `prd.contract.json` 필드에 편입되지 않는다. `approved:true`가 파일에 기록되기 전까지 PRD 단계는 시작되지 않는다(spec-workflow 진입 하드 게이트).
- **TC portability**: TC 단계는 **`prd.contract.json`만** 소비한다(Plan을 보지 않는다). 그래서 tests/ 를 떼어 **계약 형태가 같은 다른 PRD/Plan에 붙여도 동작**한다.
- **멀티피처 누적 계약(v2.2)**: `prd.contract.json`·`plan.contract.json`은 피처마다 새 파일을 만들지 않고 **싱글턴 경로 고정**(`prd/prd.contract.json`, `plan/plan.contract.json`) — 앱 전체 누적 명세가 된다. 각 writer는 **자기 피처의 screens/acs/tasks만 추가·갱신**하고 타 피처 항목은 그대로 보존한다(덮어쓰기 금지).
- `gate_prd`는 `_data/manifests/contract_registry.json`(피처별 `screen_ids`/`ac_ids` 누적 기록)과 현재 `prd.contract.json`을 비교해 **타 피처 계약이 사라졌으면 FAIL**한다(레지스트리 가드).
  **레거시 도입 주의**: 레지스트리 부재 상태에서 이미 다피처 항목이 누적된 계약에 첫 `gate prd`를 돌리면 첫 PASS 피처가 전 항목을 귀속받는다 — 레거시 편입 시 피처별로 `gate prd`를 순서대로 실행하거나, `contract_registry.json`을 SID 기준으로 수동 분배해 초기화한 뒤 시작할 것.
- `plan.contract.json`의 각 `tasks[]`에는 `feature` 필드를 스탬프한다 — `impl-workflow`가 이 값으로 **자기 피처 task만 필터링**해 병렬 구현 대상을 좁힌다. 단, `focusAcs`/`focusScreens` 재구현(전체 회귀 수리) 시에는 피처 필터 대신 **`ac_refs` 교집합 기준**으로 선별해 타 피처 소속 task도 수리 대상에 포함한다.

---

## 1. 단계별 입력 요구 / 출력 계약 (req#6·7)

각 단계 스킬 md는 아래 두 줄을 **반드시** 명시한다: (입력) 이전 단계가 무엇을 줘야 하는가 · (출력) 다음 단계에 무슨 파일/항목을 넘기는가.

| 단계 | 입력(이전 단계에서 필요한 것) | 출력(다음 단계에 주는 것) |
|------|------------------------------|---------------------------|
| **BRIEF** | 아이디어(러프) 또는 기존 기획 자료(사람) | `BRIEF_{feature}.md`(§0~§5: OVERVIEW·CORE FACTS·ASSUMPTIONS·EARS·SCREENS·OPEN QUESTIONS) — `BRIEF_SCHEMA.md` |
| **DESIGN** | `BRIEF_{feature}.md`의 §0·§4 | `design_system.json`(앱 전역 토큰, 누적) + `DESIGN_{feature}.md` — `DESIGN_SCHEMA.md` |
| **FACTS** | `BRIEF_{feature}.md` (표준 기획서) | `FACTS_{feature}.json`(confidence·issues·questions≤5·approved) — Human Gate 1, 계약 아님 |
| **PRD** | `BRIEF_{feature}.md`(§3 EARS 전수) + 승인된 FACTS | `prd.contract.json`(screens·acs·impl_requirements) + `PRD.md` |
| **PLAN** | `prd.contract.json`의 **acs + screens** | `plan.contract.json`(tasks, 모든 AC 커버) + `PLAN.md` |
| **TC** | `prd.contract.json`의 **acs + screens.components** (Plan 미참조) | `tests/**/*.spec.*`(코드부재 RED) + 시나리오 시트(`.xlsx`) + `TC.md` |

**추적 체인 (문자열 동일성 = 게이트 강제)**
```
prd.contract.json.acs[].id  →  plan.contract.json.tasks[].ac_refs  →  TC 테스트 제목 접두사
```
- 세 지점의 AC-ID 문자열이 완전히 같아야 한다. `gate_check.py`가 집합 차집합으로 고아/미커버 AC를 FAIL 처리한다.
- **AC-ID 포맷**: `AC-{SID}-{NN}` (`SID`=`screen_id`에서 `A-`→`A`. 예 `A-18`→`AC-A18-01`). 정규식 `AC-[A-Z][A-Z0-9]*(?:-[0-9]+)*-[0-9]{2}`.
- **BE-ID**: `BE-{SID}-{NN}` — Playwright TC 대상 아님(빌드·계약테스트로 검증).

---

## 2. prd.contract.json — PRD가 Plan·TC에 넘기는 기계 계약 (코드·스택 0)

```jsonc
{
  "feature": "feed",
  "screens": [{
    "screen_id": "A-18",
    "title": "피드 목록",
    "purpose": "관리자가 피드를 조회/생성",
    "entry": "이 화면에 도달하는 사용자 경로 서술(스택 무관)",
    "components": [{
      "key": "grid-list",                       // {kind}-{name} 논리 식별자 (셀렉터 아님)
      "kind": "grid|button|search|modal|field|link|tab|badge|list|text",
      "label": "실제 표시 텍스트",
      "role": "관측가능 역할(버튼/표/입력 등)",
      "columns": ["제목","작성자","상태"],       // (grid) 컬럼 라벨
      "opens": "modal-create",                   // (button/link) 여는 컴포넌트 key
      "behavior": "관측가능 반응 서술 (예: 클릭 시 생성 모달 표시)"
    }]
  }],
  "acs": [{
    "id": "AC-A18-01",
    "screen_id": "A-18",
    "layer": "render|interaction|flow",
    "given": "관측가능 전제 상태",
    "when": "사용자 행동 1개",
    "then": "기대 결과 1개 (관측가능 UI 동작만)",
    "components": ["grid-list"]                   // 이 AC가 참조하는 컴포넌트 key
  }],
  "impl_requirements": {                          // req#8: stack-agnostic 구현 명세
    "frontend": ["화면 A-18은 컬럼 제목/작성자/상태 그리드 + 검색창 + 생성버튼(생성 모달)을 제공해야 한다"],
    "backend":  ["피드 목록 조회는 {id,title,author,status} 리스트를 반환하는 계약을 제공해야 한다"]
  }
}
```

- **컴포넌트는 `key`(논리 식별자)만 준다. `locate`/`testid`/CSS 등 셀렉터는 계약에 없다** — 그건 스택 종속이라 §4 어댑터가 TC 실행 시점에 해석한다. PRD는 스택을 모른다.
- **`impl_requirements`(req#8)**: 코드도 없고 스택도 미정인 상태에서 "FE/BE가 **이렇게 구현돼야 한다**"를 행동·인터페이스 수준으로 서술. 코드·프레임워크명·파일경로 금지.
- **원자성**: AC 1개 = Given 1·When 1·Then 1. `then`은 PRD에 명시된 관측 가능 요소/동작만.

---

## 3. plan.contract.json — Plan이 주는 것 (AC 커버리지 보증)

```jsonc
{
  "feature": "feed",
  "tasks": [{
    "task_id": "TASK-A18-1",
    "ac_refs": ["AC-A18-01"],                     // prd 계약의 AC-ID (창작 금지)
    "kind": "frontend|backend",
    "target": "구현 대상 서술(컴포넌트/엔드포인트). 스택 표준 경로는 프리셋 값으로 주입",
    "steps": ["..."],
    "success_criteria": ["AC-A18-01 GREEN"],
    "depends_on": []
  }]
}
```

- Plan은 **PRD 계약(acs·screens)만 소비**한다. 새 사실·화면·AC·식별자를 **창작하지 않는다**.
- 유일한 강제: **모든 PRD AC-ID가 최소 1개 task의 `ac_refs`에 존재**(고아 AC 0). 이것이 TC 추적 체인을 성립시키는 보증서다.
- **TC는 Plan을 읽지 않는다.** 따라서 TC portability(§0)가 성립한다.

---

## 4. 스택 어댑터 — 계약의 유일한 스택 종속 지점 (TC 실행 시점)

PRD/Plan/TC 계약 본문(AC-ID·G/W/T·컴포넌트 key·role·label)은 **전부 스택 무관**이다. 스택에 종속되는 것은 **오직 "논리 key → 실제 셀렉터" 매핑**과 **"화면 → 실앱 진입"** 두 가지이며, 이는 계약이 아니라 **어댑터**(`helpers.js resolveLocator` + `presets/<stack>.conf`)가 TC 실행 시점에 해석한다.

| 스택 | key → 셀렉터 | 화면 → 진입 |
|------|--------------|-------------|
| 웹(예: React) | `getByTestId("{screen_id}-{key}")` 또는 role+label | URL 라우팅 |
| 그 외 | `helpers.js`의 resolveLocator만 교체 | 프리셋 정의 |

- **구현 의무**: 구현체는 계약 `key`마다 스택 표준 마커(웹=`data-testid="{screen_id}-{key}"`)를 부착해야 TC가 GREEN이 된다. 이는 **impl 단계** 책임이지 PRD 책임이 아니다.
- 빌드/린트 명령도 스택 종속이며 **프리셋값(`PRESET_SPEC_BUILD_*`)으로 주입**한다. 엔진(워크플로우 JS)에 스택 리터럴을 넣지 않는다.

---

## 5. ECC TDD — 코드 전무 전제의 valid RED (req#9)

TC는 **구현 코드가 하나도 없다는 가정**에서 시작한다. 목업을 만들지 않는다.

1. `prd.contract.json`의 acs + components만으로 테스트를 **먼저** 작성한다. 제목 = AC-ID.
2. **실앱(코드 부재) 대상으로 실행 → valid RED**: 테스트가 컴파일·실행되고, `ui(key)` 셀렉터가 미구현이라 요소를 못 찾아 단언 실패한다. (ECC 정의: 컴파일·실행되었고, 실패 원인이 미구현/의도한 부재다. 문법오류·설정깨짐 때문이면 RED 아님.)
3. 구현이 계약 key마다 마커를 부착하면 **동일 테스트가 GREEN**이 된다. → "뽑힌 TC로 UI 코드를 테스트"(req#9).

- **금지**: 목업 대상 GREEN, `waitForTimeout`, `test.skip`, 구현 세부(내부 state) 단언. **허용**: 사용자 관측 동작 단언, 시맨틱/계약 셀렉터.
- **락**: valid RED 확정 시 spec별 sha256 + ac_refs를 `tc.lock.json`에 고정. 구현 중 spec 변조 = HUMAN GATE.

---

## 6. TC가 생산하는 것

| 산출 | 내용 |
|------|------|
| `tc/tests/**/{screen_id}.spec.*` | AC별 테스트 (제목=AC-ID, 셀렉터=`ui(key)`, 진입=`gotoScreen(screen_id)`) |
| `tc/tests/_structure.spec.js` | 구조검증 spec — `gen_structure_spec.py` 결정론 생성 |
| `tc/tests/specs/e2e/*.spec.js` | E2E spec(제목=`SC-{feature}-{NNN}`) — test-workflow 산출, `gate_check.py e2e` 대상 |
| `tc/TC.md` | AC↔TC 추적 매트릭스 + RED/GREEN 열 |
| `tc/sheet_{feature}.json` | 시나리오 시트 정본(scenario_id/screen_id/no/feature_fn/test_item/method_steps/expected/ac_refs/e2e/result) |
| `tc/sheet_{feature}.xlsx` | 시나리오 시트 실제 엑셀 산출(사람 전달물, req#4 필수) — `gen_test_sheet.py`(openpyxl) |
| `tc/tc.lock.json` | valid RED 확정 시 spec sha256 + ac_refs 락 |
| `tc/tc.e2e.lock.json` | `gate_check.py e2e` 최초 PASS 시 E2E spec sha256 락 |

> 이 계약은 `gate_check.py facts|prd|plan|tc|e2e`가 기계 검증한다. 다섯 게이트 PASS = 단계 계약 충족.

---

## 7. 역행(백트래킹) — root_cause_level

문제가 있으면 같은 단계를 반복하지 않고 **원인이 있는 상위 단계로 되돌아간다.** 자동 롤백(파일을 직접 고쳐씀)은 없다 — 대신 진단 → 재진입 신호 → Main이 재호출하는 구조다.

| 단계 | 같은 단계 1회 재시도 실패 시 | 반복(3회 이상, 3회째 연속 실패 도달 시) |
|------|------------------------------|--------------------|
| BRIEF/DESIGN/FACTS (brief-workflow) | 파이프라인 최상류 — 역행 없음. `spec_retry.py bump` 후 중단 신호(원인 대부분 입력 부족 — 사용자 보강) | `human_gate_required:true` 반환 — 사용자 보고 |
| PRD/PLAN/TC (spec-workflow) | `spec-lead` dispatch → `root_cause_level`(`brief`\|`facts`\|`prd`\|`plan`\|`tc`\|`null`) 진단 → `spec_retry.py bump` | `human_gate_required:true` 반환 — Main 재호출 금지, 사용자 보고 |
| IMPL(impl-workflow) | REVIEW 합의 루프(max 3) 내 자체 수리. `impl-lead`가 REPORT에 `root_cause_level`(`prd`\|`plan`\|`null`) 포함 가능 | 해당 시 Main이 명세 파이프라인으로 복귀 |
| TEST(test-workflow) | **TRIAGE 3분류가 선행** — `IMPLEMENTATION_BUG`만 재구현 루프, `SPEC_MISMATCH`는 즉시 중단+`root_cause_level`(`prd`\|`plan`\|`tc`), `TEST_FLAKY`는 재검증 1회 | 해당 시 Main이 명세 파이프라인으로 복귀 |

- `root_cause_level` 순서: **brief < facts < prd < plan < tc**. Main의 재진입 경로:
  - `brief`·`facts` → `Workflow('brief-workflow', {base, feature, startAt: root_cause_level, hints: concerns})`
  - `prd`·`plan`·`tc` → `Workflow('spec-workflow', {base, feature, startAt: root_cause_level, hints: concerns})`
- **TRIAGE 원칙(test-workflow)**: 실패를 고치기 전에 원인부터 분류한다 — 명세가 틀렸는데 코드를 고치는 "무한 삽질"을 기계적으로 차단. SPEC_MISMATCH 판정 시 재구현 루프는 즉시 멈춘다.
- **REVIEW 합의(impl-workflow, ECRC의 R)**: build 통과 후 `code-reviewer`가 계약(AC) 대비 논리 검수 — critical/major 0건 합의까지 워커와 핑퐁(max 3). 리뷰어는 파일을 수정하지 않는다(판정·지시만).
- 성공한 단계는 `spec_retry.py reset`으로 카운터가 즉시 0으로 리셋된다 — "연속 실패"만 누적, 성공하면 다시 3회부터 시작.

---

## 8. 브라운필드(baseline-workflow) — 기존 코드 도입

신규 피처(§0~§7)는 코드가 전무한 상태를 전제한다. **기존 코드베이스**(사양서·테스트 없음)를 파이프라인에 편입시킬 때는 별도 워크플로우 `baseline-workflow.js`를 쓴다. 기존 게이트·러너(`gate_check.py`·`red_run.sh`)는 **무변경 재사용** — SCAN·MARK·VERIFY 세 단계만 앞뒤로 덧붙인다.

```
SCAN   → 기존 코드 구조/화면/컴포넌트 정적 스캔 (계약 아님, PRD 역도출 입력 자료)
FACTS  → agent:facts-writer · skill:facts-spec → FACTS_{feature}.json (Human Gate, §0과 동일)
PRD    → agent:prd-writer · skill:prd-spec → prd.contract.json — **현행 동작만 역도출**한다.
          "있어야 할 기능"이 아니라 "지금 코드가 실제로 하는 동작"만 acs/screens로 서술한다.
PLAN   → agent:plan-writer · skill:plan-spec → plan.contract.json — 신규 구현 계획이 아니라
          **기존 코드 → AC 매핑**(어느 파일/컴포넌트가 이미 그 AC를 구현하고 있는지)
TC     → agent:tc-writer · skill:tc-spec → tests/*(RED) — §5와 동일하게 **빈 셸(shell_app)**을
          대상으로 실행해 valid RED를 확정한다. 실제 서비스 코드는 존재하지만 RED 판정 대상은
          계약 key 마커가 없는 빈 셸이므로, §5의 valid RED 정의(LOGIC_ABSENT=total)가 그대로 성립한다.
MARK   → agent:ui_developer dispatch → 기존 코드에 계약 key마다
          `data-testid="{screen_id}-{key}"` 마커만 부착. §4 "구현 의무"의 브라운필드 판 —
          **동작 변경 금지**, 로직 작성 금지, 마커 부착만 허용.
          (test-lead는 브라운필드 파트장으로서 VERIFY 실패 진단·REPORT 인수검수만 담당 —
          리드 재작성 금지 원칙상 마커 부착 같은 파일 수정은 ui_developer 소관)
VERIFY → red_run.sh real로 실앱 GREEN 실측(test-workflow와 동일 절차). 실패 시 원인은 대개
          "PRD가 실제 동작과 다르게 역도출됨" — §7 root_cause_level 역행 규약에 따라 PRD 단계로
          되돌아가 계약을 재도출한다(코드를 고치지 않는다).
```

- **RED 유효성**: §5의 valid RED는 "코드가 전무하다"가 아니라 "계약 key 마커가 없어 `ui(key)`가 요소를 못 찾는다"가 조건이다. 브라운필드는 로직은 있어도 마커가 없으므로 이 조건을 그대로 만족한다 — TC 단계·`red_run.sh`·`tc.lock.json` 로직 전부 무변경.
- **MARK ≠ 구현**: 신규 피처의 "구현 의무"(§4)는 로직+마커를 함께 만드는 것이지만, 브라운필드는 로직이 이미 있으므로 마커만 얹는다. 로직을 고치면 기존 동작이 바뀌어 브라운필드 전제(현행 보존)가 깨진다.
- **VERIFY 역행**: MARK 이후에도 GREEN이 안 나오면 코드를 고치는 대신 PRD를 다시 역도출한다 — 브라운필드는 "코드가 진실(source of truth)"이므로 계약이 코드에 맞춰 조정된다(반대가 아니다).

---

## 9. 시나리오 매핑 — 워크플로우 선택

| 시나리오 | 워크플로우 조합 | 비고 |
|---|---|---|
| 신규(아이디어부터) | **brief-workflow(HG1) → spec-workflow(HG2) → impl-workflow → test-workflow** | §0 기본 흐름 — 4단계 전체 |
| 신규(기획서 이미 있음) | brief-workflow(`brief:` 입력 — 정형화만) → 이후 동일 | 기존 자료를 표준 BRIEF로 정형화 후 동일 경로 |
| 수정(동일 피처, AC 불변) | impl-workflow → (필요 시) test-workflow | plan.contract.json 해당 task만 갱신, prd.contract.json 불변 |
| 수정(기능 추가, 동일 피처에 AC 추가) | spec-workflow(`startAt:"prd"`, 기존 계약에 병합) → impl-workflow → test-workflow | §0 누적 계약 원칙 적용 — 기존 screens/acs 보존, 신규 AC만 추가, `contract_registry.json` 가드 통과 필수 |
| 기존 코드(사양·테스트 없음) | baseline-workflow(SCAN→FACTS→PRD→PLAN→TC→MARK→VERIFY) | §8. GREEN 베이스라인 확보 후, 그 위에 얹는 다음 피처부터 위 표의 다른 행으로 전환 |

- **직렬 운영 제약**: `red_run.sh real`은 `.claude/specs/tc/tests/` 전체 스위트를 한 번에 실행한다. 어떤 피처의 spec이 아직 RED인 채로 남아있으면 다른 피처를 GREEN 검증해도 all_green은 항상 실패한다. 따라서 **한 피처는 test-workflow의 all_green 완료 후 다음 피처에 착수**한다 — 여러 피처를 spec 단계까지만 병행 진행해 놓고 impl을 동시에 돌리는 것은 금지.
