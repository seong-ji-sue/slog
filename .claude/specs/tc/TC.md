# TC — 추적 매트릭스 (blog + hot-issues feature, 누적)

> **소비 계약**: `prd/prd.contract.json` (Plan 미참조 — TC portability)
> **스킬 SSoT**: `bosu:tc-spec` · **규칙**: `RULES.md`
> **RED 상태**: ✅ 확정 (전체 스위트 55건 전부 LOGIC_ABSENT — B-01 재작성·B-04 삭제 반영 재실측)

---

## AC ↔ TC 매트릭스

| AC-ID | 화면 | layer | Given | When | Then (관측 가능) | spec 파일 | 테스트 제목 | RED | GREEN |
|-------|------|-------|-------|------|-----------------|-----------|------------|-----|-------|
| AC-B01-01 | B-01 홈 | render | 사이트 루트 진입 | 홈 페이지 렌더링 | logo-slog·nav-main·hero-title·text-bio·text-stat·link-posts·text-footer 전부 표시 | B-01.spec.js | AC-B01-01: 홈 페이지 렌더링 시 주요 구성 요소가 모두 표시됨 | ✅ RED (LOGIC_ABSENT) | ⏳ 실앱 대기 |
| AC-B01-01 | B-01 홈 | render | 사이트 루트 진입 | 홈 페이지 렌더링 | logo-slog 텍스트에 SLOG_ 포함 | B-01.spec.js | AC-B01-01: 홈 로고 텍스트가 SLOG_ 를 포함함 | ✅ RED (LOGIC_ABSENT) | ⏳ 실앱 대기 |
| AC-B01-01 | B-01 홈 | flow | link-posts 표시 상태 | 전체 글 보기 링크 클릭 | /posts URL로 이동 | B-01.spec.js | AC-B01-01: 전체 글 보기 링크 클릭 시 전체 글 목록 화면(B-02)으로 이동함 | ✅ RED (LOGIC_ABSENT) | ⏳ 실앱 대기 |
| AC-B01-03 | B-01 홈 | interaction | 라이트 모드 상태 | 다크모드 토글 클릭 | 페이지 팔레트 다크 전환 (html.dark 또는 data-theme=dark) | B-01.spec.js | AC-B01-03: 다크모드 토글 클릭 시 페이지 팔레트가 다크로 전환됨 | ✅ RED (LOGIC_ABSENT) | ⏳ 실앱 대기 |
| AC-B01-05 | B-01 홈 | flow | 홈 화면 렌더링 | 내비 '글' 링크 클릭 | /posts URL로 이동 | B-01.spec.js | AC-B01-05: 내비 글 링크 클릭 시 전체 글 목록 화면(B-02)으로 이동함 | ✅ RED (LOGIC_ABSENT) | ⏳ 실앱 대기 |
| AC-B01-07 | B-01 홈 | flow | 내비 메뉴 표시 상태 | 내비 '핫이슈' 링크 클릭 | 핫이슈 피드 목록(H-01)으로 URL 이동 | B-01.spec.js | AC-B01-07: 내비 핫이슈 링크 클릭 시 핫이슈 피드 목록 화면(H-01)으로 이동함 | ✅ RED (LOGIC_ABSENT) | ⏳ 실앱 대기 |
| AC-B02-01 | B-02 글 목록 | render | /posts 진입 | 화면 렌더링 | tab-filter·list-posts 표시 | B-02.spec.js | AC-B02-01: /posts 진입 시 필터 버튼 그룹과 글 카드 리스트가 표시됨 | ✅ RED (LOGIC_ABSENT) | ⏳ 실앱 대기 |
| AC-B02-02 | B-02 글 목록 | interaction | 전체 글 표시 상태 | 카테고리 필터 클릭 | 해당 카테고리 글만 노출 + 버튼 활성 상태 | B-02.spec.js | AC-B02-02: 카테고리 필터 클릭 시 해당 카테고리 글만 노출되고 버튼이 활성 상태가 됨 | ✅ RED (LOGIC_ABSENT) | ⏳ 실앱 대기 |
| AC-B02-03 | B-02 글 목록 | interaction | 카테고리 필터 활성 | '전체' 필터 클릭 | 모든 글 카드 복원 + 전체 버튼 활성 | B-02.spec.js | AC-B02-03: 전체 필터 클릭 시 모든 글이 복원됨 | ✅ RED (LOGIC_ABSENT) | ⏳ 실앱 대기 |
| AC-B02-04 | B-02 글 목록 | render | project 필드 있는 포스트 목록 포함 | 화면 렌더링 | badge-project 요소 표시 | B-02.spec.js | AC-B02-04: project 필드가 있는 포스트 카드에 project 배지가 표시됨 | ✅ RED (LOGIC_ABSENT) | ⏳ 실앱 대기 |
| AC-B03-01 | B-03 글 상세 | render | 글 상세 진입 | 화면 렌더링 | text-post-meta·text-post-title·text-tldr·list-keywords·text-body·list-refs·nav-series 전부 표시 | B-03.spec.js | AC-B03-01: 글 상세 진입 시 포스트 구성 요소가 모두 표시됨 | ✅ RED (LOGIC_ABSENT) | ⏳ 실앱 대기 |
| AC-B03-01 | B-03 글 상세 | render | 글 상세 진입 | 화면 렌더링 | TL;DR 블록에 'TL;DR' 텍스트 포함 | B-03.spec.js | AC-B03-01: TL;DR 블록이 TL;DR 텍스트를 포함함 | ✅ RED (LOGIC_ABSENT) | ⏳ 실앱 대기 |
| AC-B03-02 | B-03 글 상세 | interaction | 이전 글 존재 상태 | 이전 글 카드 클릭 | 이전 글 상세 URL로 이동 | B-03.spec.js | AC-B03-02: 시리즈 이전 글 카드 클릭 시 이전 글 상세로 이동함 | ✅ RED (LOGIC_ABSENT) | ⏳ 실앱 대기 |
| AC-B03-03 | B-03 글 상세 | interaction | 다음 글 존재 상태 | 다음 글 카드 클릭 | 다음 글 상세 URL로 이동 | B-03.spec.js | AC-B03-03: 시리즈 다음 글 카드 클릭 시 다음 글 상세로 이동함 | ✅ RED (LOGIC_ABSENT) | ⏳ 실앱 대기 |
| AC-B03-04 | B-03 글 상세 | render | project 필드 있는 글 상세 진입 | 화면 렌더링 | 포스트 헤더 메타 영역에 badge-project 표시 | B-03.spec.js | AC-B03-04: project 필드가 있는 글 상세 헤더 메타 영역에 project 배지가 표시됨 | ✅ RED (LOGIC_ABSENT) | ⏳ 실앱 대기 |
| AC-B05-01 | B-05 소개 | render | /about 진입 | 화면 렌더링 | text-bio-detail·list-stack·list-projects·list-contact 전부 표시 | B-05.spec.js | AC-B05-01: /about 진입 시 이력·스택·프로젝트·연락처 영역이 모두 표시됨 | ✅ RED (LOGIC_ABSENT) | ⏳ 실앱 대기 |
| AC-B05-02 | B-05 소개 | interaction | 프로젝트 링크 표시 | 프로젝트 링크 클릭 | 새 탭에서 외부 URL 열림 | B-05.spec.js | AC-B05-02: 프로젝트 링크 클릭 시 새 탭에서 외부 URL이 열림 | ✅ RED (LOGIC_ABSENT) | ⏳ 실앱 대기 |
| AC-B06-01 | B-06 태그 인덱스 | render | /tags 진입 | 화면 렌더링 | tab-view-toggle·list-tags 기본 목록 뷰로 표시 | B-06.spec.js | AC-B06-01: /tags 진입 시 뷰 전환 토글과 태그 목록이 기본 목록 뷰로 표시됨 | ✅ RED (LOGIC_ABSENT) | ⏳ 실앱 대기 |
| AC-B06-02 | B-06 태그 인덱스 | interaction | 목록 뷰 활성 상태 | '그래프 뷰' 토글 클릭 | list-graph 표시, list-tags 감춰짐 | B-06.spec.js | AC-B06-02: 그래프 뷰 토글 클릭 시 태그 co-occurrence 그래프가 표시되고 목록 뷰가 감춰짐 | ✅ RED (LOGIC_ABSENT) | ⏳ 실앱 대기 |
| AC-B06-03 | B-06 태그 인덱스 | flow | 목록 뷰 표시 상태 | 태그 클릭 | /tags/[tag] URL로 이동 | B-06.spec.js | AC-B06-03: 목록 뷰에서 태그 클릭 시 태그 상세 화면(B-07)으로 이동함 | ✅ RED (LOGIC_ABSENT) | ⏳ 실앱 대기 |
| AC-B06-04 | B-06 태그 인덱스 | flow | 그래프 뷰 활성 상태 | 그래프 태그 노드 클릭 | /tags/[tag] URL로 이동 | B-06.spec.js | AC-B06-04: 그래프 뷰에서 태그 노드 클릭 시 태그 상세 화면(B-07)으로 이동함 | ✅ RED (LOGIC_ABSENT) | ⏳ 실앱 대기 |
| AC-B07-01 | B-07 태그 상세 | render | /tags/[tag] 진입 | 화면 렌더링 | text-tag-title·list-posts-by-tag 표시 | B-07.spec.js | AC-B07-01: /tags/[tag] 진입 시 태그 제목과 포스트 카드 목록이 표시됨 | ✅ RED (LOGIC_ABSENT) | ⏳ 실앱 대기 |
| AC-B07-02 | B-07 태그 상세 | flow | 포스트 카드 목록 표시 | 포스트 카드 클릭 | 글 상세 URL로 이동 | B-07.spec.js | AC-B07-02: 태그별 포스트 카드 클릭 시 글 상세 화면(B-03)으로 이동함 | ✅ RED (LOGIC_ABSENT) | ⏳ 실앱 대기 |
| AC-H01-01 | H-01 핫이슈 목록 | render | 핫이슈 피드 목록 화면 진입 | 화면 로드 | 저장된 이슈가 카드 목록으로 수집 시각 최신순 표시 | H-01.spec.js | AC-H01-01: 핫이슈 피드 목록 화면 진입 시 카드 목록이 표시됨 | ✅ RED (LOGIC_ABSENT) | ⏳ 실앱 대기 |
| AC-H01-02 | H-01 핫이슈 목록 | interaction | 카드 표시 상태 | 검색어 입력 | 제목·요약·출처명 부분일치(공백 무시) 카드만 남음 | H-01.spec.js | AC-H01-02: 검색어 입력 시 제목·요약·출처명에 일치하는 카드만 목록에 남음 | ✅ RED (LOGIC_ABSENT) | ⏳ 실앱 대기 |
| AC-H01-03 | H-01 핫이슈 목록 | interaction | 검색·출처 필터 결과 0건 | 목록 화면 표시 | 결과 없음 안내 + 필터 초기화 버튼 표시 | H-01.spec.js | AC-H01-03: 검색·출처 필터 결과 0건 시 결과 없음 안내와 필터 초기화 버튼이 표시됨 | ✅ RED (LOGIC_ABSENT) | ⏳ 실앱 대기 |
| AC-H01-04 | H-01 핫이슈 목록 | render | 필터링 목록 20건 초과 | 목록 조회 | 20건 단위 페이지 + 페이지네이션 컨트롤 표시 | H-01.spec.js | AC-H01-04: 필터링된 목록이 20건 초과 시 페이지네이션 컨트롤과 함께 표시됨 | ✅ RED (LOGIC_ABSENT) | ⏳ 실앱 대기 |
| AC-H01-05 | H-01 핫이슈 목록 | interaction | 페이지네이션 표시 상태 | 페이지 번호 선택 | 해당 페이지 20건 이하 카드만 표시 | H-01.spec.js | AC-H01-05: 페이지 번호 선택 시 해당 페이지의 카드만 표시됨 | ✅ RED (LOGIC_ABSENT) | ⏳ 실앱 대기 |
| AC-H01-06 | H-01 핫이슈 목록 | interaction | 출처 필터 탭 표시 상태 | 출처 탭 선택 | 선택 출처 카드만 표시 | H-01.spec.js | AC-H01-06: 출처 탭 선택 시 해당 출처에서 수집된 카드만 표시됨 | ✅ RED (LOGIC_ABSENT) | ⏳ 실앱 대기 |
| AC-H01-07 | H-01 핫이슈 목록 | flow | 카드 표시 상태 | 카드 클릭 | 핫이슈 상세(H-02)로 이동 | H-01.spec.js | AC-H01-07: 카드 클릭 시 해당 이슈의 상세 화면(H-02)으로 이동함 | ✅ RED (LOGIC_ABSENT) | ⏳ 실앱 대기 |
| AC-H01-08 | H-01 핫이슈 목록 | render | 데이터 로딩 중 | 화면 진입 | 카드 형태 스켈레톤 표시 | H-01.spec.js | AC-H01-08: 데이터 로딩 중 카드 형태의 스켈레톤이 표시됨 | ✅ RED (LOGIC_ABSENT) | ⏳ 실앱 대기 |
| AC-H01-09 | H-01 핫이슈 목록 | render | 저장된 이슈 0건 | 화면 렌더링 | 전체 이슈 0건 안내 문구 표시 | H-01.spec.js | AC-H01-09: 저장된 이슈가 0건일 때 안내 문구가 표시됨 | ✅ RED (LOGIC_ABSENT) | ⏳ 실앱 대기 |
| AC-H01-10 | H-01 핫이슈 목록 | render | 목록 조회 실패 | 화면 조회 | 에러 안내 + 재시도 버튼 표시 | H-01.spec.js | AC-H01-10: 목록 조회 실패 시 에러 안내와 재시도 버튼이 표시됨 | ✅ RED (LOGIC_ABSENT) | ⏳ 실앱 대기 |
| AC-H01-11 | H-01 핫이슈 목록 | interaction | 조회 실패 안내 표시 상태 | 재시도 버튼 클릭 | 재조회 성공 시 카드 목록 표시 | H-01.spec.js | AC-H01-11: 재시도 버튼 클릭 시 재조회 성공하면 카드 목록이 표시됨 | ✅ RED (LOGIC_ABSENT) | ⏳ 실앱 대기 |
| AC-H01-12 | H-01 핫이슈 목록 | interaction | 1페이지가 아닌 페이지 표시 상태 | 검색어 입력 | 목록 1페이지로 재설정 | H-01.spec.js | AC-H01-12: 1페이지가 아닌 상태에서 검색어 입력 시 목록이 1페이지로 재설정됨 | ✅ RED (LOGIC_ABSENT) | ⏳ 실앱 대기 |
| AC-H01-13 | H-01 핫이슈 목록 | interaction | 1페이지가 아닌 페이지 표시 상태 | 출처 탭 변경 | 목록 1페이지로 재설정 | H-01.spec.js | AC-H01-13: 1페이지가 아닌 상태에서 출처 탭 변경 시 목록이 1페이지로 재설정됨 | ✅ RED (LOGIC_ABSENT) | ⏳ 실앱 대기 |
| AC-H01-14 | H-01 핫이슈 목록 | interaction | 5페이지 창 초과 페이지 수 | 다음 페이지 창 이동 선택 | 다음 5페이지 단위 창 번호 표시 | H-01.spec.js | AC-H01-14: 5페이지 창을 초과하는 페이지 수에서 다음 페이지 창 이동 시 다음 페이지 번호들이 표시됨 | ✅ RED (LOGIC_ABSENT) | ⏳ 실앱 대기 |
| AC-H01-15 | H-01 핫이슈 목록 | interaction | 결과 없음 안내 + 필터 초기화 버튼 표시 상태 | 필터 초기화 버튼 클릭 | 검색어·출처 필터 해제, 전체 목록 복원 | H-01.spec.js | AC-H01-15: 결과 없음 안내 상태에서 필터 초기화 버튼 클릭 시 검색어·출처 필터가 해제되고 전체 목록이 복원됨 | ✅ RED (LOGIC_ABSENT) | ⏳ 실앱 대기 |
| AC-H02-01 | H-02 핫이슈 상세 | render | 핫이슈 상세 화면 진입 | 화면 렌더링 | 제목·요약·출처명·수집일·원문 링크 전부 표시 | H-02.spec.js | AC-H02-01: 핫이슈 상세 화면 렌더링 시 제목·요약·출처명·수집일·원문 링크가 모두 표시됨 | ✅ RED (LOGIC_ABSENT) | ⏳ 실앱 대기 |
| AC-H02-02 | H-02 핫이슈 상세 | interaction | 원문 링크 표시 상태 | 원문 링크 선택 | 새 탭에서 원문 오픈, 현재 화면 유지 | H-02.spec.js | AC-H02-02: 원문 링크 선택 시 원문 페이지가 새 탭에서 열림(상세 화면은 그대로 유지됨) | ✅ RED (LOGIC_ABSENT) | ⏳ 실앱 대기 |
| AC-H02-03 | H-02 핫이슈 상세 | render | 존재하지 않는 식별자 접근 | 화면 렌더링 | 존재하지 않음 안내 + 목록으로 돌아가기 링크 표시 | H-02.spec.js | AC-H02-03: 존재하지 않는 식별자 접근 시 안내 문구와 목록으로 돌아가기 링크가 표시됨 | ✅ RED (LOGIC_ABSENT) | ⏳ 실앱 대기 |
| AC-H02-04 | H-02 핫이슈 상세 | flow | 존재하지 않음 안내 표시 상태 | 목록으로 돌아가기 링크 클릭 | 핫이슈 피드 목록(H-01)으로 이동 | H-02.spec.js | AC-H02-04: 존재하지 않음 안내 상태에서 목록으로 돌아가기 링크 클릭 시 핫이슈 피드 목록(H-01)으로 이동함 | ✅ RED (LOGIC_ABSENT) | ⏳ 실앱 대기 |
| AC-H02-05 | H-02 핫이슈 상세 | render | 요약 생성 실패 이슈 | 화면 렌더링 | 요약 누락 안내 + 원문 링크 표시 | H-02.spec.js | AC-H02-05: 요약 생성 실패 이슈의 상세 화면에서 요약 누락 안내와 원문 링크가 표시됨 | ✅ RED (LOGIC_ABSENT) | ⏳ 실앱 대기 |
| AC-H02-06 | H-02 핫이슈 상세 | render | 상세 데이터 로딩 중 | 화면 진입 | 제목 라인 + 요약 문단 스켈레톤 표시 | H-02.spec.js | AC-H02-06: 상세 데이터 로딩 중 제목 라인과 요약 문단 형태의 스켈레톤이 표시됨 | ✅ RED (LOGIC_ABSENT) | ⏳ 실앱 대기 |

