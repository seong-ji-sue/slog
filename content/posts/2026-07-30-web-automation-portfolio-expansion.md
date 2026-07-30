---
title: "WEB 자동화 앱 포트폴리오 확장 — 표준 구조를 새 앱마다 재사용하기"
date: 2026-07-30 23:00:00 +0900
description: "GitLab·Azure·Jenkins·사내 플랫폼까지 WEB 자동화 앱을 하나씩 늘려가면서, AppScript 공통화 리팩토링에서 세운 표준 구조를 신규 앱마다 어떻게 재사용했는지 정리한 기록"
categories: ["일감"]
tags: ["AutoIt", "RPA", "웹자동화", "GitLab", "Azure", "Jenkins", "공통화"]
series: "AutoIt 업무 자동화"
project: "autoit-자동화"
difficulty: 3
log: 126
draft: false
---

> **TL;DR** — GitLab·Azure·Jenkins·사내 통합 플랫폼 웹까지, WEB 자동화 앱을 하나씩 늘려가면서 [AppScript 공통화 리팩토링](/posts/appscript-commonization-refactor)에서 세운 표준(config.ini 외부화 + login/utils 2파일 규칙)을 신규 앱마다 그대로 재사용했다. 앱마다 로그인 방식은 다 달랐지만(계정 로그인, Microsoft passwordless, XPath 설정 외부화), 뼈대를 새로 고민할 필요는 없었다.

난이도 : ★★★☆☆

1️⃣ `표준 구조 재사용` 2️⃣ `WEB 앱 포트폴리오 확장` 3️⃣ `로그인 방식별 예외 처리`

### ✅ 요구사항

> 선임 : 이번엔 GitLab이랑 Azure, Jenkins 로그인도 자동화 대상에 추가해야 돼  
> 나 : WEB 앱 표준 구조는 이미 있으니까, 그 위에 얹어서 만들면 될 것 같습니다  
> 선임 : 표준 만들어둔 보람이 있네

이전에 [AppScript 공통화 리팩토링](/posts/appscript-commonization-refactor)에서 WEB·CS 앱 11종을 config.ini 외부화 + login/utils 2파일 규칙으로 표준화한 적이 있다. 이번 글은 그 이후에 실제로 새 WEB 앱을 하나씩 붙여가면서, 그 표준이 신규 앱 개발에서 얼마나 재사용됐는지를 다룬다.

### ✅ WEB/CS 공통화 — 앱을 늘리기 전에 뼈대부터 다시 정리

새 앱을 본격적으로 늘리기 직전에, WEB/CS 스크립트의 공통 유틸을 한 번 더 정리했다. 로컬 개발 환경과 클라이언트(실행) 환경을 분리하고, 자동화 로그에 AI가 읽기 좋은 마커를 남기도록 공통 로직을 다듬었다. 이 정리가 끝난 뒤에야 GitLab·Azure·Jenkins 같은 신규 WEB 앱을 붙이는 작업이 시작됐다 — 표준을 먼저 다지고, 그 위에 앱을 얹는 순서다.

### ✅ WEB_GitLab — 세션 유지 패턴부터 다시 잡다

GitLab 자동화 앱을 v1.0으로 처음 추가했다. 로그인 자체는 표준 login/utils 구조를 그대로 따랐지만, 세션 유지 부분에서 기존 패턴을 그대로 쓸 수 없었다 — `login_local` 성공 이후 세션을 유지하는 방식을 GitLab 흐름에 맞게 전면 수정해야 했다.

- v1.0 추가 시점에 로그인 성공 판정과 세션 유지 로직을 GitLab 전용으로 재작성
- 이후 실제 배포 환경에서 로그인 버튼의 XPath가 기대와 달라 수정하는 작업이 뒤따랐다 — 화면 구조가 계정마다 미묘하게 다를 수 있다는 걸 실측으로 확인
- 배포기록에 로그인 PASS 검증 결과를 남기는 것으로 마무리

표준 구조 덕분에 "로그인 폼에 값 채우고 제출하는" 뼈대는 그대로 재사용했지만, "로그인 이후 세션을 어떻게 유지하는가"는 앱마다 다시 검증해야 하는 부분이라는 걸 GitLab에서 확인했다.

### ✅ WEB_Azure — Microsoft passwordless 우회가 필요했던 이유

Azure 자동화 앱은 로그인 흐름 자체가 다른 앱과 달랐다. Microsoft 계정 로그인이 기본적으로 passwordless(패스워드 없이 앱 알림이나 다른 인증 수단으로 로그인)를 유도하는 흐름이었기 때문에, 자동화 스크립트가 이 흐름에 그대로 걸리면 진행이 멈췄다.

