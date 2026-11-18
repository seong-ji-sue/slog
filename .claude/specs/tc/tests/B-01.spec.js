// B-01.spec.js — 홈 화면 TC
// 소비 계약: prd.contract.json screens[B-01] + acs[AC-B01-*]
// [재작업] list-feed·badge-project 컴포넌트 제거 + link-posts 추가 반영(prd.contract.json 갱신).
// 홈에 포스트 카드 피드 자체가 없는 현재 구현이 의도적 설계 변경 — AC-B01-02/04/06(피드 의존) 삭제.
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
  await expect(ui(page, 'B-01', 'link-posts')).toBeVisible();
  await expect(ui(page, 'B-01', 'text-footer')).toBeVisible();
});

test('AC-B01-01: 홈 로고 텍스트가 SLOG_ 를 포함함', async ({ page }) => {
  // Given/When
  await gotoScreen(page, 'B-01');
  // Then
  await expect(ui(page, 'B-01', 'logo-slog')).toContainText('SLOG_');
});

test('AC-B01-01: 전체 글 보기 링크 클릭 시 전체 글 목록 화면(B-02)으로 이동함', async ({ page }) => {
  // Given — 홈 화면이 렌더링되고 link-posts가 표시된 상태
  await gotoScreen(page, 'B-01');
  const linkPosts = ui(page, 'B-01', 'link-posts');
  await expect(linkPosts).toBeVisible();
  // When — 전체 글 보기 링크를 클릭
  await linkPosts.click();
  // Then — /posts 화면으로 이동함
  await expect(page).toHaveURL(/\/posts/);
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

test('AC-B01-07: 내비 핫이슈 링크 클릭 시 핫이슈 피드 목록 화면(H-01)으로 이동함', async ({ page }) => {
  // Given — 홈 화면이 렌더링된 상태
  await gotoScreen(page, 'B-01');
  const nav = ui(page, 'B-01', 'nav-main');
  await expect(nav).toBeVisible();
  // When — 내비의 '핫이슈' 링크를 클릭
  await nav.getByRole('link', { name: '핫이슈' }).click();
  // Then — 핫이슈 피드 목록(H-01) URL로 이동함
  await expect(page).not.toHaveURL('/B-01');
});
