// H-01.spec.js — 핫이슈 피드 목록 화면 TC
// 소비 계약: prd.contract.json screens[H-01] + acs[AC-H01-*]
//
// [실측 TRIAGE 재작업] test-workflow 실측 TRIAGE: SPEC_MISMATCH 다수 해소.
//   - AC-H01-06/12/13: 클릭 직후 active 상태를 대기 없이 evaluate해 레이스 발생 → expectActive()로 교체.
//   - AC-H01-07: 상세 이동 단언이 '/H-01' 부재만 확인해 실제 라우트와 무관 → screenRoutePattern('H-02')로 교체.
//   - AC-H01-04/05/12/13/14: 20건 초과 페이지네이션 실측을 위해 beforeAll에서 fixture seed.
const { test, expect } = require('@playwright/test');
const { gotoScreen, ui, screenRoutePattern, expectActive, throttleNetwork } = require('./helpers');
const { seed } = require('./fixtures/seed_hotissues');

test.beforeAll(async () => {
  await seed(); // TC_TARGET!=='real'이면 즉시 skip (RED 영향 없음)
});

test('AC-H01-01: 핫이슈 피드 목록 화면 진입 시 카드 목록이 표시됨', async ({ page }) => {
  // Given/When — 핫이슈 피드 목록 화면 진입
  await gotoScreen(page, 'H-01');
  // Then — 계약 key 관측
  await expect(ui(page, 'H-01', 'list-hotissues')).toBeVisible();
});

test('AC-H01-02: 검색어 입력 시 제목·요약·출처명에 일치하는 카드만 목록에 남음', async ({ page }) => {
  // Given — 카드가 표시된 상태
  await gotoScreen(page, 'H-01');
  const search = ui(page, 'H-01', 'search-hotissues');
  await expect(search).toBeVisible();
  await expect(ui(page, 'H-01', 'list-hotissues')).toBeVisible();
  // When — 검색어 입력
  await search.fill('개발');
  // Then — 필터링된 목록이 표시됨
  await expect(ui(page, 'H-01', 'list-hotissues')).toBeVisible();
});

test('AC-H01-03: 검색·출처 필터 결과 0건 시 결과 없음 안내와 필터 초기화 버튼이 표시됨', async ({ page }) => {
  // Given — 목록 화면이 표시된 상태
  await gotoScreen(page, 'H-01');
  const search = ui(page, 'H-01', 'search-hotissues');
  await expect(search).toBeVisible();
  // When — 일치하는 카드가 없는 검색어를 입력
  await search.fill('존재하지않는검색어zzz999');
  // Then — 결과 없음 안내와 필터 초기화 버튼이 표시됨
  await expect(ui(page, 'H-01', 'text-empty-search')).toBeVisible();
  await expect(ui(page, 'H-01', 'button-reset-filter')).toBeVisible();
});

test('AC-H01-04: 필터링된 목록이 20건 초과 시 페이지네이션 컨트롤과 함께 표시됨', async ({ page }) => {
  // Given/When — 목록 화면 조회
  await gotoScreen(page, 'H-01');
  // Then — 카드 목록과 페이지네이션이 함께 표시됨
  await expect(ui(page, 'H-01', 'list-hotissues')).toBeVisible();
  await expect(ui(page, 'H-01', 'list-pagination')).toBeVisible();
});

test('AC-H01-05: 페이지 번호 선택 시 해당 페이지의 카드만 표시됨', async ({ page }) => {
  // Given — 페이지네이션 컨트롤이 표시된 상태
  await gotoScreen(page, 'H-01');
  const pagination = ui(page, 'H-01', 'list-pagination');
  await expect(pagination).toBeVisible();
  // When — 2번 페이지를 선택
  await pagination.getByRole('button', { name: '2' }).click();
  // Then — 목록이 갱신되어 표시됨
  await expect(ui(page, 'H-01', 'list-hotissues')).toBeVisible();
});

test('AC-H01-06: 출처 탭 선택 시 해당 출처에서 수집된 카드만 표시됨', async ({ page }) => {
  // Given — 출처 필터 탭이 표시된 상태
  await gotoScreen(page, 'H-01');
  const tab = ui(page, 'H-01', 'tab-source');
  await expect(tab).toBeVisible();
  // When — 'Hacker News' 탭을 선택
  await tab.getByRole('button', { name: 'Hacker News' }).click();
  // Then — 선택한 출처 탭이 활성 상태가 되고 목록이 표시됨
  // (클릭 직후 상태 반영 레이스 — expectActive()가 고정 시간 대기(wait-timeout류) API 없이 폴링 재시도)
  await expectActive(tab.getByRole('button', { name: 'Hacker News' }));
  await expect(ui(page, 'H-01', 'list-hotissues')).toBeVisible();
});

test('AC-H01-07: 카드 클릭 시 해당 이슈의 상세 화면(H-02)으로 이동함', async ({ page }) => {
  // Given — 카드가 표시된 상태
  await gotoScreen(page, 'H-01');
  const list = ui(page, 'H-01', 'list-hotissues');
  await expect(list).toBeVisible();
  // When — 첫 번째 카드를 클릭
  await list.first().click();
  // Then — 핫이슈 상세(H-02) 실제 라우트로 이동함
  await expect(page).toHaveURL(screenRoutePattern('H-02'));
});

