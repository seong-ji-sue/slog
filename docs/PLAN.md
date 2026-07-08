# SLOG 기획서 — 이직용 개발 블로그

작성일: 2026-07-08 · 대상: zibu (FE 개발자) · 상태: 초안 v1

---

## 1. 목적 & 포지셔닝 (요구사항 6)

- **1차 목적**: 이직. 채용담당자·면접관이 보는 "기록 포트폴리오" — 사고 과정과 실무 문제 해결 능력을 증명
- **2차 목적**: Claude Code 작업 자동 축적 (요구사항 1) — 매일의 작업이 자산이 되는 구조
- **타겟 독자**: ① FE 채용담당자/면접관 ② 같은 문제를 검색해서 들어온 개발자
- **콘텐츠 4축**:

| 축 | 템플릿 | 소스 | 이직 어필 |
|----|--------|------|-----------|
| 트러블슈팅 (일감) | troubleshooting.md | 실무 + 기존 글 | ★★★★★ |
| 기술 딥다이브 | deep-dive.md | 기존 글 리라이트 + 신규 | ★★★★ |
| 프로젝트 회고 | retrospective.md | 신규 (STAR 구조 = 면접 답변 재사용) | ★★★★★ |
| 작업 로그 (자동) | worklog.md | blog-draft 스킬 자동 생성 | ★★★ (꾸준함 증명) |

## 2. 현황 분석

**자산**
- 티스토리 아카이브 81편 (2021~2025) 이관 완료 — `posts/` + 이미지 355개 로컬화
- 주력 스택: React / TypeScript / Next.js (+ Spring 기초) — 공개 레포 30+ (원티드 프리온보딩, 스터디 이력 포함)
- 최근 글(218·219)이 품질 최고점: 실무 트러블슈팅 + 대화체 서사

**기존 깃허브 블로그 확인 결과 (요구사항 8)**
- `seong-ji-sue.github.io` 레포 **없음** — 계정에 블로그 레포 부재
- Pages 활성 레포 2개: `portfolioPage`(포트폴리오 퍼블리싱), `react-project-board`(데모) — 블로그 아님
- **결론: 신규 구축**. portfolioPage는 About 페이지에서 링크로 활용

## 3. 기술 스택 결정

| 후보 | 장점 | 단점 | 판정 |
|------|------|------|------|
| **Next.js(App Router) + MDX + Vercel** | 본인 주력 스택 → **블로그 코드 자체가 포트폴리오**, 디자인 자유, 레포 공개 시 커밋 이력도 어필 | 직접 구축 비용 | ✅ **채택** |
| GitHub Pages + Jekyll(Chirpy 등) | 무료·빠름 | Ruby 커스텀 한계, FE 역량 어필 약함 | 대안 |
| velog / 티스토리 유지 | 검색 노출 | 커스텀·자동화 불가 | 크로스포스팅 채널로만 |

**세부**: Next.js 15(App Router) · MDX(코드 하이라이트 shiki) · Tailwind CSS · Vercel 배포 · 댓글 giscus(GitHub Discussions — 계정 활용) · Vercel Analytics · RSS/사이트맵/OG 이미지 자동 생성
조회수 카운터는 DB 필요 → Phase 4 (Upstash Redis 무료 티어)로 미룸

## 4. 디자인 방향 (요구사항 2)

**레퍼런스 — "개발자 중 가장 유명한" 블로그 기준**

| 순위 | 블로그 | 가져올 것 |
|------|--------|-----------|
| 1 | overreacted.io (Dan Abramov) — 개인 dev 블로그 인지도 1위 | 미니멀 글 목록, 타이포 중심, 다크모드 |
| 2 | joshwcomeau.com (Josh Comeau) — 디자인 완성도 1위 | 코드블록 스타일, 포인트 컬러 |
| 3 | leerob.io (Lee Robinson) | 절제된 About/이력 구성 |

**채택안 v2 — 「기록 노트(Field Log)」** (`design/mockup-v2.html`)

v1(다크+옐로 단일 포인트)은 전형적 AI 생성 룩이라 폐기. v2는 본인 티스토리 습관(본문 노란 형광펜 `#f3c000` 하이라이트, 난이도 별점, ✅ 체크 섹션)을 디자인 시스템으로 승격한 것임.

- **시그니처**: 형광펜 하이라이트(`mark`) — 히어로·글 제목 핵심어·TL;DR·결론 문장에 일관 적용, 리스트 hover 시 스윕 애니메이션
- **팔레트(라이트 기본)**: 종이 `#FAFAF8` · 잉크 `#1A1A1F` · **형광펜 `#FFE94A`** · **볼펜 블루 `#2451B2`**(링크·인용·카테고리) · 괘선 `#E4E4DE` — 공부 노트의 실제 재료. 코드 블록만 다크 아일랜드(`#1D1D22`)
- **타이포**: 히어로·글 제목 **Noto Serif KR 900**(기록물 서사, 리스크 1개) · 본문 Pretendard 16/1.85 · 메타 JetBrains Mono
- **구조 장치**: `LOG_083` 로그 번호(티스토리 81편을 잇는 실제 순번) · 볼펜 블루 카테고리 · 난이도 별점 · ✅ 섹션
- 본문 최대폭 680px, 다크모드는 토글로 제공(P2)
- 접근성: 키보드 포커스 형광펜 표시, prefers-reduced-motion 대응

## 5. 정보 구조 (IA)

