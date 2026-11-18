// SC-hot-issues-001.spec.js — E2E: 홈 내비 핫이슈 링크 → 핫이슈 피드 목록(H-01) 이동
// 소비 계약: prd.contract.json screens[B-01,H-01] + acs[AC-B01-07]
const { test, expect } = require('@playwright/test');
const { gotoScreen, ui } = require('../../helpers');

test('SC-hot-issues-001: 내비 핫이슈 링크를 클릭하면 핫이슈 피드 목록 화면(H-01)으로 이동함', async ({ page }) => {
  // Given — 홈 화면에 내비 메뉴가 표시된 상태
  await gotoScreen(page, 'B-01');
  const nav = ui(page, 'B-01', 'nav-main');
  await expect(nav).toBeVisible();
  // When — 내비 '핫이슈' 링크를 클릭
  await nav.getByRole('link', { name: '핫이슈' }).click();
  // Then — 핫이슈 피드 목록 화면(H-01)으로 이동해 목록이 표시됨
  await expect(ui(page, 'H-01', 'list-hotissues')).toBeVisible();
});
