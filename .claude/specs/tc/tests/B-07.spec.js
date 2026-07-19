// B-07.spec.js — 태그 상세 화면 TC
// 소비 계약: prd.contract.json screens[B-07] + acs[AC-B07-*]
const { test, expect } = require('@playwright/test');
const { gotoScreen, ui } = require('./helpers');

test('AC-B07-01: /tags/[tag] 진입 시 태그 제목과 포스트 카드 목록이 표시됨', async ({ page }) => {
  // Given/When — /tags/[tag] 화면 진입
  await gotoScreen(page, 'B-07');
  // Then — text-tag-title과 list-posts-by-tag가 표시됨
  await expect(ui(page, 'B-07', 'text-tag-title')).toBeVisible();
  await expect(ui(page, 'B-07', 'list-posts-by-tag')).toBeVisible();
});

test('AC-B07-02: 태그별 포스트 카드 클릭 시 글 상세 화면(B-03)으로 이동함', async ({ page }) => {
  // Given — /tags/[tag] 화면에 포스트 카드 목록이 표시된 상태
  await gotoScreen(page, 'B-07');
  const postList = ui(page, 'B-07', 'list-posts-by-tag');
  await expect(postList).toBeVisible();
  // When — 첫 번째 포스트 카드를 클릭
  await postList.getByRole('link').first().click();
  // Then — 글 상세 URL로 이동함
  await expect(page).not.toHaveURL(/\/tags\//);
});
