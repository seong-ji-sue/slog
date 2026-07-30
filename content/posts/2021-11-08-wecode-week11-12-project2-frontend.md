---
title: "위코드 2차 프로젝트 프론트엔드 — Week 11~12 실전 기록"
date: 2021-11-08 12:14:00 +0900
description: "2차 프로젝트 2주 동안 실제로 한 작업, 알게 된 것, 멘토에게 질문한 내용을 날짜별로 그대로 정리한 기록"
categories: ["회고"]
tags: ["위코드", "부트캠프", "2차프로젝트", "styled-components", "React", "회고"]
series: "위코드 부트캠프 회고"
difficulty: 1
scope: "personal"
log: 43
slug: "wecode-week11-12-project2-frontend"
source: https://zibu-story.tistory.com/180
draft: false
---

> **TL;DR** — 2차 프로젝트 2주 동안 검색 기능과 모달을 맡아 구현하면서 실제로 한 일, 알게 된 것, 멘토에게 물어본 것을 날짜별로 그대로 남긴다.

난이도 : ★☆☆☆☆

![](/images/180/img_01.gif)

## ✅ 상황

프로젝트에 들어간 뒤로는 TIL을 제대로 못 썼다. 3주차 리팩토링 기간에는 할머니 상 때문에 AWS 배포만 겨우 했다. 앞으로는 이 부분을 신경 쓰고, 3차부터는 개인 프로젝트를 하나 구현해볼 생각이다.

## ✅ 2차 프로젝트 2주 동안 한 것

### 1주차

- **10/25(월) at. 서울역** — 초기 세팅 및 이슈 생성, 이미지 URL 찾기, 초기 세팅 클론받고 오류 여부 체크, HTML에 styled-components 적용해서 메인페이지 구성(styled-components 공부하고 바로 적용)
- **10/26(화) at. 서울역** — Nav 컴포넌트 레이아웃 구성 및 기능 구현, 팀 노션을 2주차로 바꿔도 되는지 확인, 각자 이미지 검수, 세션 듣고 develop 브랜치 추가, 백엔드 모델링 결과 프론트와 공유, Nav·Header 레이아웃 구현
- **10/27(수) at. 집** — 학점은행제 강의 2개 이상 수강, Link to로 id 전달하는 방법 논의, styled-components 공부해서 가독성 있게 코드 수정, Header에서 안 쓰는 부분은 alert 창을 띄우고 로그인 시 처리 방식은 1차 프로젝트 참고, 완료 후 git rebase로 push(모르면 세션 다시 듣기), 다음 날 운동 후 TIL 작성, 필요 데이터 모델링 참고해서 팀원에게 전달
- **10/28(목) at. 종로** — Nav에서 햄버거바 클릭 시 메인 카테고리가 나오도록 수정, 검색창 클릭 시 추천 검색어 노출, footer 레이아웃 구현, Nav까지 리팩토링, 디테일·메인 페이지 fetch 요청과 라우팅 작성, 피어리뷰 반영, `useParams` 학습
- **10/29(금) at. 종로** — 중단 카테고리 레이아웃 구현 및 Link to로 데이터 전달, 학점은행제 과제, cardList 컴포넌트 분류, cardList 목데이터 작성, props로 값을 넘겨 style.js 구성, 한 파일에 scss까지 작성, mixin style.css로 재구성, 검색바 input 값을 로컬스토리지에 저장

### 2주차

- **11/01(월) at. 서울역** — 커뮤니티 답변 참고해서 로컬스토리지 저장이 한 템포 느린 문제 해결, 팀원 모달 코드 참고해서 직접 구현, 팀원들에게 재사용 카드 컴포넌트 공유, Link to 경로 설계 논의(재사용성 고려), Header 로그인 부분 분리, 이른 아침 서울스퀘어에서 블로그 작성, 다음 날 6시 기상, fontawesome을 className 대신 링크 방식으로 전부 변경, 프론트 코드리뷰 커뮤니티에 질문 다수 남김
- **11/02(화) at. 을지로입구** — 모달창 열고 닫는 토글 관련 질문, 지우기 버튼 클릭 시 한 템포 느린 문제와 안 쓰는 `searchValue` 처리 논의, TIL 작성, 커뮤니티 질문 노션 정리, 검색·모달 로직 오류 팀원과 확인, 멘토가 검색·모달 로직 리뷰
- **11/03(수) at. 을지로입구** — 남은 문제 4개 해결, 커뮤니티 질문 정리 후 개인 노션 정리, 반영한 코드와 미해결 부분 커뮤니티에 남김, 프론트·백엔드 진행 상황 확인 후 병합, 라우팅은 아직 미해결, 프론트 1차 병합
- **11/04(목) at. 을지로입구** — 검색 마무리 및 추가 모달 구현, 팀 소개 라우터 구현, 백엔드 데이터 연결 및 수정, 전역 상태 관리 특강, 카카오 로그인 마무리, 프론트+백엔드 병합
- **11/05(금) at. 서울역** — 팀원들 merge 여부 확인, 발표 마무리 준비, 팀원들과 발표 기념 사진

