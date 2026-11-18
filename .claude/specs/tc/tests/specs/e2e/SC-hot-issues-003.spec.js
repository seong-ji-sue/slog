// SC-hot-issues-003.spec.js — E2E: 핫이슈 상세(H-02) 존재하지 않음 안내 → 목록으로 돌아가기 → H-01 이동
// 소비 계약: prd.contract.json screens[H-02,H-01] + acs[AC-H02-04]
const { test, expect } = require('@playwright/test');
const { gotoScreen, ui } = require('../../helpers');

test('SC-hot-issues-003: 존재하지 않음 안내 상태에서 목록으로 돌아가기 링크를 클릭하면 핫이슈 피드 목록 화면(H-01)으로 이동함', async ({ page }) => {
  // Given — '이슈를 찾을 수 없습니다' 안내와 목록으로 돌아가기 링크가 표시된 상태
  await gotoScreen(page, 'H-02');
  const backLink = ui(page, 'H-02', 'link-back-to-list');
  await expect(ui(page, 'H-02', 'text-not-found')).toBeVisible();
  await expect(backLink).toBeVisible();
  // When — 사용자가 목록으로 돌아가기 링크를 클릭함
  await backLink.click();
  // Then — 핫이슈 피드 목록 화면(H-01)으로 이동해 목록이 표시됨
  await expect(ui(page, 'H-01', 'list-hotissues')).toBeVisible();
});
