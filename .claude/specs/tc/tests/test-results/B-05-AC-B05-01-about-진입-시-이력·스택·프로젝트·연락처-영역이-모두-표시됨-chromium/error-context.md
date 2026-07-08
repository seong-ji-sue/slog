# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: B-05.spec.js >> AC-B05-01: /about 진입 시 이력·스택·프로젝트·연락처 영역이 모두 표시됨
- Location: B-05.spec.js:6:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByTestId('B-05-text-bio-detail')
Expected: visible
Timeout: 2500ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 2500ms
  - waiting for getByTestId('B-05-text-bio-detail')

```

```yaml
- heading "Error response" [level=1]
- paragraph: "Error code: 404"
- paragraph: "Message: File not found."
- paragraph: "Error code explanation: 404 - Nothing matches the given URI."
```

# Test source

```ts
  1  | // B-05.spec.js — 소개(About) 화면 TC
  2  | // 소비 계약: prd.contract.json screens[B-05] + acs[AC-B05-*]
  3  | const { test, expect } = require('@playwright/test');
  4  | const { gotoScreen, ui } = require('./helpers');
  5  | 
  6  | test('AC-B05-01: /about 진입 시 이력·스택·프로젝트·연락처 영역이 모두 표시됨', async ({ page }) => {
  7  |   // Given/When — /about 화면 진입
  8  |   await gotoScreen(page, 'B-05');
  9  |   // Then — 계약 key 관측 (U-002: 실제 콘텐츠 미확정 — 영역 존재 여부만 단언)
> 10 |   await expect(ui(page, 'B-05', 'text-bio-detail')).toBeVisible();
     |                                                     ^ Error: expect(locator).toBeVisible() failed
  11 |   await expect(ui(page, 'B-05', 'list-stack')).toBeVisible();
  12 |   await expect(ui(page, 'B-05', 'list-projects')).toBeVisible();
  13 |   await expect(ui(page, 'B-05', 'list-contact')).toBeVisible();
  14 | });
  15 | 
  16 | test('AC-B05-02: 프로젝트 링크 클릭 시 새 탭에서 외부 URL이 열림', async ({ page, context }) => {
  17 |   // Given — /about 화면에서 프로젝트 링크 영역이 표시된 상태
  18 |   await gotoScreen(page, 'B-05');
  19 |   const projectsList = ui(page, 'B-05', 'list-projects');
  20 |   await expect(projectsList).toBeVisible();
  21 |   // When — 첫 번째 프로젝트 링크를 클릭 (새 탭 이벤트 수신)
  22 |   const [newPage] = await Promise.all([
  23 |     context.waitForEvent('page'),
  24 |     projectsList.getByRole('link').first().click(),
  25 |   ]);
  26 |   // Then — 새 탭이 열림
  27 |   expect(newPage).toBeTruthy();
  28 |   await newPage.close();
  29 | });
  30 | 
```