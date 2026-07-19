# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: B-07.spec.js >> AC-B07-02: 태그별 포스트 카드 클릭 시 글 상세 화면(B-03)으로 이동함
- Location: B-07.spec.js:14:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByTestId('B-07-list-posts-by-tag')
Expected: visible
Timeout: 2500ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 2500ms
  - waiting for getByTestId('B-07-list-posts-by-tag')

```

```yaml
- heading "Error response" [level=1]
- paragraph: "Error code: 404"
- paragraph: "Message: File not found."
- paragraph: "Error code explanation: 404 - Nothing matches the given URI."
```

# Test source

```ts
  1  | // B-07.spec.js — 태그 상세 화면 TC
  2  | // 소비 계약: prd.contract.json screens[B-07] + acs[AC-B07-*]
  3  | const { test, expect } = require('@playwright/test');
  4  | const { gotoScreen, ui } = require('./helpers');
  5  | 
  6  | test('AC-B07-01: /tags/[tag] 진입 시 태그 제목과 포스트 카드 목록이 표시됨', async ({ page }) => {
  7  |   // Given/When — /tags/[tag] 화면 진입
  8  |   await gotoScreen(page, 'B-07');
  9  |   // Then — text-tag-title과 list-posts-by-tag가 표시됨
  10 |   await expect(ui(page, 'B-07', 'text-tag-title')).toBeVisible();
  11 |   await expect(ui(page, 'B-07', 'list-posts-by-tag')).toBeVisible();
  12 | });
  13 | 
  14 | test('AC-B07-02: 태그별 포스트 카드 클릭 시 글 상세 화면(B-03)으로 이동함', async ({ page }) => {
  15 |   // Given — /tags/[tag] 화면에 포스트 카드 목록이 표시된 상태
  16 |   await gotoScreen(page, 'B-07');
  17 |   const postList = ui(page, 'B-07', 'list-posts-by-tag');
> 18 |   await expect(postList).toBeVisible();
     |                          ^ Error: expect(locator).toBeVisible() failed
  19 |   // When — 첫 번째 포스트 카드를 클릭
  20 |   await postList.getByRole('link').first().click();
  21 |   // Then — 글 상세 URL로 이동함
  22 |   await expect(page).not.toHaveURL(/\/tags\//);
  23 | });
  24 | 
```