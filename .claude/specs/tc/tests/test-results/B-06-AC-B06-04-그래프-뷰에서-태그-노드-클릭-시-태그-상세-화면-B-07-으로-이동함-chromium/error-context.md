# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: B-06.spec.js >> AC-B06-04: 그래프 뷰에서 태그 노드 클릭 시 태그 상세 화면(B-07)으로 이동함
- Location: B-06.spec.js:36:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByTestId('B-06-tab-view-toggle')
Expected: visible
Timeout: 2500ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 2500ms
  - waiting for getByTestId('B-06-tab-view-toggle')

```

```yaml
- heading "Error response" [level=1]
- paragraph: "Error code: 404"
- paragraph: "Message: File not found."
- paragraph: "Error code explanation: 404 - Nothing matches the given URI."
```

# Test source

```ts
  1  | // B-06.spec.js — 태그 인덱스 화면 TC
  2  | // 소비 계약: prd.contract.json screens[B-06] + acs[AC-B06-*]
  3  | const { test, expect } = require('@playwright/test');
  4  | const { gotoScreen, ui } = require('./helpers');
  5  | 
  6  | test('AC-B06-01: /tags 진입 시 뷰 전환 토글과 태그 목록이 기본 목록 뷰로 표시됨', async ({ page }) => {
  7  |   // Given/When — /tags 화면 진입
  8  |   await gotoScreen(page, 'B-06');
  9  |   // Then — tab-view-toggle과 list-tags가 기본 목록 뷰로 표시됨
  10 |   await expect(ui(page, 'B-06', 'tab-view-toggle')).toBeVisible();
  11 |   await expect(ui(page, 'B-06', 'list-tags')).toBeVisible();
  12 | });
  13 | 
  14 | test('AC-B06-02: 그래프 뷰 토글 클릭 시 태그 co-occurrence 그래프가 표시되고 목록 뷰가 감춰짐', async ({ page }) => {
  15 |   // Given — /tags 화면에서 목록 뷰가 활성인 상태
  16 |   await gotoScreen(page, 'B-06');
  17 |   const toggle = ui(page, 'B-06', 'tab-view-toggle');
  18 |   await expect(toggle).toBeVisible();
  19 |   // When — '그래프 뷰' 토글을 클릭
  20 |   await toggle.getByRole('button', { name: /그래프/ }).click();
  21 |   // Then — list-graph가 표시됨
  22 |   await expect(ui(page, 'B-06', 'list-graph')).toBeVisible();
  23 | });
  24 | 
  25 | test('AC-B06-03: 목록 뷰에서 태그 클릭 시 태그 상세 화면(B-07)으로 이동함', async ({ page }) => {
  26 |   // Given — /tags 화면에서 목록 뷰가 표시된 상태
  27 |   await gotoScreen(page, 'B-06');
  28 |   const tagList = ui(page, 'B-06', 'list-tags');
  29 |   await expect(tagList).toBeVisible();
  30 |   // When — 첫 번째 태그를 클릭
  31 |   await tagList.getByRole('link').first().click();
  32 |   // Then — /tags/[tag] URL로 이동함
  33 |   await expect(page).toHaveURL(/\/tags\/.+/);
  34 | });
  35 | 
  36 | test('AC-B06-04: 그래프 뷰에서 태그 노드 클릭 시 태그 상세 화면(B-07)으로 이동함', async ({ page }) => {
  37 |   // Given — /tags 화면에서 그래프 뷰가 활성인 상태
  38 |   await gotoScreen(page, 'B-06');
  39 |   const toggle = ui(page, 'B-06', 'tab-view-toggle');
> 40 |   await expect(toggle).toBeVisible();
     |                        ^ Error: expect(locator).toBeVisible() failed
  41 |   await toggle.getByRole('button', { name: /그래프/ }).click();
  42 |   const graph = ui(page, 'B-06', 'list-graph');
  43 |   await expect(graph).toBeVisible();
  44 |   // When — 그래프의 첫 번째 태그 노드(링크)를 클릭
  45 |   await graph.getByRole('link').first().click();
  46 |   // Then — /tags/[tag] URL로 이동함
  47 |   await expect(page).toHaveURL(/\/tags\/.+/);
  48 | });
  49 | 
```