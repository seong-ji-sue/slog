# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: specs/e2e/SC-hot-issues-003.spec.js >> SC-hot-issues-003: 존재하지 않음 안내 상태에서 목록으로 돌아가기 링크를 클릭하면 핫이슈 피드 목록 화면(H-01)으로 이동함
- Location: specs/e2e/SC-hot-issues-003.spec.js:6:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByTestId('H-02-text-not-found')
Expected: visible
Timeout: 2500ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 2500ms
  - waiting for getByTestId('H-02-text-not-found')

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
  - main:
    - article:
      - text: Hacker News · 2026.08.02
      - heading "TC 픽스처 이슈 1" [level=1]
      - paragraph: TC 픽스처 요약 1 — 개발 관련 내용
      - link "원문 보기 →":
        - /url: https://tc-fixture.local/hot-issues/list-1
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
  1  | // SC-hot-issues-003.spec.js — E2E: 핫이슈 상세(H-02) 존재하지 않음 안내 → 목록으로 돌아가기 → H-01 이동
  2  | // 소비 계약: prd.contract.json screens[H-02,H-01] + acs[AC-H02-04]
  3  | const { test, expect } = require('@playwright/test');
  4  | const { gotoScreen, ui } = require('../../helpers');
  5  | 
  6  | test('SC-hot-issues-003: 존재하지 않음 안내 상태에서 목록으로 돌아가기 링크를 클릭하면 핫이슈 피드 목록 화면(H-01)으로 이동함', async ({ page }) => {
  7  |   // Given — '이슈를 찾을 수 없습니다' 안내와 목록으로 돌아가기 링크가 표시된 상태
  8  |   await gotoScreen(page, 'H-02');
  9  |   const backLink = ui(page, 'H-02', 'link-back-to-list');
> 10 |   await expect(ui(page, 'H-02', 'text-not-found')).toBeVisible();
     |                                                    ^ Error: expect(locator).toBeVisible() failed
  11 |   await expect(backLink).toBeVisible();
  12 |   // When — 사용자가 목록으로 돌아가기 링크를 클릭함
  13 |   await backLink.click();
  14 |   // Then — 핫이슈 피드 목록 화면(H-01)으로 이동해 목록이 표시됨
  15 |   await expect(ui(page, 'H-01', 'list-hotissues')).toBeVisible();
  16 | });
  17 | 
```