- Microsoft의 passwordless 유도 분기를 감지해서, 기존 방식(계정+비밀번호 직접 입력)으로 우회하는 로직을 추가
- 이후 각 UI 동작의 대기시간을 2초 이하로 튜닝 — 불필요하게 길게 잡혀 있던 대기 구간을 정리해서 전체 로그인 소요 시간을 줄임

같은 "웹 로그인 자동화"라도 인증 제공자(Microsoft)가 유도하는 기본 흐름 자체가 다르면, 표준 login 구조 위에 그 인증 제공자 전용 분기를 얹어야 한다는 걸 Azure에서 확인했다. 표준 구조가 커버하는 건 "로그인 폼 조작"까지고, "인증 제공자가 강제하는 흐름 우회"는 앱별로 새로 판단해야 하는 영역이었다.

### ✅ WEB_Jenkins — 구조 개편 잔재 정리

Jenkins 로그인 자동화는 v2.0으로 이관을 완료하면서, 구조 개편 이전에 평면 폴더로 남아있던 잔재(`JenkinsWebLogin` 구버전 폴더)를 제거하는 작업까지 함께 진행했다. 새 앱을 붙이는 김에, 이전 구조 개편 때 미처 정리하지 못했던 구버전 산출물을 같이 걷어낸 것이다. 새 앱 추가가 늘어날수록 이런 정리를 미루면 나중에 "어느 게 최신 버전인지" 헷갈리는 폴더가 계속 쌓인다는 걸 상기시켜준 케이스였다.

### ✅ 사내 통합 플랫폼 웹 — config.ini 외부화만으로 앱을 재사용

사내 통합 플랫폼의 웹 화면을 자동화하는 앱은 순서가 조금 달랐다. v1.0으로 스크립트 폴더를 먼저 추가한 뒤, XPath 값을 `config.ini`로 외부화하는 작업을 별도로 진행했는데, 이때 핵심은 "코드 수정 없이 설정값만 바꿔서 WEB 앱을 재사용할 수 있는 구조"를 실제로 검증한 것이었다.

이후 XPath 프로버(probe) 도구로 실제 화면 요소를 탐지해서 산출물을 만드는 작업까지 이어졌다. 표준 구조가 있으니 신규 앱이라도 "화면을 조사 → config.ini에 XPath 채우기 → 실행"이라는 동일한 절차로 반복 가능했다.

### ✅ 표준 구조가 실제로 아꼈던 것

네 앱(GitLab, Azure, Jenkins, 사내 통합 플랫폼 웹)을 붙이면서 매번 새로 고민할 필요가 없었던 부분과, 매번 새로 확인해야 했던 부분을 구분하면 이렇다.

| 구분 | 표준 구조로 재사용됨 | 앱마다 새로 확인 필요 |
|------|----------------------|----------------------|
| 폴더/파일 구조 | login/utils 2파일 규칙 그대로 | — |
| 설정값 관리 | config.ini 외부화 방식 그대로 | 앱별 XPath·자격증명 값만 채움 |
| 로그인 폼 조작 | 공통 유틸 함수 재사용 | 계정 로그인 vs Microsoft passwordless 등 인증 흐름 분기 |
| 로그인 성공 판정 | 판정엔진 구조는 공통 | 세션 유지 방식은 앱마다 재작성(GitLab 사례) |
| 대기시간 | 기본값에서 시작 | UI 반응 속도에 맞춰 앱별 튜닝(Azure 사례) |

### ✅ 결과 & 배운 점

앱을 하나씩 늘릴 때마다 "이번엔 또 뭐가 다를까"를 걱정했는데, 실제로는 표준 구조 덕분에 매번 뼈대부터 새로 짜는 일은 없었다. 대신 각 앱이 쓰는 인증 제공자나 프레임워크의 특성(Microsoft passwordless, GitLab 세션 유지, 프레임워크별 UI 반응 속도)만 개별적으로 확인하면 됐다.

공통화 리팩토링을 먼저 해두지 않았다면, GitLab·Azure·Jenkins를 붙일 때마다 폴더 구조와 설정 관리 방식부터 매번 새로 정하고 있었을 것이다. 표준을 세우는 작업 자체는 눈에 띄는 산출물이 아니지만, 그 이후 신규 앱을 늘리는 속도를 실제로 결정하는 건 이 표준이었다는 걸 다시 확인했다.

## 참고한 링크

- [Microsoft identity platform — Passwordless authentication overview](https://learn.microsoft.com/entra/identity/authentication/concept-authentication-passwordless)
- [GitLab Docs — Sign in and sign out](https://docs.gitlab.com/ee/user/profile/account/)
- [Jenkins Docs — Managing security](https://www.jenkins.io/doc/book/security/)
