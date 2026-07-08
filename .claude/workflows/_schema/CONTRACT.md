# CONTRACT — 명세 파이프라인 단계 간 계약 (PRD → Plan → TC)

> **이 문서가 이 시스템에서 제일 중요하다 (SSOT).**
> 방법론은 **ECC TDD** — 테스트를 코드보다 먼저 쓰고, **코드가 전무한 상태에서 valid RED**를 확정한 뒤, 구현이 그 테스트를 GREEN으로 만든다.
> 목업(HTML)·구현물은 **어느 단계에서도 만들지 않는다.** PRD/Plan/TC는 전부 **명세**다.

---

## 0. 파이프라인 (단계 독립 + 순차 위임)

```
기획서 브리프
  → [PRD 단계]  agent:prd-writer  · skill:prd-spec   → PRD.md      + prd.contract.json
  → [PLAN 단계] agent:plan-writer · skill:plan-spec  → PLAN.md     + plan.contract.json
  → [TC 단계]   agent:tc-writer   · skill:tc-spec    → tests/*(RED) + TC.md
```

- **명세 워크플로우 1개**(`spec-workflow.js`)가 세 단계를 **순차 위임**만 한다. 단계 자체는 워크플로우가 아니라 `[agent+skill+hook+rule+계약]` 단위다.
- **단계 독립**: 각 단계는 앞 단계의 **계약 파일(json)만** 입력으로 받는다. 계약만 있으면 단계 하나를 단독 실행할 수 있다(앞 단계 재실행 불필요).
- **TC portability**: TC 단계는 **`prd.contract.json`만** 소비한다(Plan을 보지 않는다). 그래서 tests/ 를 떼어 **계약 형태가 같은 다른 PRD/Plan에 붙여도 동작**한다.

---

## 1. 단계별 입력 요구 / 출력 계약 (req#6·7)

각 단계 스킬 md는 아래 두 줄을 **반드시** 명시한다: (입력) 이전 단계가 무엇을 줘야 하는가 · (출력) 다음 단계에 무슨 파일/항목을 넘기는가.

| 단계 | 입력(이전 단계에서 필요한 것) | 출력(다음 단계에 주는 것) |
|------|------------------------------|---------------------------|
| **PRD** | 기획서 브리프(사람) | `prd.contract.json`(screens·acs·impl_requirements) + `PRD.md` |
| **PLAN** | `prd.contract.json`의 **acs + screens** | `plan.contract.json`(tasks, 모든 AC 커버) + `PLAN.md` |
| **TC** | `prd.contract.json`의 **acs + screens.components** (Plan 미참조) | `tests/**/*.spec.*`(코드부재 RED) + `TC.md` |

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
  },
  "non_goals": ["일괄 삭제", "권한별 노출 분기"],  // §6 비목표 — 스코프 경계 (기계 검사)
  "unknowns": [{                                  // U-xxx 원장: 근거 없으면 지어내지 말고 남긴다
    "id": "U-001",
    "area": "A-18",
    "unknown": "검색 대상 필드가 기획서에 미명시",
    "impact": "AC-A18-03 then 확정 불가",
    "blocking": true,                             // true = 게이트 REVIEW_REQUIRED (사람 결정 대기)
    "required_decision": "제목만 vs 제목+작성자"
  }]
}
```

- **컴포넌트는 `key`(논리 식별자)만 준다. `locate`/`testid`/CSS 등 셀렉터는 계약에 없다** — 그건 스택 종속이라 §4 어댑터가 TC 실행 시점에 해석한다. PRD는 스택을 모른다.
- **`impl_requirements`(req#8)**: 코드도 없고 스택도 미정인 상태에서 "FE/BE가 **이렇게 구현돼야 한다**"를 행동·인터페이스 수준으로 서술. 코드·프레임워크명·파일경로 금지.
- **원자성**: AC 1개 = Given 1·When 1·Then 1. `then`은 PRD에 명시된 관측 가능 요소/동작만.
- **`non_goals`**: 브리프에 인접하지만 이번 구현에서 제외하는 것(≥1). Plan·TC가 non_goals 항목을 다루면 **창작 = FAIL**.
- **`unknowns`(U-xxx)**: 근거가 없으면 추측으로 채우지 않고 U-xxx로 남긴다. `blocking=true`면 게이트가 **REVIEW_REQUIRED**로 사람 결정을 기다린다 — 실패가 아니라 대기다.
- **표면 완비**: 화면당 `render` AC ≥ 1 (게이트 강제). AC 커버리지는 "있는 AC"만 보므로, 화면 자체가 빠지는 누락은 이 규칙이 잡는다.

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
| `tc/TC.md` | AC↔TC 추적 매트릭스 + RED/GREEN 열 |
| `tc/tc.lock.json` | valid RED 확정 시 spec sha256 + ac_refs 락 |

---

## 7. 게이트 판정 · 상류 변경 감지

`gate_check.py {prd|plan|tc}`의 판정은 **루프백 목적지를 내장**한다 (manifest `verdict` 필드):

| verdict | exit | 의미 · 라우팅 |
|---------|------|---------------|
| `APPROVE` | 0 | 통과 — 다음 단계 진행 |
| `REVISE_THIS` | 1 | 이 단계 산출물 최소 수정 후 재게이트 (산출물 누락은 exit 2) |
| `REVISE_EARLIER` | 1 | 상류 문제 — **이 단계 수정 금지**, 상류 단계 재실행(`startAt`) |
| `REVIEW_REQUIRED` | 3 | **실패 아님** — 사람 결정 대기 (blocking unknown · tc.lock 해시 드리프트) |

- **상류 변경 감지(stale)**: 각 게이트는 manifest에 계약 `contract_sha256`을 기록하고, 하류 게이트(plan·tc)는 상류 계약의 현재 해시와 대조한다. 불일치 = `REVISE_EARLIER`(gate_prd 재실행 + 하류 영향 검토). **하류 산출물 자동 재생성 금지** — 감지·보고까지만, 반영은 사람이 결정한다.
- **TC 락 사전 차단**: `tc.lock.json` 존재 상태에서 `tc/tests/**` 수정 시도는 훅(`hooks/scripts/tc_lock_guard.py`)이 실행 전에 잡아 사람 승인(ask)을 요구한다 — 게이트 해시 드리프트 검출(사후)의 사전판. 승인된 재-RED는 `TC_LOCK_ALLOW=1`.

> 이 계약은 `gate_check.py prd|plan|tc`가 기계 검증한다. 세 게이트 `APPROVE` = 단계 계약 충족.
