# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: B-04.spec.js >> AC-B04-02: 시리즈 카드 클릭 시 해당 시리즈 글 목록이 표시됨
- Location: B-04.spec.js:13:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByTestId('B-04-list-series')
Expected: visible
Timeout: 2500ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 2500ms
  - waiting for getByTestId('B-04-list-series')

```

```yaml
- heading "Error response" [level=1]
- paragraph: "Error code: 404"
- paragraph: "Message: File not found."
- paragraph: "Error code explanation: 404 - Nothing matches the given URI."
```

# Test source

```ts
  1  | // B-04.spec.js — 시리즈 화면 TC
  2  | // 소비 계약: prd.contract.json screens[B-04] + acs[AC-B04-*]
  3  | const { test, expect } = require('@playwright/test');
  4  | const { gotoScreen, ui } = require('./helpers');
  5  | 
  6  | test('AC-B04-01: /series 진입 시 시리즈 카드 목록이 표시됨', async ({ page }) => {
  7  |   // Given/When — /series 화면 진입
  8  |   await gotoScreen(page, 'B-04');
  9  |   // Then — 계약 key 관측
  10 |   await expect(ui(page, 'B-04', 'list-series')).toBeVisible();
  11 | });
  12 | 
  13 | test('AC-B04-02: 시리즈 카드 클릭 시 해당 시리즈 글 목록이 표시됨', async ({ page }) => {
  14 |   // Given — /series 화면에 시리즈 카드 목록이 표시된 상태
  15 |   await gotoScreen(page, 'B-04');
  16 |   const seriesList = ui(page, 'B-04', 'list-series');
> 17 |   await expect(seriesList).toBeVisible();
     |                            ^ Error: expect(locator).toBeVisible() failed
  18 |   // When — 첫 번째 시리즈 카드를 클릭
  19 |   await seriesList.first().click();
  20 |   // Then — 시리즈 글 목록이 표시됨
  21 |   await expect(ui(page, 'B-04', 'list-series-posts')).toBeVisible();
  22 | });
  23 | 
```