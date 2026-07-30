---
title: "Infrean 스프링 입문 강의 추천! 김영한님의 모든 것!"
date: 2022-10-05 22:43:00 +0900
categories: ["공부(Study)", "스프링(Spring)"]
tags: ["김영한", "스프링", "스프링부트", "스프링입문강의", "인프런"]
source: https://zibu-story.tistory.com/192
post_id: 192
---

## **후기**

![인프런 로고(홈페이지 캡쳐)](../images/192/img_01.png)

*인프런 로고(홈페이지 캡쳐)*

**디테일한 부분보다는 스프링의 전체적인 가이드를**  
**하는 강의여서 처음 접하는 사람들한테는 도움이 많이 될 것 같아요**  

**하지만 개발을 처음 접하시는 분이나 자바를 완벽하게 숙지하지 못하신 분에게는**  
**아래 페이지에서 수강 후 들으시는 게 좋아요**

**링크 : [생활 코딩](https://opentutorials.org/course/1)**

[🔗 생활코딩](https://opentutorials.org/course/1) — hello world 생활코딩의 세계에 오신 것을 환영합니다. 생활코딩은 일반인들에게 프로그래밍을 알려주는 무료 온라인, 오프라인 수업입니다.  어떻게 공부할 것인가를 생각해보기 전에 왜 프로그

**코드 내용**

**[깃허브 Repository](https://github.com/seong-ji-sue/springboot-inflearn-kimyounghan-basic)**

![](../images/192/img_02.gif)

### **✔️ 공지사항**

> **📢 해당 강의는 코드에 대한 자세한 설명보다는 스프링의 전체적인 흐름만 짚어주는 강의입니다.**

> **📢 자바를 완벽하게 이해했다는 가정하에 들으시면 좋습니다. Optional, List, Interface 등 내용이 나옵니다.**

### ***✔️*** **Summary**

1. **프로젝트 생성 및 빌드**
2. **스프링 콘텐츠 종류 및 동작 방식**
3. **데이터 객체(domain), Repository, Service, Controller 및 테스트 케이스**
4. **DI 의존성 주입**
5. **DB 연결 및 JDBC Template, JPA**

### ***✔️*** **프로젝트 생성 및 빌드**

**알게된 것**

1. 스프링 프로젝트를 생성하고 실행해서 웹 브라이우저에 Error 페이지를 띄울 수 있음

**정리한 TIL**

<https://zibu-story.tistory.com/197?category=866832>

[🔗 Infrean 스프링 입문 강의 (김영한 님) -프로젝트 생성 및 빌드](https://zibu-story.tistory.com/197?category=866832) — T M I Spring Intializr 로 프로젝드를 생성하면 자동으로 빌드나 부트등 자동으로 생성하기 때문에 유용하다. Dependencies를 통해 필요한 라이브러리를 설치할 수도 있다. 필자는 IntelliJ를 유료로 사용

### ***✔️*** **스프링 컨텐츠 종류 및 동작 방식**

**알게된것**

1. 웹 브라우저에 검색했을 때 스프링이 동작하는 방식
2. 각 폴더와 파일의 역할과 우선 순위
3. Json 데이터로 전달, 파일만 웹 브라우저에 전달하는 방법

**정리한 TIL**

<https://zibu-story.tistory.com/198?category=866832>

[🔗 Infrean 스프링 입문 강의 (김영한 님) - 컨텐츠 종류 및 동작 방식](https://zibu-story.tistory.com/198?category=866832) — 이해할 때까지 직접 코드를 치는 것이 중요하다 코드 내용 깃허브 Repository 📢 웹 브라우저에 검색했을 때 스프링이 동작하는 방식을 설명할 수 있습니다. 📢 static 폴더와 template 폴더의 역할

### ***✔️*** **데이터 객체(domain), Repository, Service, Controller 및 Test**

> 📢 **데이터베이스 없는 상태에서 개발을 진행하였습니다.**

**알게된것**

1. domain, repository, service, controller 의 역할
2. 테스트 케이스를 작성하는 이유와 방법, 각각의 상황대로 단위하는 방법
3. 일반적으로 MVC 방식으로 회원 관리 메뉴를 작성

**정리한 TIL**

<https://zibu-story.tistory.com/199?category=866832>

[🔗 Infrean 스프링 입문 강의 (김영한 님) - 데이터 객체(domain), Repository, Service, Controller 및 테스트 케이](https://zibu-story.tistory.com/199?category=866832) — 자세한 코드 내용은 아래 링크를 통해 확인 가능하고 Repository, Service, Controller 설명에서 적은 코드는 영역마다 어떤 역할을 하는지 간략하게 깨우쳐 주기 위해서 작성했습니다. 코드 내용 깃허브

### ***✔️*** **DI 의존성 주입**

**알게된것**

1. 의존성 주입의 종류(생성자, setter, 필드), 역할, 좋은 점
2. 의존 관계 설정하는 방법(컴포넌트 스캔, 수동으로 빈 등록)
3. 어노테이션 모르는 것

**정리한 TIL**

<https://zibu-story.tistory.com/200?category=866832>

[🔗 Infrean 스프링 입문 강의 (김영한 님) - DI, 의존성 주입](https://zibu-story.tistory.com/200?category=866832) — 코드 내용 깃허브 Repository 📢 의존성 주입 의 종류(생성자, setter, 필드), 역할, 좋은점 📢 의존관계 설정하는 방법(컴포넌트 스캔, 수동으로 빈 등록) 📢 어노테이션 모르는 것 ✔️의존관계(D

### ***✔️*** **DB 연결 및 JDBC Template, JPA**

**알게된것**

1. H2 데이터 베이스를 설치 및 테이블 생성
2. 20년 전에 썼던 JDBC 연결 방법
3. 중복코드 제거한 JDBC 방법
4. JPA와 데이터 JPA

**정리한 TIL**

<https://zibu-story.tistory.com/201?category=866832>

[🔗 Infrean 스프링 입문 강의 (김영한 님) - DB 연결 및 JDBC Template, JPA](https://zibu-story.tistory.com/201?category=866832) — 코드 내용 깃허브 Repository 📢 H2 데이터 베이스를 설치하고 테이블을 생성할 수 있다. 📢 중복코드 제거한 최신 JDBC 방식을 알고 있습니다. 📢 쿼리문을 안쓰고 JPA를 사용하여 데이터베이스에

### ***✔️*** **AOP**

**알게된 것**

1. AOP를 사용하기 전 문제점과 사용했을 때 나아지는 점을 파악
2. 동작 원리
3. 모르는 용어

**정리한 TIL**

### ***✔️*** **피드백**

1. Controller, Service, Repository 부분 설명 부족함 하면서 채우기
2. 모르는 것 개념 정리하기

### **✔️ 강의 참고**

[스프링 입문 - 코드로 배우는 스프링 부트, 웹 MVC, DB 접근 기술](https://www.inflearn.com/course/%EC%8A%A4%ED%94%84%EB%A7%81-%EC%9E%85%EB%AC%B8-%EC%8A%A4%ED%94%84%EB%A7%81%EB%B6%80%ED%8A%B8/dashboard)

[🔗 [무료] 스프링 입문 - 코드로 배우는 스프링 부트, 웹 MVC, DB 접근 기술 - 인프런 | 강의](https://www.inflearn.com/course/%EC%8A%A4%ED%94%84%EB%A7%81-%EC%9E%85%EB%AC%B8-%EC%8A%A4%ED%94%84%EB%A7%81%EB%B6%80%ED%8A%B8/dashboard) — 스프링 입문자가 예제를 만들어가면서 스프링 웹 애플리케이션 개발 전반을 빠르게 학습할 수 있습니다., - 강의 소개 | 인프런...

![필독.png](../images/192/img_03.png)