---

## 커버리지 요약

| 화면 | AC 수 | 테스트 수 | render ≥1 |
|------|-------|-----------|-----------|
| B-01 | 4 | 6 | ✓ |
| B-02 | 4 | 4 | ✓ |
| B-03 | 4 | 5 | ✓ |
| B-05 | 2 | 2 | ✓ |
| B-06 | 4 | 4 | ✓ |
| B-07 | 2 | 2 | ✓ |
| H-01 | 15 | 15 | ✓ |
| H-02 | 6 | 6 | ✓ |
| **합계** | **41** | **44** | ✓ |

> B-01의 AC-B01-07은 hot-issues 피처가 추가한 AC(내비 '핫이슈' 링크).
> [재작업] B-01: list-feed·badge-project 컴포넌트 제거 + link-posts 추가 반영 — AC-B01-01 갱신(components에서 link-posts로 교체), AC-B01-02/04/06(포스트 피드 의존) 삭제. B-04(시리즈) 화면·AC-B04-01/02 전체 삭제 — `/series` 페이지는 과거에 통째로 제거됨(git 커밋 082bb36).

---

## Unknowns 영향

| Unknown | 영향 AC | 처리 |
|---------|---------|------|
| U-001: 시리즈 경계 처리 미확정 | AC-B03-02, AC-B03-03 | 이전/다음 글 존재 케이스만 검증. 경계 케이스(미표시 vs 비활성)는 impl 단계 결정 후 추가 TC 가능. blocking=false |
| U-002: About 콘텐츠 미제공 | AC-B05-01 | 영역 존재 여부만 단언. 실제 콘텐츠 값 단언 불가. blocking=false |
| U-003: 다크 팔레트 값 미확정 | AC-B01-03 | 전환 동작(class/attr 변화)만 단언. 색상값 단언 불가. blocking=false |
| U-004: project 배지 보유 포스트 존재 여부 미확정 | AC-B02-04, AC-B03-04 | project 배지가 있는 데이터가 실앱에 존재해야 GREEN 가능. blocking=false |
| U-005: 태그 co-occurrence 그래프 노드 구현 미확정 | AC-B06-04 | 그래프 뷰 내 링크 역할 요소 존재 가정. 구현 시 data-testid 부착 필요. blocking=false |
| U-006: 핫이슈 실데이터 보유 여부 미확정 | AC-H01-01, AC-H01-02, AC-H01-04, AC-H01-05, AC-H01-06, AC-H01-07 | 정렬·검색·페이지네이션·출처 필터·카드 클릭 이동은 실제 수집 데이터가 20건 초과·다출처로 존재해야 GREEN 가능. blocking=false |
| U-007: 핫이슈 목록 조회 실패/재시도 트리거 방식 미확정 | AC-H01-10, AC-H01-11 | 실패 상태를 인위적으로 재현하는 방법(네트워크 차단 등)은 impl 단계 확정 후 결정. blocking=false |
| U-008: 5페이지 창 초과 데이터 준비 방식 미확정 | AC-H01-14 | 페이지 수가 5페이지 창(100건 초과)을 넘는 시드 데이터가 실앱에 있어야 GREEN 가능. blocking=false |
| U-009: 요약 생성 실패 이슈 데이터 준비 방식 미확정 | AC-H02-05 | 요약 누락 상태의 이슈가 실앱에 존재해야 GREEN 가능. blocking=false |
| U-010: 존재하지 않는 식별자 접근 경로 미확정 | AC-H02-03, AC-H02-04 | 상세 화면 진입 시 임의/존재하지 않는 식별자로 접근하는 라우팅 방식은 impl 단계에서 확정. blocking=false |

---

## 금지 패턴 준수 확인

- `waitForTimeout` 사용: 0건
- `test.skip(` 사용: 0건
- expect 없는 test: 0건
- 시간/랜덤 의존: 0건
- CSS/텍스트 직접 셀렉터(계약 외 key): 0건
- 목업 HTML 생성: 0건
