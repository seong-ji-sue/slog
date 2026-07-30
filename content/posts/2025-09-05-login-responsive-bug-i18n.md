---
title: "로그인 페이지 박스가 깨진 이유 — 작아 보이는 버그의 구조적 원인"
date: 2025-09-05 20:40:00 +0900
description: "브라우저 창을 줄이면 로그인 박스와 로딩 오버레이가 깨지던 버그를 고치다 보니 컨테이너 구조 자체가 문제였던 기록, 그리고 뒤이어 시작된 로그인 메시지 다국어 적용"
categories: ["일감"]
tags: ["CSS", "반응형", "트러블슈팅", "i18n", "React"]
series: "SSH Key 관리 콘솔"
project: "ssh-key-관리"
difficulty: 2
scope: "company"
log: 108
draft: false
---

> **TL;DR** — 브라우저 창을 줄이면 로그인 박스가 밖으로 삐져나가고 로딩 오버레이도 일부만 덮이는 버그였다. 원인은 breakpoint 문제가 아니라, 절대 위치로 배치된 장식 요소들이 최소 높이를 보장받지 못하는 부모 안에 떠 있었다는 구조적인 문제였다.

난이도 : ★★☆☆☆

1️⃣ `position: absolute 컨테이너 문제` 2️⃣ `min-height 보장` 3️⃣ `로그인 메시지 다국어`

### ✅ 상황

> QA : 브라우저 창을 세로로 줄이면 로그인 박스가 화면 아래로 삐져나가요  
> 나 : 확인해볼게요  
> QA : 그리고 그 상태에서 로그인 버튼 누르면 로딩 화면이 일부만 덮여요. 배경이 안 가려진 부분이 남아요  
> 나 : 두 개가 같은 원인일 수도 있겠는데요

QA 리포트 두 개가 같은 날 올라왔다. 겉보기엔 다른 증상(로그인 박스 자체가 틀어지는 것과, 로딩 오버레이가 안 덮이는 것)이었는데, 로그인 화면의 최상위 레이아웃 파일을 열어보니 원인이 하나로 겹쳤다.

### ❌ 기존 구조

```scss
.wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-repeat: no-repeat;
  background-color: var(--main-menu-normal-02-2-c-303-a);
}

.border_wrapper {
  position: absolute;
  width: 506px;
  ...
}

.bg_wrapper {
  position: absolute;
  width: 502px;
  ...
}
```

`.wrapper`가 `height: 100%`만 갖고 있고 최소 높이 지정이 없었다. 그 안에서 `flex`로 자식을 가운데 정렬하고, 로그인 박스의 배경 장식(`.border_wrapper`, `.bg_wrapper`)은 `position: absolute`로 떠 있었다. 브라우저 창을 세로로 줄이면 `.wrapper`의 실제 높이도 같이 줄어드는데, `.border_wrapper`/`.bg_wrapper`는 고정 px 크기라 부모보다 커지는 순간 레이아웃이 깨졌다. 로딩 오버레이도 같은 `.wrapper` 트리 안에 있어서 똑같이 잘렸다.

### ✅ 왜 breakpoint 문제가 아니었나

처음엔 반응형 breakpoint 하나가 빠졌나 싶었는데, 실제로는 이 컴포넌트가 애초에 "화면이 충분히 크다"는 가정 하나로만 만들어져 있었다. 특정 너비·높이 이하에서만 깨지는 게 아니라, 뷰포트가 조금이라도 좁아지면 바로 증상이 나타나는 구조였다 — breakpoint를 추가한다고 고쳐질 문제가 아니라, 애초에 "최소 크기 보장"과 "절대 위치 요소들의 기준점"이 빠져 있었던 설계 누락이었다.

### 🛠️ 해결 — 중간 컨테이너 + 최소 높이

```scss
.wrapper {
  width: 100%;
  height: 100%;
  background-repeat: no-repeat;
  background-color: var(--main-menu-normal-02-2-c-303-a);
  min-height: 700px;
}

.container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}
```

