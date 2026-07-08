// B-04.spec.js — 시리즈 화면 TC
// 소비 계약: prd.contract.json screens[B-04] + acs[AC-B04-*]
const { test, expect } = require('@playwright/test');
const { gotoScreen, ui } = require('./helpers');

test('AC-B04-01: /series 진입 시 시리즈 카드 목록이 표시됨', async ({ page }) => {
  // Given/When — /series 화면 진입
  await gotoScreen(page, 'B-04');
  // Then — 계약 key 관측
  await expect(ui(page, 'B-04', 'list-series')).toBeVisible();
});

test('AC-B04-02: 시리즈 카드 클릭 시 해당 시리즈 글 목록이 표시됨', async ({ page }) => {
  // Given — /series 화면에 시리즈 카드 목록이 표시된 상태
  await gotoScreen(page, 'B-04');
  const seriesList = ui(page, 'B-04', 'list-series');
  await expect(seriesList).toBeVisible();
  // When — 첫 번째 시리즈 카드를 클릭
  await seriesList.first().click();
  // Then — 시리즈 글 목록이 표시됨
  await expect(ui(page, 'B-04', 'list-series-posts')).toBeVisible();
});
