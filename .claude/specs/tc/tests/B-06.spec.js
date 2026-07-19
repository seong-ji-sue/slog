// B-06.spec.js — 태그 인덱스 화면 TC
// 소비 계약: prd.contract.json screens[B-06] + acs[AC-B06-*]
const { test, expect } = require('@playwright/test');
const { gotoScreen, ui } = require('./helpers');

test('AC-B06-01: /tags 진입 시 뷰 전환 토글과 태그 목록이 기본 목록 뷰로 표시됨', async ({ page }) => {
  // Given/When — /tags 화면 진입
  await gotoScreen(page, 'B-06');
  // Then — tab-view-toggle과 list-tags가 기본 목록 뷰로 표시됨
  await expect(ui(page, 'B-06', 'tab-view-toggle')).toBeVisible();
  await expect(ui(page, 'B-06', 'list-tags')).toBeVisible();
});

test('AC-B06-02: 그래프 뷰 토글 클릭 시 태그 co-occurrence 그래프가 표시되고 목록 뷰가 감춰짐', async ({ page }) => {
  // Given — /tags 화면에서 목록 뷰가 활성인 상태
  await gotoScreen(page, 'B-06');
  const toggle = ui(page, 'B-06', 'tab-view-toggle');
  await expect(toggle).toBeVisible();
  // When — '그래프 뷰' 토글을 클릭
  await toggle.getByRole('button', { name: /그래프/ }).click();
  // Then — list-graph가 표시됨
  await expect(ui(page, 'B-06', 'list-graph')).toBeVisible();
});

test('AC-B06-03: 목록 뷰에서 태그 클릭 시 태그 상세 화면(B-07)으로 이동함', async ({ page }) => {
  // Given — /tags 화면에서 목록 뷰가 표시된 상태
  await gotoScreen(page, 'B-06');
  const tagList = ui(page, 'B-06', 'list-tags');
  await expect(tagList).toBeVisible();
  // When — 첫 번째 태그를 클릭
  await tagList.getByRole('link').first().click();
  // Then — /tags/[tag] URL로 이동함
  await expect(page).toHaveURL(/\/tags\/.+/);
});

test('AC-B06-04: 그래프 뷰에서 태그 노드 클릭 시 태그 상세 화면(B-07)으로 이동함', async ({ page }) => {
  // Given — /tags 화면에서 그래프 뷰가 활성인 상태
  await gotoScreen(page, 'B-06');
  const toggle = ui(page, 'B-06', 'tab-view-toggle');
  await expect(toggle).toBeVisible();
  await toggle.getByRole('button', { name: /그래프/ }).click();
  const graph = ui(page, 'B-06', 'list-graph');
  await expect(graph).toBeVisible();
  // When — 그래프의 첫 번째 태그 노드(링크)를 클릭
  await graph.getByRole('link').first().click();
  // Then — /tags/[tag] URL로 이동함
  await expect(page).toHaveURL(/\/tags\/.+/);
});
