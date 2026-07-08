// B-05.spec.js — 소개(About) 화면 TC
// 소비 계약: prd.contract.json screens[B-05] + acs[AC-B05-*]
const { test, expect } = require('@playwright/test');
const { gotoScreen, ui } = require('./helpers');

test('AC-B05-01: /about 진입 시 이력·스택·프로젝트·연락처 영역이 모두 표시됨', async ({ page }) => {
  // Given/When — /about 화면 진입
  await gotoScreen(page, 'B-05');
  // Then — 계약 key 관측 (U-002: 실제 콘텐츠 미확정 — 영역 존재 여부만 단언)
  await expect(ui(page, 'B-05', 'text-bio-detail')).toBeVisible();
  await expect(ui(page, 'B-05', 'list-stack')).toBeVisible();
  await expect(ui(page, 'B-05', 'list-projects')).toBeVisible();
  await expect(ui(page, 'B-05', 'list-contact')).toBeVisible();
});

test('AC-B05-02: 프로젝트 링크 클릭 시 새 탭에서 외부 URL이 열림', async ({ page, context }) => {
  // Given — /about 화면에서 프로젝트 링크 영역이 표시된 상태
  await gotoScreen(page, 'B-05');
  const projectsList = ui(page, 'B-05', 'list-projects');
  await expect(projectsList).toBeVisible();
  // When — 첫 번째 프로젝트 링크를 클릭 (새 탭 이벤트 수신)
  const [newPage] = await Promise.all([
    context.waitForEvent('page'),
    projectsList.getByRole('link').first().click(),
  ]);
  // Then — 새 탭이 열림
  expect(newPage).toBeTruthy();
  await newPage.close();
});
