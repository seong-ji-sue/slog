---
title: "스프링 프로젝트 생성 및 빌드 방법 — Spring Initializr부터 Gradle 빌드까지"
date: 2022-10-13 13:18:00 +0900
description: "Spring Initializr로 스프링 프로젝트 생성하고 Gradle로 빌드하는 방법 정리"
categories: ["딥다이브"]
tags: ["스프링", "IntelliJ", "Gradle", "빌드", "스프링부트"]
series: "스프링 파고들기"
difficulty: 1
log: 60
slug: "spring-project-create-build"
source: https://zibu-story.tistory.com/197
draft: false
---

> **TL;DR** — Spring Initializr로 프로젝트를 생성하면 빌드·부트 설정이 자동으로 잡힌다. Dependencies에서 필요한 라이브러리를 고르고, `gradlew build` → jar 실행까지 이어지면 스프링 프로젝트의 첫 실행은 끝난다.

난이도 : ★☆☆☆☆

1️⃣ `Spring Initializr` 2️⃣ `Dependencies` 3️⃣ `gradlew build`

![initializr 페이지에서 캡쳐한 이미지](/images/197/img_01.png)
*initializr 페이지에서 캡쳐한 이미지*

## ✅ 왜 알아야 하나

스프링 프로젝트를 처음 만들 때 직접 폴더 구조부터 잡을 필요는 없다. [Spring Initializr](https://start.spring.io/)로 프로젝트를 생성하면 빌드 도구와 스프링 부트 설정이 자동으로 잡히기 때문에 훨씬 유용하다. Dependencies 항목에서 필요한 라이브러리도 바로 골라서 넣을 수 있다.

나는 IntelliJ를 유료로 쓰고 있고 Java 11 버전을 기준으로 진행했다. (전체 코드는 [깃허브 레포](https://github.com/seong-ji-sue/springboot-inflearn-kimyounghan-basic)에 있다.)

![스프링 프로젝트 실행 화면](/images/197/img_02.gif)

이번 글의 목표는 스프링 프로젝트를 생성하고 실행해서 웹 브라우저에 에러 페이지를 띄우는 것까지다. 준비물은 Eclipse나 IntelliJ, Spring Initializr에서 생성한 프로젝트 폴더, 자바 11 버전이다.

## ✅ 프로젝트 생성 방법

> 나는 IntelliJ를 쓰기 때문에 `Preferences → Gradle`에 들어가서 Build, Run 옵션을 IntelliJ로 바꿔서 진행했다.

1. Eclipse 또는 IntelliJ 설치
2. [Spring Initializr](https://start.spring.io/)에서 아래 옵션으로 프로젝트를 생성하고 다운로드
   - Project : Gradle Project
   - Spring Boot : 최신 버전
   - Language : Java
   - Packaging : Jar
   - Java : 11
   - Dependencies : Spring Web, Thymeleaf(View 템플릿 엔진)
3. Eclipse 또는 IntelliJ로 프로젝트 열기
4. 실행 후 8080 포트로 접속해서 에러 페이지 확인

## ✅ 빌드하는 방법

> 아래는 윈도우 기준으로 정리한 내용이다.

```bash
cd 프로젝트 폴더
./gradlew.bat build
cd build/libs
java -jar hello-spring-0.0.1-SNAPSHOT.jar
```

`gradlew.bat build`로 빌드하면 `build/libs` 폴더에 jar 파일이 생기고, 그걸 `java -jar`로 바로 실행할 수 있다.

## ✅ Summary

- 프로젝트 생성은 Spring Initializr에서 Gradle/Java 11/Spring Web+Thymeleaf 조합으로 진행함
- IntelliJ를 쓴다면 Gradle 빌드·실행 옵션을 IntelliJ로 바꿔두는 게 편함
- 빌드는 `gradlew build` → `build/libs`의 jar를 `java -jar`로 실행하는 흐름

![강의 참고 이미지](/images/197/img_03.png)

## 참고한 링크

- [스프링 입문 - 코드로 배우는 스프링 부트, 웹 MVC, DB 접근 기술 (인프런)](https://www.inflearn.com/course/%EC%8A%A4%ED%94%84%EB%A7%81-%EC%9E%85%EB%AC%B8-%EC%8A%A4%ED%94%84%EB%A7%81%EB%B6%80%ED%8A%B8/dashboard)
- [Spring Initializr](https://start.spring.io/)
