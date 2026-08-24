# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: H-01.spec.js >> AC-H01-01: 핫이슈 피드 목록 화면 진입 시 카드 목록이 표시됨
- Location: H-01.spec.js:16:1

# Error details

```
"beforeAll" hook timeout of 15000ms exceeded.
```

# Test source

```ts
  1   | // H-01.spec.js — 핫이슈 피드 목록 화면 TC
  2   | // 소비 계약: prd.contract.json screens[H-01] + acs[AC-H01-*]
  3   | //
  4   | // [실측 TRIAGE 재작업] test-workflow 실측 TRIAGE: SPEC_MISMATCH 다수 해소.
  5   | //   - AC-H01-06/12/13: 클릭 직후 active 상태를 대기 없이 evaluate해 레이스 발생 → expectActive()로 교체.
  6   | //   - AC-H01-07: 상세 이동 단언이 '/H-01' 부재만 확인해 실제 라우트와 무관 → screenRoutePattern('H-02')로 교체.
  7   | //   - AC-H01-04/05/12/13/14: 20건 초과 페이지네이션 실측을 위해 beforeAll에서 fixture seed.
  8   | const { test, expect } = require('@playwright/test');
  9   | const { gotoScreen, ui, screenRoutePattern, expectActive, throttleNetwork } = require('./helpers');
  10  | const { seed } = require('./fixtures/seed_hotissues');
  11  | 
> 12  | test.beforeAll(async () => {
      |      ^ "beforeAll" hook timeout of 15000ms exceeded.
  13  |   await seed(); // TC_TARGET!=='real'이면 즉시 skip (RED 영향 없음)
  14  | });
  15  | 
  16  | test('AC-H01-01: 핫이슈 피드 목록 화면 진입 시 카드 목록이 표시됨', async ({ page }) => {
  17  |   // Given/When — 핫이슈 피드 목록 화면 진입
  18  |   await gotoScreen(page, 'H-01');
  19  |   // Then — 계약 key 관측
  20  |   await expect(ui(page, 'H-01', 'list-hotissues')).toBeVisible();
  21  | });
  22  | 
  23  | test('AC-H01-02: 검색어 입력 시 제목·요약·출처명에 일치하는 카드만 목록에 남음', async ({ page }) => {
  24  |   // Given — 카드가 표시된 상태
  25  |   await gotoScreen(page, 'H-01');
  26  |   const search = ui(page, 'H-01', 'search-hotissues');
  27  |   await expect(search).toBeVisible();
  28  |   await expect(ui(page, 'H-01', 'list-hotissues')).toBeVisible();
  29  |   // When — 검색어 입력
  30  |   await search.fill('개발');
  31  |   // Then — 필터링된 목록이 표시됨
  32  |   await expect(ui(page, 'H-01', 'list-hotissues')).toBeVisible();
  33  | });
  34  | 
  35  | test('AC-H01-03: 검색·출처 필터 결과 0건 시 결과 없음 안내와 필터 초기화 버튼이 표시됨', async ({ page }) => {
  36  |   // Given — 목록 화면이 표시된 상태
  37  |   await gotoScreen(page, 'H-01');
  38  |   const search = ui(page, 'H-01', 'search-hotissues');
  39  |   await expect(search).toBeVisible();
  40  |   // When — 일치하는 카드가 없는 검색어를 입력
  41  |   await search.fill('존재하지않는검색어zzz999');
  42  |   // Then — 결과 없음 안내와 필터 초기화 버튼이 표시됨
  43  |   await expect(ui(page, 'H-01', 'text-empty-search')).toBeVisible();
  44  |   await expect(ui(page, 'H-01', 'button-reset-filter')).toBeVisible();
  45  | });
  46  | 
  47  | test('AC-H01-04: 필터링된 목록이 20건 초과 시 페이지네이션 컨트롤과 함께 표시됨', async ({ page }) => {
  48  |   // Given/When — 목록 화면 조회
  49  |   await gotoScreen(page, 'H-01');
  50  |   // Then — 카드 목록과 페이지네이션이 함께 표시됨
  51  |   await expect(ui(page, 'H-01', 'list-hotissues')).toBeVisible();
  52  |   await expect(ui(page, 'H-01', 'list-pagination')).toBeVisible();
  53  | });
  54  | 
  55  | test('AC-H01-05: 페이지 번호 선택 시 해당 페이지의 카드만 표시됨', async ({ page }) => {
  56  |   // Given — 페이지네이션 컨트롤이 표시된 상태
  57  |   await gotoScreen(page, 'H-01');
  58  |   const pagination = ui(page, 'H-01', 'list-pagination');
  59  |   await expect(pagination).toBeVisible();
  60  |   // When — 2번 페이지를 선택
  61  |   await pagination.getByRole('button', { name: '2' }).click();
  62  |   // Then — 목록이 갱신되어 표시됨
  63  |   await expect(ui(page, 'H-01', 'list-hotissues')).toBeVisible();
  64  | });
  65  | 
  66  | test('AC-H01-06: 출처 탭 선택 시 해당 출처에서 수집된 카드만 표시됨', async ({ page }) => {
  67  |   // Given — 출처 필터 탭이 표시된 상태
  68  |   await gotoScreen(page, 'H-01');
  69  |   const tab = ui(page, 'H-01', 'tab-source');
  70  |   await expect(tab).toBeVisible();
  71  |   // When — 'Hacker News' 탭을 선택
  72  |   await tab.getByRole('button', { name: 'Hacker News' }).click();
  73  |   // Then — 선택한 출처 탭이 활성 상태가 되고 목록이 표시됨
  74  |   // (클릭 직후 상태 반영 레이스 — expectActive()가 고정 시간 대기(wait-timeout류) API 없이 폴링 재시도)
  75  |   await expectActive(tab.getByRole('button', { name: 'Hacker News' }));
  76  |   await expect(ui(page, 'H-01', 'list-hotissues')).toBeVisible();
  77  | });
  78  | 
  79  | test('AC-H01-07: 카드 클릭 시 해당 이슈의 상세 화면(H-02)으로 이동함', async ({ page }) => {
  80  |   // Given — 카드가 표시된 상태
  81  |   await gotoScreen(page, 'H-01');
  82  |   const list = ui(page, 'H-01', 'list-hotissues');
  83  |   await expect(list).toBeVisible();
  84  |   // When — 첫 번째 카드를 클릭
  85  |   await list.first().click();
  86  |   // Then — 핫이슈 상세(H-02) 실제 라우트로 이동함
  87  |   await expect(page).toHaveURL(screenRoutePattern('H-02'));
  88  | });
  89  | 
  90  | test('AC-H01-08: 데이터 로딩 중 카드 형태의 스켈레톤이 표시됨', async ({ page }) => {
  91  |   // Given — 정상 환경에서 순간적으로 지나가는 로딩 구간을 안정적으로 관측하기 위해
  92  |   // 네비게이션 전 네트워크를 스로틀링(실제 응답은 그대로, 전송 속도만 낮춤)
  93  |   await throttleNetwork(page);
  94  |   // When — 데이터 로딩 중 화면 진입
  95  |   await gotoScreen(page, 'H-01');
  96  |   // Then — 카드 스켈레톤이 표시됨
  97  |   await expect(ui(page, 'H-01', 'list-skeleton')).toBeVisible();
  98  | });
  99  | 
  100 | test('AC-H01-09: 저장된 이슈가 0건일 때 안내 문구가 표시됨', async ({ page }) => {
  101 |   // Given/When — 저장된 이슈가 0건인 상태에서 화면 렌더링
  102 |   await gotoScreen(page, 'H-01');
  103 |   // Then — 전체 이슈 0건 안내 문구가 표시됨
  104 |   await expect(ui(page, 'H-01', 'text-empty-all')).toBeVisible();
  105 | });
  106 | 
  107 | test('AC-H01-10: 목록 조회 실패 시 에러 안내와 재시도 버튼이 표시됨', async ({ page }) => {
  108 |   // Given/When — 목록 조회가 실패한 상태에서 화면 조회
  109 |   await gotoScreen(page, 'H-01');
  110 |   // Then — 에러 안내와 재시도 버튼이 표시됨
  111 |   await expect(ui(page, 'H-01', 'text-error-list')).toBeVisible();
  112 |   await expect(ui(page, 'H-01', 'button-retry-list')).toBeVisible();
```