const { test, expect } = require('@playwright/test');
const { gotoScreen, ui } = require('./helpers');

test('STRUCT-B-01: 계약 컴포넌트가 렌더링된다', async ({ page }) => {
  await gotoScreen(page, 'B-01');
  await expect(ui(page, 'B-01', 'logo-slog')).toBeVisible();
  await expect(ui(page, 'B-01', 'nav-main')).toBeVisible();
  await expect(ui(page, 'B-01', 'button-darkmode')).toBeVisible();
  await expect(ui(page, 'B-01', 'hero-title')).toBeVisible();
  await expect(ui(page, 'B-01', 'text-bio')).toBeVisible();
  await expect(ui(page, 'B-01', 'text-stat')).toBeVisible();
  await expect(ui(page, 'B-01', 'text-footer')).toBeVisible();
});

test('STRUCT-B-02: 계약 컴포넌트가 렌더링된다', async ({ page }) => {
  await gotoScreen(page, 'B-02');
  await expect(ui(page, 'B-02', 'tab-filter')).toBeVisible();
  await expect(ui(page, 'B-02', 'list-posts')).toBeVisible();
});

test('STRUCT-B-03: 계약 컴포넌트가 렌더링된다', async ({ page }) => {
  await gotoScreen(page, 'B-03');
  await expect(ui(page, 'B-03', 'text-post-meta')).toBeVisible();
  await expect(ui(page, 'B-03', 'text-post-title')).toBeVisible();
  await expect(ui(page, 'B-03', 'text-tldr')).toBeVisible();
  await expect(ui(page, 'B-03', 'list-keywords')).toBeVisible();
  await expect(ui(page, 'B-03', 'text-body')).toBeVisible();
  await expect(ui(page, 'B-03', 'list-refs')).toBeVisible();
  await expect(ui(page, 'B-03', 'nav-series')).toBeVisible();
});

test('STRUCT-B-05: 계약 컴포넌트가 렌더링된다', async ({ page }) => {
  await gotoScreen(page, 'B-05');
  await expect(ui(page, 'B-05', 'text-bio-detail')).toBeVisible();
  await expect(ui(page, 'B-05', 'list-stack')).toBeVisible();
  await expect(ui(page, 'B-05', 'list-projects')).toBeVisible();
  await expect(ui(page, 'B-05', 'list-contact')).toBeVisible();
});

test('STRUCT-B-06: 계약 컴포넌트가 렌더링된다', async ({ page }) => {
  await gotoScreen(page, 'B-06');
  await expect(ui(page, 'B-06', 'tab-view-toggle')).toBeVisible();
  await expect(ui(page, 'B-06', 'list-tags')).toBeVisible();
});

test('STRUCT-B-07: 계약 컴포넌트가 렌더링된다', async ({ page }) => {
  await gotoScreen(page, 'B-07');
  await expect(ui(page, 'B-07', 'text-tag-title')).toBeVisible();
  await expect(ui(page, 'B-07', 'list-posts-by-tag')).toBeVisible();
});

test('STRUCT-H-01: 계약 컴포넌트가 렌더링된다', async ({ page }) => {
  await gotoScreen(page, 'H-01');
  await expect(ui(page, 'H-01', 'search-hotissues')).toBeVisible();
  await expect(ui(page, 'H-01', 'tab-source')).toBeVisible();
  await expect(ui(page, 'H-01', 'list-hotissues')).toBeVisible();
  const conditionalKeys = ["text-empty-search", "button-reset-filter", "list-pagination", "text-empty-all", "text-error-list", "button-retry-list"];
  await expect(async () => {
    const visibleFlags = await Promise.all(conditionalKeys.map((k) => ui(page, 'H-01', k).isVisible()));
    expect(visibleFlags.some(Boolean)).toBe(true);
  }).toPass();
});

test('STRUCT-H-02: 계약 컴포넌트가 렌더링된다', async ({ page }) => {
  await gotoScreen(page, 'H-02');
  await expect(ui(page, 'H-02', 'text-title')).toBeVisible();
  await expect(ui(page, 'H-02', 'text-source')).toBeVisible();
  await expect(ui(page, 'H-02', 'text-collected-date')).toBeVisible();
  const conditionalKeysReplace0 = ["text-summary", "text-summary-error"];
  await expect(async () => {
    const visibleFlags = await Promise.all(conditionalKeysReplace0.map((k) => ui(page, 'H-02', k).isVisible()));
    expect(visibleFlags.some(Boolean)).toBe(true);
  }).toPass();
});
