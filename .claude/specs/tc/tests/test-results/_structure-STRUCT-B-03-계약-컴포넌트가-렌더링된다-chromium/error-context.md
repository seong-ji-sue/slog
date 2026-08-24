# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: _structure.spec.js >> STRUCT-B-03: 계약 컴포넌트가 렌더링된다
- Location: _structure.spec.js:21:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByTestId('B-03-text-post-meta')
Expected: visible
Timeout: 2500ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 2500ms
  - waiting for getByTestId('B-03-text-post-meta')

```

```yaml
- banner:
  - link "SLOG 홈으로":
    - /url: /
    - text: SLOG_
  - navigation "주 내비게이션":
    - link "글":
      - /url: /posts
    - link "핫이슈":
      - /url: /hot-issues
    - link "태그":
      - /url: /tags
    - link "소개":
      - /url: /about
    - link "RSS":
      - /url: "#"
  - button "다크 모드로 전환": DARK
- main:
  - paragraph: 404 — NOT FOUND
  - heading "존재하지 않는 기록입니다." [level=1]
  - link "전체 글 목록으로 →":
    - /url: /posts
- contentinfo:
  - text: © 2026 Zibu — 기록으로 증명
  - link "GitHub":
    - /url: https://github.com/seong-ji-sue
  - text: ·
  - link "RSS":
    - /url: "#"
  - text: ·
  - link "Tistory 아카이브":
    - /url: https://zibu-story.tistory.com
- alert
```

# Test source

```ts
  1  | const { test, expect } = require('@playwright/test');
  2  | const { gotoScreen, ui } = require('./helpers');
  3  | 
  4  | test('STRUCT-B-01: 계약 컴포넌트가 렌더링된다', async ({ page }) => {
  5  |   await gotoScreen(page, 'B-01');
  6  |   await expect(ui(page, 'B-01', 'logo-slog')).toBeVisible();
  7  |   await expect(ui(page, 'B-01', 'nav-main')).toBeVisible();
  8  |   await expect(ui(page, 'B-01', 'button-darkmode')).toBeVisible();
  9  |   await expect(ui(page, 'B-01', 'hero-title')).toBeVisible();
  10 |   await expect(ui(page, 'B-01', 'text-bio')).toBeVisible();
  11 |   await expect(ui(page, 'B-01', 'text-stat')).toBeVisible();
  12 |   await expect(ui(page, 'B-01', 'text-footer')).toBeVisible();
  13 | });
  14 | 
  15 | test('STRUCT-B-02: 계약 컴포넌트가 렌더링된다', async ({ page }) => {
  16 |   await gotoScreen(page, 'B-02');
  17 |   await expect(ui(page, 'B-02', 'tab-filter')).toBeVisible();
  18 |   await expect(ui(page, 'B-02', 'list-posts')).toBeVisible();
  19 | });
  20 | 
  21 | test('STRUCT-B-03: 계약 컴포넌트가 렌더링된다', async ({ page }) => {
  22 |   await gotoScreen(page, 'B-03');
> 23 |   await expect(ui(page, 'B-03', 'text-post-meta')).toBeVisible();
     |                                                    ^ Error: expect(locator).toBeVisible() failed
  24 |   await expect(ui(page, 'B-03', 'text-post-title')).toBeVisible();
  25 |   await expect(ui(page, 'B-03', 'text-tldr')).toBeVisible();
  26 |   await expect(ui(page, 'B-03', 'list-keywords')).toBeVisible();
  27 |   await expect(ui(page, 'B-03', 'text-body')).toBeVisible();
  28 |   await expect(ui(page, 'B-03', 'list-refs')).toBeVisible();
  29 |   await expect(ui(page, 'B-03', 'nav-series')).toBeVisible();
  30 | });
  31 | 
  32 | test('STRUCT-B-05: 계약 컴포넌트가 렌더링된다', async ({ page }) => {
  33 |   await gotoScreen(page, 'B-05');
  34 |   await expect(ui(page, 'B-05', 'text-bio-detail')).toBeVisible();
  35 |   await expect(ui(page, 'B-05', 'list-stack')).toBeVisible();
  36 |   await expect(ui(page, 'B-05', 'list-projects')).toBeVisible();
  37 |   await expect(ui(page, 'B-05', 'list-contact')).toBeVisible();
  38 | });
  39 | 
  40 | test('STRUCT-B-06: 계약 컴포넌트가 렌더링된다', async ({ page }) => {
  41 |   await gotoScreen(page, 'B-06');
  42 |   await expect(ui(page, 'B-06', 'tab-view-toggle')).toBeVisible();
  43 |   await expect(ui(page, 'B-06', 'list-tags')).toBeVisible();
  44 | });
  45 | 
  46 | test('STRUCT-B-07: 계약 컴포넌트가 렌더링된다', async ({ page }) => {
  47 |   await gotoScreen(page, 'B-07');
  48 |   await expect(ui(page, 'B-07', 'text-tag-title')).toBeVisible();
  49 |   await expect(ui(page, 'B-07', 'list-posts-by-tag')).toBeVisible();
  50 | });
  51 | 
  52 | test('STRUCT-H-01: 계약 컴포넌트가 렌더링된다', async ({ page }) => {
  53 |   await gotoScreen(page, 'H-01');
  54 |   await expect(ui(page, 'H-01', 'search-hotissues')).toBeVisible();
  55 |   await expect(ui(page, 'H-01', 'tab-source')).toBeVisible();
  56 |   await expect(ui(page, 'H-01', 'list-hotissues')).toBeVisible();
  57 |   const conditionalKeys = ["text-empty-search", "button-reset-filter", "list-pagination", "text-empty-all", "text-error-list", "button-retry-list"];
  58 |   await expect(async () => {
  59 |     const visibleFlags = await Promise.all(conditionalKeys.map((k) => ui(page, 'H-01', k).isVisible()));
  60 |     expect(visibleFlags.some(Boolean)).toBe(true);
  61 |   }).toPass();
  62 | });
  63 | 
  64 | test('STRUCT-H-02: 계약 컴포넌트가 렌더링된다', async ({ page }) => {
  65 |   await gotoScreen(page, 'H-02');
  66 |   await expect(ui(page, 'H-02', 'text-title')).toBeVisible();
  67 |   await expect(ui(page, 'H-02', 'text-source')).toBeVisible();
  68 |   await expect(ui(page, 'H-02', 'text-collected-date')).toBeVisible();
  69 |   const conditionalKeysReplace0 = ["text-summary", "text-summary-error"];
  70 |   await expect(async () => {
  71 |     const visibleFlags = await Promise.all(conditionalKeysReplace0.map((k) => ui(page, 'H-02', k).isVisible()));
  72 |     expect(visibleFlags.some(Boolean)).toBe(true);
  73 |   }).toPass();
  74 | });
  75 | 
```