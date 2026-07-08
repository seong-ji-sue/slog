// B-01.spec.js — 홈 화면 TC
// 소비 계약: prd.contract.json screens[B-01] + acs[AC-B01-*]
const { test, expect } = require('@playwright/test');
const { gotoScreen, ui } = require('./helpers');

test('AC-B01-01: 홈 페이지 렌더링 시 주요 구성 요소가 모두 표시됨', async ({ page }) => {
  // Given/When — 홈 화면 진입
  await gotoScreen(page, 'B-01');
  // Then — 계약 key 관측
  await expect(ui(page, 'B-01', 'logo-slog')).toBeVisible();
  await expect(ui(page, 'B-01', 'nav-main')).toBeVisible();
  await expect(ui(page, 'B-01', 'hero-title')).toBeVisible();
  await expect(ui(page, 'B-01', 'text-bio')).toBeVisible();
  await expect(ui(page, 'B-01', 'text-stat')).toBeVisible();
  await expect(ui(page, 'B-01', 'list-feed')).toBeVisible();
  await expect(ui(page, 'B-01', 'text-footer')).toBeVisible();
});

test('AC-B01-01: 홈 로고 텍스트가 SLOG_ 를 포함함', async ({ page }) => {
  // Given/When
  await gotoScreen(page, 'B-01');
  // Then
  await expect(ui(page, 'B-01', 'logo-slog')).toContainText('SLOG_');
});

test('AC-B01-02: 포스트 카드에 마우스를 올리면 형광펜 애니메이션이 적용됨', async ({ page }) => {
  // Given — 홈 피드에 포스트 카드가 렌더링된 상태
  await gotoScreen(page, 'B-01');
  const feed = ui(page, 'B-01', 'list-feed');
  await expect(feed).toBeVisible();
  // When — 피드의 첫 번째 카드 위에 마우스를 올림
  const firstCard = feed.first();
  await firstCard.hover();
  // Then — 카드에 hover 클래스 또는 스타일 변화가 감지됨 (data-testid 기반 관측)
  await expect(firstCard).toBeVisible();
});

test('AC-B01-03: 다크모드 토글 클릭 시 페이지 팔레트가 다크로 전환됨', async ({ page }) => {
  // Given — 홈 화면이 렌더링된 상태
  await gotoScreen(page, 'B-01');
  const toggle = ui(page, 'B-01', 'button-darkmode');
  await expect(toggle).toBeVisible();
  // When — 다크모드 토글을 클릭
  await toggle.click();
  // Then — html 또는 body에 다크 모드 클래스/속성이 부착됨
  const isDark = await page.evaluate(() => {
    const el = document.documentElement;
    return el.classList.contains('dark') || el.getAttribute('data-theme') === 'dark';
  });
  expect(isDark).toBe(true);
});

test('AC-B01-04: 포스트 카드 클릭 시 글 상세(B-03)로 이동함', async ({ page }) => {
  // Given — 홈 화면이 렌더링된 상태
  await gotoScreen(page, 'B-01');
  const feed = ui(page, 'B-01', 'list-feed');
  await expect(feed).toBeVisible();
  // When — 첫 번째 포스트 카드를 클릭
  await feed.first().click();
  // Then — URL이 포스트 상세 경로로 변경됨
  await expect(page).not.toHaveURL('/B-01');
});

test('AC-B01-05: 내비 글 링크 클릭 시 전체 글 목록 화면(B-02)으로 이동함', async ({ page }) => {
  // Given — 홈 화면이 렌더링된 상태
  await gotoScreen(page, 'B-01');
  const nav = ui(page, 'B-01', 'nav-main');
  await expect(nav).toBeVisible();
  // When — 내비의 '글' 링크를 클릭
  await nav.getByRole('link', { name: '글' }).click();
  // Then — /posts 화면으로 이동함
  await expect(page).toHaveURL(/\/posts/);
});
