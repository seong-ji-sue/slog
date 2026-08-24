# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: specs/e2e/SC-hot-issues-002.spec.js >> SC-hot-issues-002: 카드를 클릭하면 해당 이슈의 상세 화면(H-02)으로 이동함
- Location: specs/e2e/SC-hot-issues-002.spec.js:6:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByTestId('H-02-text-title')
Expected: visible
Timeout: 2500ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 2500ms
  - waiting for getByTestId('H-02-text-title')

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
    - heading "핫이슈" [level=1]
    - searchbox "핫이슈 검색"
    - group "출처 필터":
      - button "전체"
      - button "Hacker News"
      - button "GeekNews"
      - button "Dev.to"
    - link "Hacker News TC 픽스처 이슈 1 TC 픽스처 요약 1 — 개발 관련 내용 2026.08.02":
      - /url: /hot-issues/1
      - text: Hacker News
      - heading "TC 픽스처 이슈 1" [level=3]
      - paragraph: TC 픽스처 요약 1 — 개발 관련 내용
      - text: 2026.08.02
    - link "GeekNews TC 픽스처 이슈 2 TC 픽스처 요약 2 — 개발 관련 내용 2026.08.02":
      - /url: /hot-issues/3
      - text: GeekNews
      - heading "TC 픽스처 이슈 2" [level=3]
      - paragraph: TC 픽스처 요약 2 — 개발 관련 내용
      - text: 2026.08.02
    - link "Dev.to TC 픽스처 이슈 3 TC 픽스처 요약 3 — 개발 관련 내용 2026.08.02":
      - /url: /hot-issues/5
      - text: Dev.to
      - heading "TC 픽스처 이슈 3" [level=3]
      - paragraph: TC 픽스처 요약 3 — 개발 관련 내용
      - text: 2026.08.02
    - link "Hacker News TC 픽스처 이슈 4 TC 픽스처 요약 4 — 개발 관련 내용 2026.08.02":
      - /url: /hot-issues/7
      - text: Hacker News
      - heading "TC 픽스처 이슈 4" [level=3]
      - paragraph: TC 픽스처 요약 4 — 개발 관련 내용
      - text: 2026.08.02
    - link "GeekNews TC 픽스처 이슈 5 TC 픽스처 요약 5 — 개발 관련 내용 2026.08.02":
      - /url: /hot-issues/9
      - text: GeekNews
      - heading "TC 픽스처 이슈 5" [level=3]
      - paragraph: TC 픽스처 요약 5 — 개발 관련 내용
      - text: 2026.08.02
    - link "Dev.to TC 픽스처 이슈 6 TC 픽스처 요약 6 — 개발 관련 내용 2026.08.02":
      - /url: /hot-issues/13
      - text: Dev.to
      - heading "TC 픽스처 이슈 6" [level=3]
      - paragraph: TC 픽스처 요약 6 — 개발 관련 내용
      - text: 2026.08.02
    - link "Hacker News TC 픽스처 이슈 7 TC 픽스처 요약 7 — 개발 관련 내용 2026.08.02":
      - /url: /hot-issues/16
      - text: Hacker News
      - heading "TC 픽스처 이슈 7" [level=3]
      - paragraph: TC 픽스처 요약 7 — 개발 관련 내용
      - text: 2026.08.02
    - link "GeekNews TC 픽스처 이슈 8 TC 픽스처 요약 8 — 개발 관련 내용 2026.08.02":
      - /url: /hot-issues/19
      - text: GeekNews
      - heading "TC 픽스처 이슈 8" [level=3]
      - paragraph: TC 픽스처 요약 8 — 개발 관련 내용
      - text: 2026.08.02
    - link "Dev.to TC 픽스처 이슈 9 TC 픽스처 요약 9 — 개발 관련 내용 2026.08.02":
      - /url: /hot-issues/22
      - text: Dev.to
      - heading "TC 픽스처 이슈 9" [level=3]
      - paragraph: TC 픽스처 요약 9 — 개발 관련 내용
      - text: 2026.08.02
    - link "Hacker News TC 픽스처 이슈 10 TC 픽스처 요약 10 — 개발 관련 내용 2026.08.02":
      - /url: /hot-issues/26
      - text: Hacker News
      - heading "TC 픽스처 이슈 10" [level=3]
      - paragraph: TC 픽스처 요약 10 — 개발 관련 내용
      - text: 2026.08.02
    - link "GeekNews TC 픽스처 이슈 11 TC 픽스처 요약 11 — 개발 관련 내용 2026.08.02":
      - /url: /hot-issues/30
      - text: GeekNews
      - heading "TC 픽스처 이슈 11" [level=3]
      - paragraph: TC 픽스처 요약 11 — 개발 관련 내용
      - text: 2026.08.02
    - link "Dev.to TC 픽스처 이슈 12 TC 픽스처 요약 12 — 개발 관련 내용 2026.08.02":
      - /url: /hot-issues/34
      - text: Dev.to
      - heading "TC 픽스처 이슈 12" [level=3]
      - paragraph: TC 픽스처 요약 12 — 개발 관련 내용
      - text: 2026.08.02
    - link "Hacker News TC 픽스처 이슈 13 TC 픽스처 요약 13 — 개발 관련 내용 2026.08.02":
      - /url: /hot-issues/38
      - text: Hacker News
      - heading "TC 픽스처 이슈 13" [level=3]
      - paragraph: TC 픽스처 요약 13 — 개발 관련 내용
      - text: 2026.08.02
    - link "GeekNews TC 픽스처 이슈 14 TC 픽스처 요약 14 — 개발 관련 내용 2026.08.02":
      - /url: /hot-issues/42
      - text: GeekNews
      - heading "TC 픽스처 이슈 14" [level=3]
      - paragraph: TC 픽스처 요약 14 — 개발 관련 내용
      - text: 2026.08.02
    - link "Dev.to TC 픽스처 이슈 15 TC 픽스처 요약 15 — 개발 관련 내용 2026.08.02":
      - /url: /hot-issues/46
      - text: Dev.to
      - heading "TC 픽스처 이슈 15" [level=3]
      - paragraph: TC 픽스처 요약 15 — 개발 관련 내용
      - text: 2026.08.02
    - link "Hacker News TC 픽스처 이슈 16 TC 픽스처 요약 16 — 개발 관련 내용 2026.08.02":
      - /url: /hot-issues/50
      - text: Hacker News
      - heading "TC 픽스처 이슈 16" [level=3]
      - paragraph: TC 픽스처 요약 16 — 개발 관련 내용
      - text: 2026.08.02
    - link "GeekNews TC 픽스처 이슈 17 TC 픽스처 요약 17 — 개발 관련 내용 2026.08.02":
      - /url: /hot-issues/54
      - text: GeekNews
      - heading "TC 픽스처 이슈 17" [level=3]
      - paragraph: TC 픽스처 요약 17 — 개발 관련 내용
      - text: 2026.08.02
    - link "Dev.to TC 픽스처 이슈 18 TC 픽스처 요약 18 — 개발 관련 내용 2026.08.02":
      - /url: /hot-issues/58
      - text: Dev.to
      - heading "TC 픽스처 이슈 18" [level=3]
      - paragraph: TC 픽스처 요약 18 — 개발 관련 내용
      - text: 2026.08.02
    - link "Hacker News TC 픽스처 이슈 19 TC 픽스처 요약 19 — 개발 관련 내용 2026.08.02":
      - /url: /hot-issues/62
      - text: Hacker News
      - heading "TC 픽스처 이슈 19" [level=3]
      - paragraph: TC 픽스처 요약 19 — 개발 관련 내용
      - text: 2026.08.02
    - link "GeekNews TC 픽스처 이슈 20 TC 픽스처 요약 20 — 개발 관련 내용 2026.08.02":
      - /url: /hot-issues/66
      - text: GeekNews
      - heading "TC 픽스처 이슈 20" [level=3]
      - paragraph: TC 픽스처 요약 20 — 개발 관련 내용
      - text: 2026.08.02
    - navigation "페이지 네비게이션":
      - button "이전 5페이지" [disabled]: 이전
      - button "1페이지": "1"
      - button "2페이지": "2"
      - button "3페이지": "3"
      - button "4페이지": "4"
      - button "다음 5페이지": 다음
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
  1  | // SC-hot-issues-002.spec.js — E2E: 핫이슈 피드 목록(H-01) 카드 클릭 → 핫이슈 상세(H-02) 이동
  2  | // 소비 계약: prd.contract.json screens[H-01,H-02] + acs[AC-H01-07]
  3  | const { test, expect } = require('@playwright/test');
  4  | const { gotoScreen, ui } = require('../../helpers');
  5  | 
  6  | test('SC-hot-issues-002: 카드를 클릭하면 해당 이슈의 상세 화면(H-02)으로 이동함', async ({ page }) => {
  7  |   // Given — 핫이슈 피드 목록 화면에 카드가 표시된 상태
  8  |   await gotoScreen(page, 'H-01');
  9  |   const list = ui(page, 'H-01', 'list-hotissues');
  10 |   await expect(list).toBeVisible();
  11 |   // When — 사용자가 카드를 클릭함
  12 |   await list.first().click();
  13 |   // Then — 핫이슈 상세 화면(H-02)으로 이동해 제목이 표시됨
> 14 |   await expect(ui(page, 'H-02', 'text-title')).toBeVisible();
     |                                                ^ Error: expect(locator).toBeVisible() failed
  15 | });
  16 | 
```