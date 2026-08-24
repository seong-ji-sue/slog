# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: B-03.spec.js >> AC-B03-01: TL;DR 블록이 TL;DR 텍스트를 포함함
- Location: B-03.spec.js:19:1

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: getByTestId('B-03-text-tldr')
Expected substring: "TL;DR"
Timeout: 2500ms
Error: element(s) not found

Call log:
  - Expect "toContainText" with timeout 2500ms
  - waiting for getByTestId('B-03-text-tldr')

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
  1  | // B-03.spec.js — 글 상세 화면 TC
  2  | // 소비 계약: prd.contract.json screens[B-03] + acs[AC-B03-*]
  3  | const { test, expect } = require('@playwright/test');
  4  | const { gotoScreen, ui } = require('./helpers');
  5  | 
  6  | test('AC-B03-01: 글 상세 진입 시 포스트 구성 요소가 모두 표시됨', async ({ page }) => {
  7  |   // Given/When — 글 상세 화면 진입
  8  |   await gotoScreen(page, 'B-03');
  9  |   // Then — 계약 key 관측
  10 |   await expect(ui(page, 'B-03', 'text-post-meta')).toBeVisible();
  11 |   await expect(ui(page, 'B-03', 'text-post-title')).toBeVisible();
  12 |   await expect(ui(page, 'B-03', 'text-tldr')).toBeVisible();
  13 |   await expect(ui(page, 'B-03', 'list-keywords')).toBeVisible();
  14 |   await expect(ui(page, 'B-03', 'text-body')).toBeVisible();
  15 |   await expect(ui(page, 'B-03', 'list-refs')).toBeVisible();
  16 |   await expect(ui(page, 'B-03', 'nav-series')).toBeVisible();
  17 | });
  18 | 
  19 | test('AC-B03-01: TL;DR 블록이 TL;DR 텍스트를 포함함', async ({ page }) => {
  20 |   // Given/When
  21 |   await gotoScreen(page, 'B-03');
  22 |   // Then
> 23 |   await expect(ui(page, 'B-03', 'text-tldr')).toContainText('TL;DR');
     |                                               ^ Error: expect(locator).toContainText(expected) failed
  24 | });
  25 | 
  26 | test('AC-B03-02: 시리즈 이전 글 카드 클릭 시 이전 글 상세로 이동함', async ({ page }) => {
  27 |   // Given — 글 상세에서 이전 글이 존재하는 상태 (U-001: 경계 처리 미확정 — 이전 글 존재 케이스만 검증)
  28 |   await gotoScreen(page, 'B-03');
  29 |   const seriesNav = ui(page, 'B-03', 'nav-series');
  30 |   await expect(seriesNav).toBeVisible();
  31 |   // When — 이전 글 링크/버튼 클릭
  32 |   const prevLink = seriesNav.getByRole('link', { name: /이전/ });
  33 |   await expect(prevLink).toBeVisible();
  34 |   const currentUrl = page.url();
  35 |   await prevLink.click();
  36 |   // Then — URL이 변경됨(이전 글 상세)
  37 |   await expect(page).not.toHaveURL(currentUrl);
  38 | });
  39 | 
  40 | test('AC-B03-03: 시리즈 다음 글 카드 클릭 시 다음 글 상세로 이동함', async ({ page }) => {
  41 |   // Given — 글 상세에서 다음 글이 존재하는 상태 (U-001: 경계 처리 미확정 — 다음 글 존재 케이스만 검증)
  42 |   await gotoScreen(page, 'B-03');
  43 |   const seriesNav = ui(page, 'B-03', 'nav-series');
  44 |   await expect(seriesNav).toBeVisible();
  45 |   // When — 다음 글 링크/버튼 클릭
  46 |   const nextLink = seriesNav.getByRole('link', { name: /다음/ });
  47 |   await expect(nextLink).toBeVisible();
  48 |   const currentUrl = page.url();
  49 |   await nextLink.click();
  50 |   // Then — URL이 변경됨(다음 글 상세)
  51 |   await expect(page).not.toHaveURL(currentUrl);
  52 | });
  53 | 
  54 | test('AC-B03-04: project 필드가 있는 글 상세 헤더 메타 영역에 project 배지가 표시됨', async ({ page }) => {
  55 |   // Given — project 필드가 있는 글 상세 페이지에 진입한 상태
  56 |   await gotoScreen(page, 'B-03');
  57 |   await expect(ui(page, 'B-03', 'text-post-meta')).toBeVisible();
  58 |   // When — 화면이 렌더링됨
  59 |   // Then — badge-project 요소가 포스트 헤더 메타 영역에 표시됨
  60 |   await expect(ui(page, 'B-03', 'badge-project')).toBeVisible();
  61 | });
  62 | 
```