## ✅ 알게 된 것들

- 검색어는 List 페이지로 전달하고, 그 단어로 백엔드에 요청하면 됨
<!-- 이미지 제안: 검색어 입력 → List 페이지 전달 → 백엔드 요청까지의 데이터 흐름도 -->
- 모달은 전체 태그·모달 외부 태그·모달 태그 3단 구조로 나누고, 모달 외부 태그를 클릭하면 state를 false로 바꿔서 닫음
<!-- 이미지 제안: 전체 태그·모달 외부 태그·모달 태그 3단 구조를 겹친 레이어로 보여주는 다이어그램 -->
- 비동기를 동기처럼 다루고 싶을 때는 `setState` 첫 번째 인자로 콜백을 넘김
- 전역으로 관리할 상태는 App.js 최상단에서 감싸야 함
- `Routes`에는 경로 관련 코드만 두고, App.js에는 나머지를 둠
- fontawesome은 컴포넌트가 아니라 `<i>` 태그로 써야 함

## ✅ 질의응답 — 개많이 물어봄

**1. styled-components 질문**

- main.js에서 import한 일반 컴포넌트에 직접 style 속성을 주고 싶은데, className도 애매하고 style 태그로 감싸자니 코드가 길어진다. 보통 어떤 식으로 처리하는가? (메인 페이지에서 각 컴포넌트의 height를 개별 관리하고 싶은 경우)
- 컴포넌트도 대문자 태그, styled-component도 대문자 태그인데 구분하는 방법이 있는가? 모듈과 같은 이름으로 styled-component를 지정할 수는 없는 것 같다.
- styled-components 공식 문서와 영상 자료를 찾아봤지만 값을 props로 받고, 그 안에서 다른 styled-component를 적용하는 부분이 잘 이해되지 않는다. 추천할 만한 자료가 있는가?

멘토 답변: styled-component는 이름 그대로 컴포넌트이기 때문에 props를 그대로 사용할 수 있다. props 사용법은 공식 문서에 잘 정리돼 있다. styled-component 자체가 태그와 스타일을 합친 것이라 굳이 구분할 필요가 없다 — 스타일을 주고 싶은 태그는 그 styled-component를 정의할 때 CSS를 정의하면 된다. 대문자 태그 중복 문제는 다음과 같이 처리할 수 있다.

```javascript
import * as S from "./Main.style";

<S.Container />
```

**2. Rebase 에러 관련 질문**

**3. 모달창 구현 관련 질문**

**4. 동기·비동기 관련 질문**

## ✅ 배운 점

이번 2주는 styled-components와 모달을 직접 구현하는 데 시간을 많이 썼다. 질문을 던지고 리뷰를 받는 과정에서 혼자 고민하는 것보다 훨씬 빠르게 문제를 풀 수 있다는 걸 다시 확인했다.

## 참고한 링크

- [styled-components: Basics](https://styled-components.com/docs/basics#adapting-based-on-props)
- [React | 세상 간단하게 모달창 만들기 (라이브러리 X)](https://velog.io/@edie_ko/React-세상-간단하게-모달창-만들기-라이브러리-X)
- [[React] Styled Components 사용기](https://dkje.github.io/2020/10/13/StyledComponents/)
- [Adding css to font-awesome icons with react-styled-components](https://stackoverflow.com/questions/65361114/adding-css-to-font-awesome-icons-with-react-styled-components)
- [z-index가 동작하지 않는 이유 4가지 (그리고 고치는 방법)](https://erwinousy.medium.com/z-index가-동작하지않는-이유-4가지-그리고-고치는-방법-d5097572b82f)
