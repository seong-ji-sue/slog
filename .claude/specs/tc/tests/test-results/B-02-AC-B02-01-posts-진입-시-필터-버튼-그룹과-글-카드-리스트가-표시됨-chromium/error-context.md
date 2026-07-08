# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: B-02.spec.js >> AC-B02-01: /posts 진입 시 필터 버튼 그룹과 글 카드 리스트가 표시됨
- Location: B-02.spec.js:6:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByTestId('B-02-tab-filter')
Expected: visible
Timeout: 2500ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 2500ms
  - waiting for getByTestId('B-02-tab-filter')

```

```yaml
- heading "Error response" [level=1]
- paragraph: "Error code: 404"
- paragraph: "Message: File not found."
- paragraph: "Error code explanation: 404 - Nothing matches the given URI."
```

# Test source

```ts
  1  | // B-02.spec.js — 전체 글 목록 + 태그 필터 화면 TC
  2  | // 소비 계약: prd.contract.json screens[B-02] + acs[AC-B02-*]
  3  | const { test, expect } = require('@playwright/test');
  4  | const { gotoScreen, ui } = require('./helpers');
  5  | 
  6  | test('AC-B02-01: /posts 진입 시 필터 버튼 그룹과 글 카드 리스트가 표시됨', async ({ page }) => {
  7  |   // Given/When — /posts 화면 진입
  8  |   await gotoScreen(page, 'B-02');
  9  |   // Then — 계약 key 관측
> 10 |   await expect(ui(page, 'B-02', 'tab-filter')).toBeVisible();
     |                                                ^ Error: expect(locator).toBeVisible() failed
  11 |   await expect(ui(page, 'B-02', 'list-posts')).toBeVisible();
  12 | });
  13 | 
  14 | test('AC-B02-02: 카테고리 필터 클릭 시 해당 카테고리 글만 노출되고 버튼이 활성 상태가 됨', async ({ page }) => {
  15 |   // Given — /posts 화면에 전체 글이 표시된 상태
  16 |   await gotoScreen(page, 'B-02');
  17 |   const filter = ui(page, 'B-02', 'tab-filter');
  18 |   await expect(filter).toBeVisible();
  19 |   // When — '트러블슈팅' 필터 버튼을 클릭
  20 |   await filter.getByRole('button', { name: '트러블슈팅' }).click();
  21 |   // Then — 필터 버튼이 활성 상태(aria-selected 또는 data-active)로 표시됨
  22 |   const activeBtn = filter.getByRole('button', { name: '트러블슈팅' });
  23 |   const isActive = await activeBtn.evaluate(el =>
  24 |     el.getAttribute('aria-selected') === 'true' ||
  25 |     el.getAttribute('data-active') === 'true' ||
  26 |     el.classList.contains('active')
  27 |   );
  28 |   expect(isActive).toBe(true);
  29 |   // 글 목록이 여전히 존재함
  30 |   await expect(ui(page, 'B-02', 'list-posts')).toBeVisible();
  31 | });
  32 | 
  33 | test('AC-B02-03: 전체 필터 클릭 시 모든 글이 복원됨', async ({ page }) => {
  34 |   // Given — 특정 카테고리 필터가 활성인 상태
  35 |   await gotoScreen(page, 'B-02');
  36 |   const filter = ui(page, 'B-02', 'tab-filter');
  37 |   await expect(filter).toBeVisible();
  38 |   await filter.getByRole('button', { name: '트러블슈팅' }).click();
  39 |   // When — '전체' 필터 버튼을 클릭
  40 |   await filter.getByRole('button', { name: '전체' }).click();
  41 |   // Then — 글 카드 목록이 전체 복원 상태로 표시됨
  42 |   await expect(ui(page, 'B-02', 'list-posts')).toBeVisible();
  43 |   const allActive = filter.getByRole('button', { name: '전체' });
  44 |   const isActive = await allActive.evaluate(el =>
  45 |     el.getAttribute('aria-selected') === 'true' ||
  46 |     el.getAttribute('data-active') === 'true' ||
  47 |     el.classList.contains('active')
  48 |   );
  49 |   expect(isActive).toBe(true);
  50 | });
  51 | 
```