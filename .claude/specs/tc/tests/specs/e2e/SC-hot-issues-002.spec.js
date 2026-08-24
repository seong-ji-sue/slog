// SC-hot-issues-002.spec.js — E2E: 핫이슈 피드 목록(H-01) 카드 클릭 → 핫이슈 상세(H-02) 이동
// 소비 계약: prd.contract.json screens[H-01,H-02] + acs[AC-H01-07]
const { test, expect } = require('@playwright/test');
const { gotoScreen, ui } = require('../../helpers');

test('SC-hot-issues-002: 카드를 클릭하면 해당 이슈의 상세 화면(H-02)으로 이동함', async ({ page }) => {
  // Given — 핫이슈 피드 목록 화면에 카드가 표시된 상태
  await gotoScreen(page, 'H-01');
  const list = ui(page, 'H-01', 'list-hotissues');
  await expect(list).toBeVisible();
  // When — 사용자가 카드를 클릭함
  await list.first().click();
  // Then — 핫이슈 상세 화면(H-02)으로 이동해 제목이 표시됨
  await expect(ui(page, 'H-02', 'text-title')).toBeVisible();
});
