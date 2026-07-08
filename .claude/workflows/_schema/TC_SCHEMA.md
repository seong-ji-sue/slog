# TC_SCHEMA — TC 산출물 규격 (ECC TDD, prd.contract.json 전용)

> TC = "테스트 코드"가 아니라 **"이 기능이 다 됐다"의 정의(합격 기준 명세)**다. 구현은 이 명세를 바꾸지 않고 충족한다.
> **스코프 = UI만**: `prd.contract.json.acs[]`(AC) 소비. BE-*는 TC 대상 아님.
> **TC portability**: TC는 `prd.contract.json`만 소비한다. `plan.contract.json` 미참조(CONTRACT.md §0).
> 생명주기: RED(구현 전 유효 실패) → 구현(TC 수정 금지) → 실앱 테스트 → GREEN.

---

## 입력 계약 (CONTRACT.md §1)

| # | 항목 | 경로 |
|---|------|------|
| 1 | AC-ID + layer + G/W/T + components[] | `prd/prd.contract.json.acs[]` |
| 2 | screens[].components[].key / kind / label | `prd/prd.contract.json.screens[]` |

> `plan.contract.json`은 이 단계 입력이 아님.

---

## 산출물 (`tc/` 직속)

| 파일 | 내용 |
|------|------|
| `tc/tests/{screen_id}.spec.js` | AC별 Playwright 테스트 (제목=AC-ID) |
| `tc/tests/_structure.spec.js` | 구조검증 spec — `gen_structure_spec.py`가 prd.contract.json에서 결정론 생성 |
| `tc/tests/specs/e2e/{scenario_id}.spec.js` | E2E spec(제목=SC-{feature}-{NNN}) — test-workflow GEN-E2E 단계 산출, `gate_check.py e2e` 대상 |
| `tc/TC.md` | AC↔TC 추적 매트릭스 + RED/GREEN 열 |
| `tc/sheet_{feature}.json` | 시나리오 시트 정본 (scenario_id/screen_id/no/feature_fn/test_item/method_steps/expected/ac_refs/e2e/result) |
| `tc/sheet_{feature}.xlsx` | 시나리오 시트 실제 엑셀 산출(사람 전달물) — `gen_test_sheet.py` |
| `tc/tc.lock.json` | valid RED 확정 시 spec sha256 + ac_refs 락 |
| `tc/tc.e2e.lock.json` | `gate_check.py e2e` 최초 PASS 시 E2E spec sha256 락 |

---

## spec.js 작성 규칙

```javascript
const { test, expect } = require('@playwright/test');
const { gotoScreen, ui } = require('../helpers');

test('AC-A18-01: 피드 목록 화면 진입 시 그리드가 렌더링된다', async ({ page }) => {
  // Given/When — 화면 진입
  await gotoScreen(page, 'A-18');
  // Then — 계약 key 관측
  await expect(ui(page, 'A-18', 'grid-list')).toBeVisible();
});
```

- 제목 `'AC-{SID}-{NN}: {시나리오}'` 필수 (추적 체인의 끝). AC 1개 = 테스트 1개 이상.
- Given/When/Then 주석. `expect` 단언 필수.
- 셀렉터: **`ui(page, screen_id, key)`만** — CSS/텍스트 추측 금지 (ghost FAIL).
- 진입: **`gotoScreen(page, screen_id)`만**.
- **금지 패턴** (게이트 기계 검출): `waitForTimeout` · `test.skip(` · expect 없는 test · 시간/랜덤 의존.
- 같은 key 여러 행 반복 시 `.first()`/행 스코프로 strict-mode 위반 방지.
- 층(layer): render(진입·핵심렌더, 화면당1) · interaction(버튼→팝업·탭·필수값, 多) · flow(화면이동·상태배지, 少).

---

## AC↔TC 추적 매트릭스 (TC.md)

| AC-ID | 층 | spec 파일 | 테스트 제목 | RED 확인 | GREEN |
|-------|----|-----------|------------|----------|-------|
| AC-A18-01 | render | tc/tests/A-18.spec.js | AC-A18-01: ... | ✅ RED (LOGIC_ABSENT) | ⏳ 실앱 대기 |

- **RED 열**: `red_run.sh` 실측 결과 (이력 보존).
- **GREEN 열**: `red_run.sh real` 실측 후 갱신.

---

## RED 판정 (유효 RED = LOGIC_ABSENT) — CONTRACT.md §5

| 판정 | 조건 |
|------|------|
| **유효 RED** | 컴파일·실행 O, 전건 실패, 실패 원인 = 계약 key 부재(locator timeout) = `LOGIC_ABSENT` |
| **무효 (INFRA)** | 문법·모듈·설정·서버 연결 오류 (`ECONNREFUSED`, `SyntaxError`, `Cannot find module` 등) |
| **게이밍** | 빈 assert · `test.skip` · 통과시키려 테스트 수정 |

```
valid_red = total>0 AND PASS=0 AND INFRA=0 AND OTHER_FAIL=0 AND LOGIC_ABSENT=total
```

valid RED 확정 → spec별 sha256 + ac_refs → `tc/tc.lock.json` 자동 생성.  
이후 spec 해시 변동 = HUMAN GATE.

---

## tc.lock.json 형식

```json
{
  "unlock_condition": "구현 GREEN + 리드 승인 (락 이후 spec 수정 = HUMAN GATE)",
  "red_report": "_data/manifests/red_report.json",
  "files": [
    {
      "path": "tc/tests/A-18.spec.js",
      "sha256": "...",
      "ac_refs": ["AC-A18-01"]
    }
  ]
}
```

---

## 스택 어댑터 (CONTRACT.md §4)

`helpers.js`가 TC 실행 시점에 논리 key → 실제 셀렉터로 해석.

| 스택 | `ui(page, screen_id, key)` 결과 |
|------|---------------------------------|
| 웹(기본) | `page.getByTestId("{screen_id}-{key}")` |
| 그 외 | `helpers.js`의 `resolveLocator`만 교체 |

구현체는 계약 `key`마다 `data-testid="{screen_id}-{key}"` 마커 부착 책임 (impl 단계).

---

## 게이트

```bash
python3 workflows/_tools/gate_check.py tc --feature {feature}
```

exit 0=PASS, 1=FAIL, 2=누락.

| 검사 항목 | 기준 |
|-----------|------|
| AC 커버리지 | prd manifest ac_ids 전건 spec 제목에 존재 |
| 제목 형식 | AC-ID 패턴 100% |
| ghost 셀렉터 | 계약 screens[].components[].key 외 key 0건 |
| 시나리오 시트 커버리지 | `sheet_{feature}.json` AC 전수 커버 + `sheet_{feature}.xlsx` 실제 산출 존재 |
| valid RED | `red_report.json.valid_red = true` |
| 해시 드리프트 | `tc.lock.json` 기준 spec 해시 변동 0건 |
| 금지 패턴 | `waitForTimeout` · `test.skip(` 0건 |

E2E(`gate_check.py e2e --feature {feature}`) 검사 항목: 제목 `SC-{feature}-{NNN}` 형식 100% · ghost 셀렉터 0건 · `sheet_{feature}.json` e2e=true 행 ↔ spec 양방향 커버리지 · `tc.e2e.lock.json` 해시 드리프트 0건.
