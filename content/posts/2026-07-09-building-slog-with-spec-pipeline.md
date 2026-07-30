---
title: "블로그를 명세 파이프라인으로 지었다 — PRD→Plan→TC 그리고 17/17 GREEN"
date: 2026-07-09 01:00:00 +0900
description: "이 블로그 자체가 첫 산출물이다. 기획서를 넣으면 PRD·Plan·TC(RED)가 나오고, 구현이 그 테스트를 GREEN으로 만들면 끝나는 파이프라인으로 블로그를 구축한 작업 로그"
categories: ["작업로그"]
tags: ["claude-code", "multi-agent", "TDD", "Next.js", "playwright"]
tools: ["spec-workflow", "playwright", "blog-draft"]
series: ""
difficulty: 3
scope: "personal"
log: 82
slug: "building-slog-with-spec-pipeline"
draft: false
---

> **TL;DR** — 블로그를 "그냥 코딩"으로 만들다 멈추고, 명세 파이프라인(PRD→Plan→TC)부터 다시 지었다. 코드가 없는 상태에서 테스트 17개를 RED로 고정하고, 구현이 그 테스트를 전부 GREEN으로 만들면서 끝났다. 첫 실측에서 17/17 통과.

난이도 : ★★★☆☆

1️⃣ `명세 파이프라인` 2️⃣ `valid RED` 3️⃣ `계약 testid`

## ✅ 목표

- 이직용 블로그(이 사이트)를 Next.js App Router로 구축
- 단, 에이전트가 바로 코드부터 짜는 방식 금지 — **명세(PRD→Plan→TC)를 기계 게이트로 통과시킨 뒤 구현**
- 티스토리 아카이브에서 고른 A급 10편을 스타일 가이드에 맞춰 리라이트해 이관

## ✅ 작업 내역

- **명세 파이프라인 실행** — 기획서 한 장을 넣어 PRD(화면 5개·수용기준 15건), Plan(태스크 16개), TC(테스트 17개)를 순차 생성. 각 단계는 자가신고를 믿지 않고 산출물을 재파싱하는 게이트(`gate_check.py`)가 판정한다
- **valid RED 고정** — 코드가 하나도 없는 빈 셸을 상대로 테스트를 실행해 "전부 미구현으로 실패"를 확인하고 해시 락(`tc.lock.json`)을 걸었다. 문법 오류로 실패하면 RED로 안 쳐준다는 게 핵심임
- **구현 3단계** — 디자인 시스템+홈 → 목록·시리즈 → 글 상세 순서로 나눠 진행. 계약의 컴포넌트 key마다 `data-testid="B-01-list-feed"` 형식 마커를 부착해 테스트와 구현이 같은 계약을 바라보게 함
- **콘텐츠 10편 이관** — 원글의 기술 내용은 유지하고 말투·구조만 통일(평어체, ✅ 섹션, TL;DR, 난이도 별점). 이미지 경로는 전부 `/images/`로 로컬화
- **GREEN 실측** — 빌드된 실제 앱(포트 3777)을 상대로 같은 테스트 17개 실행 → 전건 통과

## ✅ 의사결정 기록

| 선택지 | 결정 | 이유 |
|--------|------|------|
| 바로 구현 vs 명세 먼저 | 명세 먼저 | 중간에 방향이 바뀌어도 계약(AC-ID)이 남아서 테스트·구현·문서가 같이 움직임 |
| 테스트를 목업에 vs 빈 셸에 | 빈 셸(코드 부재) | 목업 GREEN은 가짜 신호다. "미구현이라 실패"만이 유효한 RED |
| 클라이언트에서 lib 직접 import | 순수 헬퍼 분리(`lib/format.ts`) | 서버 전용 모듈(`node:fs`)이 클라이언트 번들에 끌려 들어와 빌드가 깨졌다 |

## ✅ 막혔던 것 & 해결

- **빌드 실패: `node:path` UnhandledScheme** — 필터 컴포넌트('use client')가 포스트 카드 → 데이터 레이어까지 import 체인으로 물고 들어감. 타입과 포맷 함수(`stars`·`fmtDate`·`logNum`)를 node 의존이 없는 `lib/format.ts`로 떼어내고 서버 lib은 재수출로 호환 유지
- **테스트가 요구하는 접근성 이름** — 시리즈 내비 링크를 `getByRole('link', { name: /이전/ })`으로 찾는다. 화살표(`←`)만 있으면 못 찾으므로 "← 이전" 텍스트를 링크 안에 실제로 넣었다. 테스트가 접근성을 강제하는 순간이 좋았다

## ✅ 결과 & 다음 할 일

- 산출물: 화면 5개(홈·글·상세·시리즈·소개), 발행 글 11편, 다크모드, 시리즈 내비
- 게이트 기록: PRD·Plan·TC 3게이트 APPROVE → RED 17건 → GREEN 17/17 → 락 해시 드리프트 0
- 남은 것: GitHub 레포 공개 + Vercel 연결(P2 마감), RSS·OG·SEO(P4), 조회수(P4)

## 참고한 링크

- [Playwright — Locators](https://playwright.dev/docs/locators)
- [Next.js — App Router](https://nextjs.org/docs/app)
