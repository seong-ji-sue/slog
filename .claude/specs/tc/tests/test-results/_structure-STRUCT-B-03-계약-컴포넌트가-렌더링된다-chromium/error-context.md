# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: _structure.spec.js >> STRUCT-B-03: 계약 컴포넌트가 렌더링된다
- Location: _structure.spec.js:22:1

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
- heading "Error response" [level=1]
- paragraph: "Error code: 404"
- paragraph: "Message: File not found."
- paragraph: "Error code explanation: 404 - Nothing matches the given URI."
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
  12 |   await expect(ui(page, 'B-01', 'list-feed')).toBeVisible();
  13 |   await expect(ui(page, 'B-01', 'text-footer')).toBeVisible();
  14 | });
  15 | 
  16 | test('STRUCT-B-02: 계약 컴포넌트가 렌더링된다', async ({ page }) => {
  17 |   await gotoScreen(page, 'B-02');
  18 |   await expect(ui(page, 'B-02', 'tab-filter')).toBeVisible();
  19 |   await expect(ui(page, 'B-02', 'list-posts')).toBeVisible();
  20 | });
  21 | 
  22 | test('STRUCT-B-03: 계약 컴포넌트가 렌더링된다', async ({ page }) => {
  23 |   await gotoScreen(page, 'B-03');
> 24 |   await expect(ui(page, 'B-03', 'text-post-meta')).toBeVisible();
     |                                                    ^ Error: expect(locator).toBeVisible() failed
  25 |   await expect(ui(page, 'B-03', 'text-post-title')).toBeVisible();
  26 |   await expect(ui(page, 'B-03', 'text-tldr')).toBeVisible();
  27 |   await expect(ui(page, 'B-03', 'list-keywords')).toBeVisible();
  28 |   await expect(ui(page, 'B-03', 'text-body')).toBeVisible();
  29 |   await expect(ui(page, 'B-03', 'list-refs')).toBeVisible();
  30 |   await expect(ui(page, 'B-03', 'nav-series')).toBeVisible();
  31 | });
  32 | 
  33 | test('STRUCT-B-04: 계약 컴포넌트가 렌더링된다', async ({ page }) => {
  34 |   await gotoScreen(page, 'B-04');
  35 |   await expect(ui(page, 'B-04', 'list-series')).toBeVisible();
  36 |   await expect(ui(page, 'B-04', 'list-series-posts')).toBeVisible();
  37 | });
  38 | 
  39 | test('STRUCT-B-05: 계약 컴포넌트가 렌더링된다', async ({ page }) => {
  40 |   await gotoScreen(page, 'B-05');
  41 |   await expect(ui(page, 'B-05', 'text-bio-detail')).toBeVisible();
  42 |   await expect(ui(page, 'B-05', 'list-stack')).toBeVisible();
  43 |   await expect(ui(page, 'B-05', 'list-projects')).toBeVisible();
  44 |   await expect(ui(page, 'B-05', 'list-contact')).toBeVisible();
  45 | });
  46 | 
  47 | test('STRUCT-B-06: 계약 컴포넌트가 렌더링된다', async ({ page }) => {
  48 |   await gotoScreen(page, 'B-06');
  49 |   await expect(ui(page, 'B-06', 'tab-view-toggle')).toBeVisible();
  50 |   await expect(ui(page, 'B-06', 'list-tags')).toBeVisible();
  51 |   await expect(ui(page, 'B-06', 'list-graph')).toBeVisible();
  52 | });
  53 | 
  54 | test('STRUCT-B-07: 계약 컴포넌트가 렌더링된다', async ({ page }) => {
  55 |   await gotoScreen(page, 'B-07');
  56 |   await expect(ui(page, 'B-07', 'text-tag-title')).toBeVisible();
  57 |   await expect(ui(page, 'B-07', 'list-posts-by-tag')).toBeVisible();
  58 | });
  59 | 
```