```
Home        최신 글 리스트(전체) + 상단 소개 2줄 + 피처드 3편
/posts      전체 글 + 태그 필터
/series     시리즈 묶음 (TS 시리즈, 스프링 시리즈 등)
/about      이력 요약·기술 스택·프로젝트 링크·연락처 (이직용 랜딩)
/rss.xml    RSS
글 상세      TL;DR → 본문 → 시리즈 내비 → giscus 댓글
```

## 6. 글 템플릿 근거 (요구사항 3)

인기 개발 블로그 10곳의 공통 구조 분석:
overreacted.io · joshwcomeau.com · kentcdodds.com · leerob.io · swyx.io · jvns.ca · martinfowler.com (해외) / 향로 jojoldu.tistory (기억보단 기록을) · velopert.com · toss.tech (국내)

**공통 패턴 7가지** → 템플릿에 반영:
1. frontmatter 메타 완비 (title/description/date/tags/series) — SEO·목록 자동화
2. 도입 3줄 훅 or TL;DR — 스크롤 결정은 첫 화면에서 남
3. 문제 → 과정 → 결과 서사 (기술 나열 아님)
4. 코드는 핵심만 + 실행 결과 표시
5. 배운 점/Next 마무리
6. 시리즈로 연속성 (재방문 유도)
7. 참고 링크 명시 (신뢰도)

→ `templates/` 4종 작성 완료: `troubleshooting` `deep-dive` `retrospective` `worklog`
→ 말투는 `docs/STYLE_GUIDE.md` 적용 (요구사항 5)

## 7. 자동 포스팅 스킬 설계 (요구사항 1)

**이름**: `blog-draft` (slog 레포 `.claude/skills/blog-draft/SKILL.md`)

**동작 흐름**:
```
사용자가 작업 후 /blog-draft 호출 (인자: 없으면 현재 세션 전체)
  1. 세션에서 한 작업을 의미 단위로 요약 (목표/내역/의사결정/막힌 것/결과)
  2. templates/worklog.md 구조 + STYLE_GUIDE.md 말투 적용해 초안 생성
  3. 시크릿·회사명·내부 URL 자동 마스킹 스캔 (grep 패턴)
  4. content/drafts/YYYY-MM-DD-slug.md 저장 (draft: true 고정)
  5. 사용자 검토 → draft: false + published 이동 → git commit
```

**안전 규칙**: 자동 공개 금지(항상 draft), 마스킹 체크리스트 통과 전 publish 불가, 훅으로 publish 시 secret-scan 실행
**확장(선택)**: Stop 훅으로 "오늘 작업 블로그 초안 만들까?" 제안 — Phase 3

## 8. 콘텐츠 이관 전략 (요구사항 4)

81편을 3등급 분류:
- **A급 (리라이트 후 공개, 10편)** — 이직 어필 핵심. 아래 큐레이션
- **B급 (가벼운 교정 후 이관, ~15편)** — TS/React/JS 코어 시리즈 후속
- **C급 (아카이브만, 나머지)** — 2021 학습노트·자격증·교육 일지는 비공개 보존

**A급 큐레이션 10편** (선정 기준: 실무성 > 깊이 > 최신성):

| # | 원글 | 템플릿 | 선정 이유 |
|---|------|--------|-----------|
| 219 | 다건·단건 파일 전송 (FormData/Multipart) | troubleshooting | 실무 서사 완성형, 최신 |
| 218 | Next.js standalone HTTPS 배포 | troubleshooting | 인프라까지 커버 증명 |
| 213 | 리액트 렌더링 최적화 총정리 | deep-dive | FE 면접 단골 주제 |
| 212 | 일급객체·프로토타입 정리 | deep-dive | JS 코어 이해 증명 |
| 210 | TS Enum·제네릭·내장(유틸리티) | deep-dive | TS 시리즈 3부 |
| 209 | TS 기초 필수 | deep-dive | TS 시리즈 2부 |
| 208 | TS Why (도입 이유) | deep-dive | TS 시리즈 1부 |
| 204 | 웹 기본 동작 (GET/POST/렌더링) | deep-dive | CS 기본기 증명 |
| 202 | 로그인 처리 방식 (Token/Session) | deep-dive | 보안·인증 이해 |
| 216 | 탭마다 로그인 정보 분리 | troubleshooting | 니치한 실무 문제 해결 |

## 9. 로드맵

| Phase | 내용 | 상태 |
|-------|------|------|
| **P1 기획·디자인** | 기획서, 스타일 가이드, 템플릿 4종, Figma 디자인, 샘플 변환 2편 | ✅ 오늘 |
| **P2 블로그 구축** | Next.js 스캐폴드 + 디자인 구현, A급 10편 이관, `slog` 레포 생성·Vercel 연결 | 다음 |
| **P3 자동화** | blog-draft 스킬 구현 + secret-scan 훅 | |
| **P4 공개·확장** | 도메인, SEO/OG, About 완성, 크로스포스팅(velog), 조회수 | |

## 10. 리스크

- **회사 정보 유출** — 일감 글에 내부 시스템명·인명 노출 위험 → 마스킹 규칙(템플릿 내장) + publish 전 secret-scan 훅
- **꾸준함** — worklog 자동화가 해결 장치. 주 1편이 목표치로 현실적
- **티스토리 중복 콘텐츠(SEO)** — 리라이트 글은 canonical 새 블로그 기준, 티스토리 원글에 이전 안내 추가 권장
