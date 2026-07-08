# TC — 추적 매트릭스 (blog feature)

> **소비 계약**: `prd/prd.contract.json` (Plan 미참조 — TC portability)
> **스킬 SSoT**: `bosu:tc-spec` · **규칙**: `RULES.md`
> **RED 상태**: 미확정 (red_run.sh 실행 전)

---

## AC ↔ TC 매트릭스

| AC-ID | 화면 | layer | Given | When | Then (관측 가능) | spec 파일 | 테스트 제목 | RED | GREEN |
|-------|------|-------|-------|------|-----------------|-----------|------------|-----|-------|
| AC-B01-01 | B-01 홈 | render | 사이트 루트 진입 | 홈 페이지 렌더링 | logo-slog·nav-main·hero-title·text-bio·text-stat·list-feed·text-footer 전부 표시 | B-01.spec.js | AC-B01-01: 홈 페이지 렌더링 시 주요 구성 요소가 모두 표시됨 | - | - |
| AC-B01-01 | B-01 홈 | render | 사이트 루트 진입 | 홈 페이지 렌더링 | logo-slog 텍스트에 SLOG_ 포함 | B-01.spec.js | AC-B01-01: 홈 로고 텍스트가 SLOG_ 를 포함함 | - | - |
| AC-B01-02 | B-01 홈 | interaction | 포스트 카드 렌더링 | 카드 hover | 형광펜 mark 애니메이션 적용 | B-01.spec.js | AC-B01-02: 포스트 카드에 마우스를 올리면 형광펜 애니메이션이 적용됨 | - | - |
| AC-B01-03 | B-01 홈 | interaction | 라이트 모드 상태 | 다크모드 토글 클릭 | 페이지 팔레트 다크 전환 (html.dark 또는 data-theme=dark) | B-01.spec.js | AC-B01-03: 다크모드 토글 클릭 시 페이지 팔레트가 다크로 전환됨 | - | - |
| AC-B01-04 | B-01 홈 | flow | 홈 화면 렌더링 | 포스트 카드 클릭 | B-03 글 상세로 URL 이동 | B-01.spec.js | AC-B01-04: 포스트 카드 클릭 시 글 상세(B-03)로 이동함 | - | - |
| AC-B01-05 | B-01 홈 | flow | 홈 화면 렌더링 | 내비 '글' 링크 클릭 | /posts URL로 이동 | B-01.spec.js | AC-B01-05: 내비 글 링크 클릭 시 전체 글 목록 화면(B-02)으로 이동함 | - | - |
| AC-B02-01 | B-02 글 목록 | render | /posts 진입 | 화면 렌더링 | tab-filter·list-posts 표시 | B-02.spec.js | AC-B02-01: /posts 진입 시 필터 버튼 그룹과 글 카드 리스트가 표시됨 | - | - |
| AC-B02-02 | B-02 글 목록 | interaction | 전체 글 표시 상태 | 카테고리 필터 클릭 | 해당 카테고리 글만 노출 + 버튼 활성 상태 | B-02.spec.js | AC-B02-02: 카테고리 필터 클릭 시 해당 카테고리 글만 노출되고 버튼이 활성 상태가 됨 | - | - |
| AC-B02-03 | B-02 글 목록 | interaction | 카테고리 필터 활성 | '전체' 필터 클릭 | 모든 글 카드 복원 + 전체 버튼 활성 | B-02.spec.js | AC-B02-03: 전체 필터 클릭 시 모든 글이 복원됨 | - | - |
| AC-B03-01 | B-03 글 상세 | render | 글 상세 진입 | 화면 렌더링 | text-post-meta·text-post-title·text-tldr·list-keywords·text-body·list-refs·nav-series 전부 표시 | B-03.spec.js | AC-B03-01: 글 상세 진입 시 포스트 구성 요소가 모두 표시됨 | - | - |
| AC-B03-01 | B-03 글 상세 | render | 글 상세 진입 | 화면 렌더링 | TL;DR 블록에 'TL;DR' 텍스트 포함 | B-03.spec.js | AC-B03-01: TL;DR 블록이 TL;DR 텍스트를 포함함 | - | - |
| AC-B03-02 | B-03 글 상세 | interaction | 이전 글 존재 상태 | 이전 글 카드 클릭 | 이전 글 상세 URL로 이동 | B-03.spec.js | AC-B03-02: 시리즈 이전 글 카드 클릭 시 이전 글 상세로 이동함 | - | - |
| AC-B03-03 | B-03 글 상세 | interaction | 다음 글 존재 상태 | 다음 글 카드 클릭 | 다음 글 상세 URL로 이동 | B-03.spec.js | AC-B03-03: 시리즈 다음 글 카드 클릭 시 다음 글 상세로 이동함 | - | - |
| AC-B04-01 | B-04 시리즈 | render | /series 진입 | 화면 렌더링 | list-series 표시 | B-04.spec.js | AC-B04-01: /series 진입 시 시리즈 카드 목록이 표시됨 | - | - |
| AC-B04-02 | B-04 시리즈 | interaction | 시리즈 카드 목록 표시 | 시리즈 카드 클릭 | list-series-posts 표시 | B-04.spec.js | AC-B04-02: 시리즈 카드 클릭 시 해당 시리즈 글 목록이 표시됨 | - | - |
| AC-B05-01 | B-05 소개 | render | /about 진입 | 화면 렌더링 | text-bio-detail·list-stack·list-projects·list-contact 전부 표시 | B-05.spec.js | AC-B05-01: /about 진입 시 이력·스택·프로젝트·연락처 영역이 모두 표시됨 | - | - |
| AC-B05-02 | B-05 소개 | interaction | 프로젝트 링크 표시 | 프로젝트 링크 클릭 | 새 탭에서 외부 URL 열림 | B-05.spec.js | AC-B05-02: 프로젝트 링크 클릭 시 새 탭에서 외부 URL이 열림 | - | - |

---

## 커버리지 요약

| 화면 | AC 수 | 테스트 수 | render ≥1 |
|------|-------|-----------|-----------|
| B-01 | 5 | 6 | ✓ |
| B-02 | 3 | 3 | ✓ |
| B-03 | 3 | 4 | ✓ |
| B-04 | 2 | 2 | ✓ |
| B-05 | 2 | 2 | ✓ |
| **합계** | **15** | **17** | ✓ |

---

## Unknowns 영향

| Unknown | 영향 AC | 처리 |
|---------|---------|------|
| U-001: 시리즈 경계 처리 미확정 | AC-B03-02, AC-B03-03 | 이전/다음 글 존재 케이스만 검증. 경계 케이스(미표시 vs 비활성)는 impl 단계 결정 후 추가 TC 가능. blocking=false |
| U-002: About 콘텐츠 미제공 | AC-B05-01 | 영역 존재 여부만 단언. 실제 콘텐츠 값 단언 불가. blocking=false |
| U-003: 다크 팔레트 값 미확정 | AC-B01-03 | 전환 동작(class/attr 변화)만 단언. 색상값 단언 불가. blocking=false |

---

## 금지 패턴 준수 확인

- `waitForTimeout` 사용: 0건
- `test.skip(` 사용: 0건
- expect 없는 test: 0건
- 시간/랜덤 의존: 0건
- CSS/텍스트 직접 셀렉터(계약 외 key): 0건
- 목업 HTML 생성: 0건
