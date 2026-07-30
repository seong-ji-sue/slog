# 회의록 — 글 목록 검색·페이지네이션 + 상단 nav 고정

- **일시**: 2026-07-30 20:10
- **작업 단위**: `/posts` 목록 페이지에 검색·페이지네이션 추가, 상단 헤더 sticky 고정
- **참석**: 사용자, 팀장
- **작성**: 팀장

---

## 배경

콘텐츠가 126개까지 늘어나며 `/posts` 페이지가 전체 목록을 스크롤로만 훑어야 하는 상태 — 사용자가 검색·페이지네이션·상단 nav 고정을 요청.

---

## 주요 논의

> **팀장**: 신규 기능이라 CLAUDE.md 규정상 Gemini 조사 필수 호출 후 진행. Next.js 15 App Router 정적 블로그(런타임 DB 없음, 빌드 타임 `fs` 파싱)에서 검색·페이지네이션 구현 방식과 sticky 헤더 함정을 질의함.

Gemini 조사 요지:
- 검색: 126개 규모는 제목/설명/태그 대상이면 순수 JS(정규화+`includes`)로 충분, Fuse.js 등 fuzzy 라이브러리는 본문 전체 검색이나 오타 교정이 필요할 때만 이득
- 페이지네이션: App Router 표준은 URL 쿼리(`?page=`) 기반 Server Component slice지만, 이 프로젝트는 카테고리 필터가 이미 `PostsFilter.tsx`의 client state(`useState`)라 일관성을 위해 페이지네이션도 client state로 구현하기로 결정 (URL 쿼리 방식 채택 안 함 — 트레이드오프: 페이지 URL 공유·SEO 인덱싱 불가, 추후 필요시 재검토)
- 검색+페이지네이션 결합: 검색어/카테고리 변경 시 항상 1페이지로 리셋
- sticky 헤더: 부모 `overflow:hidden` 여부, `z-index` 명시, 반투명 배경으로 인한 콘텐츠 겹침(→ `backdrop-filter`+반투명 배경 필요), 앵커 스크롤 시 헤더에 가려지는 문제(→ `scroll-padding-top`)

---

## 기술 결정

| 결정 항목 | 선택 | 이유 |
|----------|------|------|
| 검색 구현 | 순수 JS (`normalize` + `includes`, 제목/설명/태그 대상) | 126개 규모에 라이브러리 오버헤드 불필요, 외부 의존성 추가 회피 |
| 페이지네이션 방식 | client state (`useState`, `PAGE_SIZE=20`) | 기존 카테고리 필터와 동일 패턴 유지 — 일관성 우선 |
| 페이지 리셋 타이밍 | 렌더 중 상태 조정 패턴(`filterKey` 비교 후 즉시 `setPage(1)`) | code-reviewer 1차 검토에서 `useEffect` 기반 리셋이 1프레임 stale 슬라이스를 유발함을 지적받아 교체 |
| sticky 헤더 | `position: sticky; top:0; z-index:50` + `color-mix` 반투명 배경 + `backdrop-filter: blur(8px)`, `html { scroll-padding-top }` | Gemini 조사 근거 — 콘텐츠 겹침·앵커 오프셋 문제 사전 차단 |
| 담당 | `ui_developer` 에이전트 dispatch (worktree) | Agent Dispatch Criteria 표(Frontend UI) |

---

## 완료 사항

- ✅ 팀장: Gemini 조사 완료, 기술 결정 확정, 회의록 작성
- ✅ ui_developer: `feature/search-pagination-sticky-nav` 브랜치(워크트리)에서 구현 — `components/PostsFilter.tsx`(검색+페이지네이션), `app/globals.css`+`app/posts/posts.css`(sticky 헤더·스타일)
- ✅ 팀장: `npx tsc --noEmit` + `npm run build` 통과 확인
- ✅ code-reviewer: 1차 검토 major 1건(useEffect stale render)·minor 2건 → 팀장이 직접 수정 → 2차 검토 critical/major 0건 승인

---

## 다음 액션

- [ ] 팀장: develop 로컬 병합 + worktree 정리
- [ ] 팀장: 사용자 승인 후 `git push origin develop`

---

## 미결/보류

| 항목 | 내용 | 담당 | 재검토 시점 |
|------|------|------|------------|
| 페이지네이션 URL 쿼리화 | 현재 client state — 페이지 URL 공유/SEO 인덱싱 필요해지면 `?page=` 기반으로 전환 검토 | 팀장 | 트래픽/SEO 니즈 발생 시 |
| `/tags`, `/series` 목록 페이지 페이지네이션 | 이번 스코프는 `/posts`만 — 다른 목록 페이지는 미적용 | 팀장 | 사용자 요청 시 |
