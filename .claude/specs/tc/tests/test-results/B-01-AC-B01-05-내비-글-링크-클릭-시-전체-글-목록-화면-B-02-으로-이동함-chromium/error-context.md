# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: B-01.spec.js >> AC-B01-05: 내비 글 링크 클릭 시 전체 글 목록 화면(B-02)으로 이동함
- Location: B-01.spec.js:64:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByTestId('B-01-nav-main')
Expected: visible
Timeout: 2500ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 2500ms
  - waiting for getByTestId('B-01-nav-main')

```

```yaml
- heading "Error response" [level=1]
- paragraph: "Error code: 404"
- paragraph: "Message: File not found."
- paragraph: "Error code explanation: 404 - Nothing matches the given URI."
```

# Test source

```ts
  1  | // B-01.spec.js — 홈 화면 TC
  2  | // 소비 계약: prd.contract.json screens[B-01] + acs[AC-B01-*]
  3  | const { test, expect } = require('@playwright/test');
  4  | const { gotoScreen, ui } = require('./helpers');
  5  | 
  6  | test('AC-B01-01: 홈 페이지 렌더링 시 주요 구성 요소가 모두 표시됨', async ({ page }) => {
  7  |   // Given/When — 홈 화면 진입
  8  |   await gotoScreen(page, 'B-01');
  9  |   // Then — 계약 key 관측
  10 |   await expect(ui(page, 'B-01', 'logo-slog')).toBeVisible();
  11 |   await expect(ui(page, 'B-01', 'nav-main')).toBeVisible();
  12 |   await expect(ui(page, 'B-01', 'hero-title')).toBeVisible();
  13 |   await expect(ui(page, 'B-01', 'text-bio')).toBeVisible();
  14 |   await expect(ui(page, 'B-01', 'text-stat')).toBeVisible();
  15 |   await expect(ui(page, 'B-01', 'list-feed')).toBeVisible();
  16 |   await expect(ui(page, 'B-01', 'text-footer')).toBeVisible();
  17 | });
  18 | 
  19 | test('AC-B01-01: 홈 로고 텍스트가 SLOG_ 를 포함함', async ({ page }) => {
  20 |   // Given/When
  21 |   await gotoScreen(page, 'B-01');
  22 |   // Then
  23 |   await expect(ui(page, 'B-01', 'logo-slog')).toContainText('SLOG_');
  24 | });
  25 | 
  26 | test('AC-B01-02: 포스트 카드에 마우스를 올리면 형광펜 애니메이션이 적용됨', async ({ page }) => {
  27 |   // Given — 홈 피드에 포스트 카드가 렌더링된 상태
  28 |   await gotoScreen(page, 'B-01');
  29 |   const feed = ui(page, 'B-01', 'list-feed');
  30 |   await expect(feed).toBeVisible();
  31 |   // When — 피드의 첫 번째 카드 위에 마우스를 올림
  32 |   const firstCard = feed.first();
  33 |   await firstCard.hover();
  34 |   // Then — 카드에 hover 클래스 또는 스타일 변화가 감지됨 (data-testid 기반 관측)
  35 |   await expect(firstCard).toBeVisible();
  36 | });
  37 | 
  38 | test('AC-B01-03: 다크모드 토글 클릭 시 페이지 팔레트가 다크로 전환됨', async ({ page }) => {
  39 |   // Given — 홈 화면이 렌더링된 상태
  40 |   await gotoScreen(page, 'B-01');
  41 |   const toggle = ui(page, 'B-01', 'button-darkmode');
  42 |   await expect(toggle).toBeVisible();
  43 |   // When — 다크모드 토글을 클릭
  44 |   await toggle.click();
  45 |   // Then — html 또는 body에 다크 모드 클래스/속성이 부착됨
  46 |   const isDark = await page.evaluate(() => {
  47 |     const el = document.documentElement;
  48 |     return el.classList.contains('dark') || el.getAttribute('data-theme') === 'dark';
  49 |   });
  50 |   expect(isDark).toBe(true);
  51 | });
  52 | 
  53 | test('AC-B01-04: 포스트 카드 클릭 시 글 상세(B-03)로 이동함', async ({ page }) => {
  54 |   // Given — 홈 화면이 렌더링된 상태
  55 |   await gotoScreen(page, 'B-01');
  56 |   const feed = ui(page, 'B-01', 'list-feed');
  57 |   await expect(feed).toBeVisible();
  58 |   // When — 첫 번째 포스트 카드를 클릭
  59 |   await feed.first().click();
  60 |   // Then — URL이 포스트 상세 경로로 변경됨
  61 |   await expect(page).not.toHaveURL('/B-01');
  62 | });
  63 | 
  64 | test('AC-B01-05: 내비 글 링크 클릭 시 전체 글 목록 화면(B-02)으로 이동함', async ({ page }) => {
  65 |   // Given — 홈 화면이 렌더링된 상태
  66 |   await gotoScreen(page, 'B-01');
  67 |   const nav = ui(page, 'B-01', 'nav-main');
> 68 |   await expect(nav).toBeVisible();
     |                     ^ Error: expect(locator).toBeVisible() failed
  69 |   // When — 내비의 '글' 링크를 클릭
  70 |   await nav.getByRole('link', { name: '글' }).click();
  71 |   // Then — /posts 화면으로 이동함
  72 |   await expect(page).toHaveURL(/\/posts/);
  73 | });
  74 | 
  75 | test('AC-B01-06: project 필드가 있는 포스트 카드에 project 배지가 표시됨', async ({ page }) => {
  76 |   // Given — 홈 피드에 project 필드가 있는 포스트가 포함된 상태
  77 |   await gotoScreen(page, 'B-01');
  78 |   await expect(ui(page, 'B-01', 'list-feed')).toBeVisible();
  79 |   // When — 화면이 렌더링됨
  80 |   // Then — badge-project 요소가 화면에 하나 이상 존재함
  81 |   await expect(ui(page, 'B-01', 'badge-project').first()).toBeVisible();
  82 | });
  83 | 
```