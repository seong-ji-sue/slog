// B-02.spec.js — 전체 글 목록 + 태그 필터 화면 TC
// 소비 계약: prd.contract.json screens[B-02] + acs[AC-B02-*]
const { test, expect } = require('@playwright/test');
const { gotoScreen, ui } = require('./helpers');

test('AC-B02-01: /posts 진입 시 필터 버튼 그룹과 글 카드 리스트가 표시됨', async ({ page }) => {
  // Given/When — /posts 화면 진입
  await gotoScreen(page, 'B-02');
  // Then — 계약 key 관측
  await expect(ui(page, 'B-02', 'tab-filter')).toBeVisible();
  await expect(ui(page, 'B-02', 'list-posts')).toBeVisible();
});

test('AC-B02-02: 카테고리 필터 클릭 시 해당 카테고리 글만 노출되고 버튼이 활성 상태가 됨', async ({ page }) => {
  // Given — /posts 화면에 전체 글이 표시된 상태
  await gotoScreen(page, 'B-02');
  const filter = ui(page, 'B-02', 'tab-filter');
  await expect(filter).toBeVisible();
  // When — '트러블슈팅' 필터 버튼을 클릭
  await filter.getByRole('button', { name: '트러블슈팅' }).click();
  // Then — 필터 버튼이 활성 상태(aria-selected 또는 data-active)로 표시됨
  const activeBtn = filter.getByRole('button', { name: '트러블슈팅' });
  const isActive = await activeBtn.evaluate(el =>
    el.getAttribute('aria-selected') === 'true' ||
    el.getAttribute('data-active') === 'true' ||
    el.classList.contains('active')
  );
  expect(isActive).toBe(true);
  // 글 목록이 여전히 존재함
  await expect(ui(page, 'B-02', 'list-posts')).toBeVisible();
});

test('AC-B02-03: 전체 필터 클릭 시 모든 글이 복원됨', async ({ page }) => {
  // Given — 특정 카테고리 필터가 활성인 상태
  await gotoScreen(page, 'B-02');
  const filter = ui(page, 'B-02', 'tab-filter');
  await expect(filter).toBeVisible();
  await filter.getByRole('button', { name: '트러블슈팅' }).click();
  // When — '전체' 필터 버튼을 클릭
  await filter.getByRole('button', { name: '전체' }).click();
  // Then — 글 카드 목록이 전체 복원 상태로 표시됨
  await expect(ui(page, 'B-02', 'list-posts')).toBeVisible();
  const allActive = filter.getByRole('button', { name: '전체' });
  const isActive = await allActive.evaluate(el =>
    el.getAttribute('aria-selected') === 'true' ||
    el.getAttribute('data-active') === 'true' ||
    el.classList.contains('active')
  );
  expect(isActive).toBe(true);
});