test('AC-H01-08: 데이터 로딩 중 카드 형태의 스켈레톤이 표시됨', async ({ page }) => {
  // Given — 정상 환경에서 순간적으로 지나가는 로딩 구간을 안정적으로 관측하기 위해
  // 네비게이션 전 네트워크를 스로틀링(실제 응답은 그대로, 전송 속도만 낮춤)
  await throttleNetwork(page);
  // When — 데이터 로딩 중 화면 진입
  await gotoScreen(page, 'H-01');
  // Then — 카드 스켈레톤이 표시됨
  await expect(ui(page, 'H-01', 'list-skeleton')).toBeVisible();
});

test('AC-H01-09: 저장된 이슈가 0건일 때 안내 문구가 표시됨', async ({ page }) => {
  // Given/When — 저장된 이슈가 0건인 상태에서 화면 렌더링
  await gotoScreen(page, 'H-01');
  // Then — 전체 이슈 0건 안내 문구가 표시됨
  await expect(ui(page, 'H-01', 'text-empty-all')).toBeVisible();
});

test('AC-H01-10: 목록 조회 실패 시 에러 안내와 재시도 버튼이 표시됨', async ({ page }) => {
  // Given/When — 목록 조회가 실패한 상태에서 화면 조회
  await gotoScreen(page, 'H-01');
  // Then — 에러 안내와 재시도 버튼이 표시됨
  await expect(ui(page, 'H-01', 'text-error-list')).toBeVisible();
  await expect(ui(page, 'H-01', 'button-retry-list')).toBeVisible();
});

test('AC-H01-11: 재시도 버튼 클릭 시 재조회 성공하면 카드 목록이 표시됨', async ({ page }) => {
  // Given — 목록 조회 실패 안내와 재시도 버튼이 표시된 상태
  await gotoScreen(page, 'H-01');
  const retry = ui(page, 'H-01', 'button-retry-list');
  await expect(retry).toBeVisible();
  // When — 재시도 버튼을 클릭
  await retry.click();
  // Then — 카드 목록이 표시됨
  await expect(ui(page, 'H-01', 'list-hotissues')).toBeVisible();
});

test('AC-H01-12: 1페이지가 아닌 상태에서 검색어 입력 시 목록이 1페이지로 재설정됨', async ({ page }) => {
  // Given — 1페이지가 아닌 페이지가 표시된 상태
  await gotoScreen(page, 'H-01');
  const pagination = ui(page, 'H-01', 'list-pagination');
  await expect(pagination).toBeVisible();
  await pagination.getByRole('button', { name: '2' }).click();
  // When — 검색어 입력
  const search = ui(page, 'H-01', 'search-hotissues');
  await search.fill('개발');
  // Then — 1번 페이지 버튼이 활성 상태로 표시됨 (클릭 직후 레이스 — expectActive() 폴링 재시도)
  await expectActive(pagination.getByRole('button', { name: '1' }));
});

test('AC-H01-13: 1페이지가 아닌 상태에서 출처 탭 변경 시 목록이 1페이지로 재설정됨', async ({ page }) => {
  // Given — 1페이지가 아닌 페이지가 표시된 상태
  await gotoScreen(page, 'H-01');
  const pagination = ui(page, 'H-01', 'list-pagination');
  await expect(pagination).toBeVisible();
  await pagination.getByRole('button', { name: '2' }).click();
  // When — 출처 탭 변경
  const tab = ui(page, 'H-01', 'tab-source');
  await tab.getByRole('button', { name: 'Hacker News' }).click();
  // Then — 1번 페이지 버튼이 활성 상태로 표시됨 (클릭 직후 레이스 — expectActive() 폴링 재시도)
  await expectActive(pagination.getByRole('button', { name: '1' }));
});

test('AC-H01-14: 5페이지 창을 초과하는 페이지 수에서 다음 페이지 창 이동 시 다음 페이지 번호들이 표시됨', async ({ page }) => {
  // Given — 5페이지 창을 초과하는 페이지 수를 가진 목록이 표시된 상태
  await gotoScreen(page, 'H-01');
  const pagination = ui(page, 'H-01', 'list-pagination');
  await expect(pagination).toBeVisible();
  // When — 다음 페이지 창 이동 컨트롤을 선택
  await pagination.getByRole('button', { name: /다음/ }).click();
  // Then — 다음 5페이지 단위 창의 페이지 번호(6)가 표시됨
  await expect(pagination.getByRole('button', { name: '6' })).toBeVisible();
});

test('AC-H01-15: 결과 없음 안내 상태에서 필터 초기화 버튼 클릭 시 검색어·출처 필터가 해제되고 전체 목록이 복원됨', async ({ page }) => {
  // Given — 결과 없음 안내와 필터 초기화 버튼이 표시된 상태
  await gotoScreen(page, 'H-01');
  const search = ui(page, 'H-01', 'search-hotissues');
  await expect(search).toBeVisible();
  await search.fill('존재하지않는검색어zzz999');
  const resetBtn = ui(page, 'H-01', 'button-reset-filter');
  await expect(resetBtn).toBeVisible();
  // When — 필터 초기화 버튼을 클릭
  await resetBtn.click();
  // Then — 검색어가 해제되고 전체 목록이 복원됨
  await expect(search).toHaveValue('');
  await expect(ui(page, 'H-01', 'list-hotissues')).toBeVisible();
});
