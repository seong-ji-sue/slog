# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: H-02.spec.js >> AC-H02-05: 요약 생성 실패 이슈의 상세 화면에서 요약 누락 안내와 원문 링크가 표시됨
- Location: H-02.spec.js:72:1

# Error details

```
"beforeAll" hook timeout of 15000ms exceeded.
```

# Test source

```ts
  1  | // H-02.spec.js — 핫이슈 상세 화면 TC
  2  | // 소비 계약: prd.contract.json screens[H-02] + acs[AC-H02-*]
  3  | //
  4  | // [실측 TRIAGE 재작업] test-workflow 실측 TRIAGE: SPEC_MISMATCH 다수 해소.
  5  | //   - AC-H02-01/02/05: 특정 이슈 상세·요약실패 이슈 실측을 위해 beforeAll에서 fixture seed,
  6  | //     seed가 반환한 id로 gotoScreen(page, 'H-02', { id }) 진입.
  7  | //   - AC-H02-02/04: toHaveURL(/\/H-02/) 가 실제 라우트(/hot-issues/{id})와 무관 →
  8  | //     screenRoutePattern()으로 실제 라우트 기준 단언.
  9  | //   - AC-H02-03/04: 존재하지 않는 식별자는 seed와 무관하게 항상 유효하지 않은 id(0) 사용.
  10 | //   - AC-H02-06: 정상 환경에서 순간적으로 지나가는 로딩 스켈레톤을 안정적으로 관측하기 위해
  11 | //     네비게이션 전 네트워크 스로틀링 추가.
  12 | const { test, expect } = require('@playwright/test');
  13 | const { gotoScreen, ui, screenRoutePattern, throttleNetwork } = require('./helpers');
  14 | const { seed } = require('./fixtures/seed_hotissues');
  15 | 
  16 | // BIGSERIAL은 1부터 시작하므로 0은 항상 존재하지 않는 식별자(lib/hotIssues.ts:
  17 | // getHotIssueById가 numericId <= 0이면 즉시 null 반환).
  18 | const NOT_FOUND_ID = 0;
  19 | 
  20 | let fixtureIds = {};
> 21 | test.beforeAll(async () => {
     |      ^ "beforeAll" hook timeout of 15000ms exceeded.
  22 |   const result = await seed(); // TC_TARGET!=='real'이면 즉시 skip (RED 영향 없음)
  23 |   fixtureIds = result.ids;
  24 | });
  25 | 
  26 | test('AC-H02-01: 핫이슈 상세 화면 렌더링 시 제목·요약·출처명·수집일·원문 링크가 모두 표시됨', async ({ page }) => {
  27 |   // Given/When — 시딩된 핫이슈 상세 화면 진입
  28 |   await gotoScreen(page, 'H-02', { id: fixtureIds['list-1'] });
  29 |   // Then — 계약 key 관측
  30 |   await expect(ui(page, 'H-02', 'text-title')).toBeVisible();
  31 |   await expect(ui(page, 'H-02', 'text-summary')).toBeVisible();
  32 |   await expect(ui(page, 'H-02', 'text-source')).toBeVisible();
  33 |   await expect(ui(page, 'H-02', 'text-collected-date')).toBeVisible();
  34 |   await expect(ui(page, 'H-02', 'link-original')).toBeVisible();
  35 | });
  36 | 
  37 | test('AC-H02-02: 원문 링크 선택 시 원문 페이지가 새 탭에서 열림(상세 화면은 그대로 유지됨)', async ({ page, context }) => {
  38 |   // Given — 원문 링크가 표시된 상태
  39 |   await gotoScreen(page, 'H-02', { id: fixtureIds['list-1'] });
  40 |   const link = ui(page, 'H-02', 'link-original');
  41 |   await expect(link).toBeVisible();
  42 |   // When — 원문 링크를 선택
  43 |   const [newPage] = await Promise.all([
  44 |     context.waitForEvent('page'),
  45 |     link.click(),
  46 |   ]);
  47 |   // Then — 새 탭에서 원문 페이지가 열리고 상세 화면(H-02)은 실제 라우트로 그대로 유지됨
  48 |   await newPage.waitForLoadState();
  49 |   expect(newPage).not.toBe(page);
  50 |   await expect(page).toHaveURL(screenRoutePattern('H-02'));
  51 | });
  52 | 
  53 | test('AC-H02-03: 존재하지 않는 식별자 접근 시 안내 문구와 목록으로 돌아가기 링크가 표시됨', async ({ page }) => {
  54 |   // Given/When — 존재하지 않는 이슈 식별자로 상세 화면 진입
  55 |   await gotoScreen(page, 'H-02', { id: NOT_FOUND_ID });
  56 |   // Then — 존재하지 않음 안내와 목록으로 돌아가기 링크가 표시됨
  57 |   await expect(ui(page, 'H-02', 'text-not-found')).toBeVisible();
  58 |   await expect(ui(page, 'H-02', 'link-back-to-list')).toBeVisible();
  59 | });
  60 | 
  61 | test('AC-H02-04: 존재하지 않음 안내 상태에서 목록으로 돌아가기 링크 클릭 시 핫이슈 피드 목록(H-01)으로 이동함', async ({ page }) => {
  62 |   // Given — 존재하지 않음 안내가 표시된 상태
  63 |   await gotoScreen(page, 'H-02', { id: NOT_FOUND_ID });
  64 |   const backLink = ui(page, 'H-02', 'link-back-to-list');
  65 |   await expect(backLink).toBeVisible();
  66 |   // When — 목록으로 돌아가기 링크를 클릭
  67 |   await backLink.click();
  68 |   // Then — 핫이슈 피드 목록(H-01) 실제 라우트로 이동함
  69 |   await expect(page).toHaveURL(screenRoutePattern('H-01'));
  70 | });
  71 | 
  72 | test('AC-H02-05: 요약 생성 실패 이슈의 상세 화면에서 요약 누락 안내와 원문 링크가 표시됨', async ({ page }) => {
  73 |   // Given/When — 요약 생성에 실패한(seed된 summary=NULL) 이슈의 상세 화면 렌더링
  74 |   await gotoScreen(page, 'H-02', { id: fixtureIds['summary-null'] });
  75 |   // Then — 요약 누락 안내 문구와 원문 링크가 표시됨
  76 |   await expect(ui(page, 'H-02', 'text-summary-error')).toBeVisible();
  77 |   await expect(ui(page, 'H-02', 'link-original')).toBeVisible();
  78 | });
  79 | 
  80 | test('AC-H02-06: 상세 데이터 로딩 중 제목 라인과 요약 문단 형태의 스켈레톤이 표시됨', async ({ page }) => {
  81 |   // Given — 정상 환경에서 순간적으로 지나가는 로딩 구간을 안정적으로 관측하기 위해
  82 |   // 네비게이션 전 네트워크를 스로틀링(실제 응답은 그대로, 전송 속도만 낮춤)
  83 |   await throttleNetwork(page);
  84 |   // When — 데이터 로딩 중 상세 화면 진입
  85 |   await gotoScreen(page, 'H-02', { id: fixtureIds['list-1'] });
  86 |   // Then — 상세 스켈레톤이 표시됨
  87 |   await expect(ui(page, 'H-02', 'detail-skeleton')).toBeVisible();
  88 | });
  89 | 
```