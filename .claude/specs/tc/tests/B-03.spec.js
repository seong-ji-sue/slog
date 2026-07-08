// B-03.spec.js — 글 상세 화면 TC
// 소비 계약: prd.contract.json screens[B-03] + acs[AC-B03-*]
const { test, expect } = require('@playwright/test');
const { gotoScreen, ui } = require('./helpers');

test('AC-B03-01: 글 상세 진입 시 포스트 구성 요소가 모두 표시됨', async ({ page }) => {
  // Given/When — 글 상세 화면 진입
  await gotoScreen(page, 'B-03');
  // Then — 계약 key 관측
  await expect(ui(page, 'B-03', 'text-post-meta')).toBeVisible();
  await expect(ui(page, 'B-03', 'text-post-title')).toBeVisible();
  await expect(ui(page, 'B-03', 'text-tldr')).toBeVisible();
  await expect(ui(page, 'B-03', 'list-keywords')).toBeVisible();
  await expect(ui(page, 'B-03', 'text-body')).toBeVisible();
  await expect(ui(page, 'B-03', 'list-refs')).toBeVisible();
  await expect(ui(page, 'B-03', 'nav-series')).toBeVisible();
});

test('AC-B03-01: TL;DR 블록이 TL;DR 텍스트를 포함함', async ({ page }) => {
  // Given/When
  await gotoScreen(page, 'B-03');
  // Then
  await expect(ui(page, 'B-03', 'text-tldr')).toContainText('TL;DR');
});

test('AC-B03-02: 시리즈 이전 글 카드 클릭 시 이전 글 상세로 이동함', async ({ page }) => {
  // Given — 글 상세에서 이전 글이 존재하는 상태 (U-001: 경계 처리 미확정 — 이전 글 존재 케이스만 검증)
  await gotoScreen(page, 'B-03');
  const seriesNav = ui(page, 'B-03', 'nav-series');
  await expect(seriesNav).toBeVisible();
  // When — 이전 글 링크/버튼 클릭
  const prevLink = seriesNav.getByRole('link', { name: /이전/ });
  await expect(prevLink).toBeVisible();
  const currentUrl = page.url();
  await prevLink.click();
  // Then — URL이 변경됨(이전 글 상세)
  await expect(page).not.toHaveURL(currentUrl);
});

test('AC-B03-03: 시리즈 다음 글 카드 클릭 시 다음 글 상세로 이동함', async ({ page }) => {
  // Given — 글 상세에서 다음 글이 존재하는 상태 (U-001: 경계 처리 미확정 — 다음 글 존재 케이스만 검증)
  await gotoScreen(page, 'B-03');
  const seriesNav = ui(page, 'B-03', 'nav-series');
  await expect(seriesNav).toBeVisible();
  // When — 다음 글 링크/버튼 클릭
  const nextLink = seriesNav.getByRole('link', { name: /다음/ });
  await expect(nextLink).toBeVisible();
  const currentUrl = page.url();
  await nextLink.click();
  // Then — URL이 변경됨(다음 글 상세)
  await expect(page).not.toHaveURL(currentUrl);
});
