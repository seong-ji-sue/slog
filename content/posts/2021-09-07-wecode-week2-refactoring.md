---
title: "위코드 리팩토링 기초 회고 — 코드 컨벤션 점검표"
date: 2021-09-07 12:10:00 +0900
description: "위코드 2~3주차에 배운 리팩토링 기초 컨벤션(네이밍, 들여쓰기, Semantic 태그, alt 속성 등)을 정리한 회고"
categories: ["회고"]
tags: ["위코드", "리팩토링", "코드컨벤션", "Semantic태그", "HTML", "CSS", "회고"]
series: "위코드 부트캠프 회고"
difficulty: 1
log: 24
slug: "wecode-week2-refactoring"
source: https://zibu-story.tistory.com/147
draft: false
---

> **TL;DR** — "컴퓨터가 이해하는 코드는 누구나 쓸 수 있지만, 사람이 이해하는 코드를 쓰는 게 좋은 프로그래머다"(마틴 파울러)를 기준 삼아 리팩토링 체크리스트 10개 항목을 정리함.

## ✅ 상황 (Situation)

2~3주차 위코드 노션 자료를 참고해 리팩토링 학습목표를 세웠다 — 리팩토링이 무엇인지, 왜 필요한지 설명할 수 있고, 유지보수 관점에서 코드를 다시 볼 수 있고, 팀 컨벤션에 맞춰 코드를 작성할 수 있는 것.

## ✅ 목표와 내 역할 (Task)

코드를 짜고 나서 스스로 점검해야 할 항목을 정리하는 것이 목표였다. 콘솔 로그 제거부터 레이아웃 구성 방식까지, 그동안 무심코 지나쳤던 습관을 짚어보기로 했다.

## ✅ 한 것 (Action)

항목별로 Bad/Good 예시와 함께 정리했다.

**1. `console.log` 제거** — 테스트용 로그는 최종 결과물에 남기면 안 된다.

**2. 네이밍은 의미가 드러나게, camelCase로**

```javascript
// bad
let value = "Tom";
let value2 = "Cruise";

// good
let firstName = "Tom";
let lastName = "Cruise";
```

**3. 들여쓰기는 팀 컨벤션(스페이스 2 또는 4)을 확인해서 일관되게** — 회사마다 기준이 다르니 미리 확인해야 한다.

**4. Semantic 태그 사용** — `div`/`span`을 남발하기보다 의미가 드러나는 태그를 쓴다.

```html
<!-- non-semantic -->
<div class="mentorList">
  <div>Joonsik</div>
  <div>Jongtaek</div>
</div>

<!-- semantic -->
<ul class="mentorList">
  <li>Joonsik</li>
  <li>Jongtaek</li>
</ul>
```

**5. `img` 태그에 `alt` 속성 필수** — 이미지 로딩 실패 시 대체 텍스트로 쓰이고, 시각장애인은 `alt`로 어떤 이미지인지 인식하며, SEO에서도 이미지를 인식하는 데 쓰인다. 그래서 `src`보다 먼저 작성하는 게 좋다.

```html
<!-- bad -->
<img src="/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png" />

<!-- good -->
<img alt="Google Logo" src="/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png" />
```

**6. Self Closing 태그 활용** — 내부에 텍스트가 없는 단일 태그(`br`, `hr`, `img`, `meta`, `link`, `input`)는 여닫지 않고 self-closing으로 쓴다.

```html
<!-- bad -->
<input type="password"></input>

<!-- good -->
<input type="password" />
```

**7. CSS 속성 작성 순서** — 레이아웃에 영향을 많이 주는 순서대로, 인접한 속성끼리 묶는다.

1. Layout (position, float, clear, display)
2. Box Model (width, height, margin, padding)
3. Visual (color, background, border, box-shadow)
4. Typography (font-size, font-family, text-align, text-transform)
5. Misc (cursor, overflow, z-index)

**8. 선택자 사이 한 줄 공백** — 선택자가 붙어 있으면 구분이 어려워지므로 공백으로 나눈다.

**9. 불필요한 style 속성 지양** — `div`, `article` 같은 태그는 이미 `display: block`이 기본값이라 굳이 다시 선언할 필요가 없고, `display: block` 요소는 이미 부모 너비를 다 차지하므로 `width: 100%`도 중복이다.

**10. bottom-up 방식 레이아웃** — 부모 요소의 높이를 고정해두는 top-down 방식 대신, 자식 요소 크기에 따라 부모가 유동적으로 늘어나는 방식으로 구성한다.

```css
/* bad — feedList 높이를 고정하면 feed가 1개든 20개든 항상 100vh */
.feedList {
    height: 100vh;
}
.feed {
    height: 300px;
}

/* good — feedList 높이가 자식 요소 수에 따라 자동으로 늘어남 */
.feedList {
    padding-top: 20px;
}
.feed {
    height: 300px;
}
```

## ✅ 결과 (Result)

컨벤션 10개 항목을 체크리스트로 확보했다. 이후로는 코드를 다 짜고 나서 이 목록을 기준으로 스스로 점검하는 습관이 생겼다.

## ✅ 배운 점 / 아쉬운 점

- 잘한 것: 그동안 무심코 지나친 습관 — 콘솔 로그 방치, 들여쓰기 무시, `alt` 속성 생략 — 을 짚어낸 것
- 아쉬운 점: bottom-up 레이아웃 개념은 이번에 완전히 소화하지 못해서 더 읽어봐야 함
- 다음에 다르게 할 것: 코드를 짤 때마다 이 체크리스트로 셀프 리뷰부터 하고 넘어가기

## 참고한 링크

- [Semantic Tag 정리](https://zibu-story.tistory.com/139?category=862574)
- [CSS 기본값 참고 — w3schools](https://www.w3schools.com/cssref/css_default_values.asp)