```tsx
<div className={styles.wrapper}>
  <div className={styles.container}>
    <Rectangle type={rectangleType.login} />
    <div ref={borderRef} className={styles.border_wrapper} />
    <div ref={bgColorRef} className={styles.bg_wrapper} />
    {children}
  </div>
</div>
```

두 가지를 같이 했다.

- `.wrapper`에 `min-height: 700px`를 줘서, 뷰포트가 아무리 좁아져도 로그인 박스가 정상적으로 그려질 최소 공간을 보장
- `flex` 정렬과 절대 위치 자식들을 `.wrapper`에서 분리해 `.container`(`position: relative`)로 옮김 — 절대 위치 요소들의 기준점을 명확히 잡아서, `.wrapper`가 최소 높이 이상으로 커지더라도 내부 배치가 흔들리지 않게 함

이 변경 하나로 로그인 박스 틀어짐과 로딩 오버레이가 안 덮이는 문제가 동시에 해결됐다. 같은 컨테이너 구조를 공유하고 있었으니 당연한 결과였다.

<!-- 이미지 제안: 브라우저 세로 축소 시 로그인 박스·로딩 오버레이가 깨지는 화면(Before)과 수정 후 정상 렌더링되는 화면(After) 비교 스크린샷 -->

### ✅ 그다음 — 로그인 메시지 다국어 적용

같은 시기에 로그인 플로우 안에서 다른 작업도 진행됐다. 로그인 실패·세션 만료 같은 메시지가 상수 파일에 하드코딩돼 있던 걸 다국어 사전으로 옮기는 작업이었다.

```tsx
// before
loginErrorFunc({e, message: errorMessages.fail.login.default});

// after
const {t} = useTranslation();
loginErrorFunc({e, message: t('message.error.fail.login.default')});
```

이 작업은 먼저 화면에 쓰이는 문구를 전부 취합해 번역 대상 목록부터 만드는 데서 시작했다. 로그인 화면 하나만 봐도 실패 메시지, placeholder, 체크박스 문구까지 종류가 꽤 됐는데, 이 문구들을 어떻게 계층 구조로 나누고 라벨-값을 어떻게 매핑했는지는 별도로 정리해뒀다.

### ✅ 전체 흐름 요약

1. QA에서 "로그인 박스 틀어짐"과 "로딩 오버레이 안 덮임" 두 증상이 같은 날 접수됨
2. 레이아웃 파일을 확인해 두 증상이 같은 컨테이너 구조 문제라는 걸 확인
3. `.wrapper`에 `min-height` 추가, 절대 위치 자식들을 `.container`로 분리해 기준점 명확화
4. 같은 로그인 플로우 안에서 메시지 다국어 적용 작업 병행

### 🎯 결과

| 항목 | 이전 | 이후 |
|---|---|---|
| 로그인 박스 | 브라우저 세로 축소 시 화면 아래로 삐져나감 | `min-height: 700px`로 최소 공간 보장, 정상 표시 |
| 로딩 오버레이 | 일부만 덮이고 배경이 노출됨 | `.container`로 절대 위치 기준점 분리, 전체 커버 |
| 로그인 메시지 | 상수 파일에 하드코딩 | 다국어 사전(`t()`)으로 관리 |

작아 보이는 버그 두 개가 실은 하나의 커밋에서 함께 고쳐졌다. "브라우저를 줄였을 때"라는 조건에만 집중했으면 breakpoint 몇 개를 추가하는 선에서 끝났을 텐데, 컨테이너 구조 자체를 들여다보고 나서야 두 증상이 같은 원인이라는 걸 알 수 있었다. QA 일감을 개별로 처리하지 않고 모아서 근본 원인을 먼저 찾는 습관이 여기서부터 붙었다.

## 참고한 링크

- (사내 QA 리포트 — 링크 비공개)
