# PLAN_blog

## 헤더

| 항목 | 내용 |
|------|------|
| consumes | `prd/prd.contract.json` (acs[] + screens[]) |
| task 수 | 23건 (frontend 19 + backend 4) |
| AC 커버리지 | 23/23 (100%) |

---

## 태스크 표 (구현 순서)

| task_id | kind | target 요약 | ac_refs | depends_on |
|---------|------|-------------|---------|------------|
| TASK-BE-1 | backend | 글 목록 조회 계약 (project nullable 포함) | AC-B01-04, AC-B02-01~03 | — |
| TASK-BE-2 | backend | 글 상세 조회 계약 (seriesPrev/Next, project nullable 포함) | AC-B03-01~03 | — |
| TASK-BE-3 | backend | 시리즈 목록·상세 조회 계약 | AC-B04-01~02 | — |
| TASK-BE-4 | backend | 태그 목록·co-occurrence·태그별 포스트 조회 계약 | AC-B06-01~04, AC-B07-01~02 | — |
| TASK-B01-1 | frontend | B-01 홈 전체 레이아웃 (헤더·히어로·피드·푸터) | AC-B01-01 | — |
| TASK-B02-1 | frontend | B-02 전체 글 목록 레이아웃 (필터+카드 리스트) | AC-B02-01 | — |
| TASK-B05-1 | frontend | B-05 About 레이아웃 (이력·스택·프로젝트·연락처) | AC-B05-01 | — |
| TASK-B01-2 | frontend | B-01 포스트 카드 hover 형광펜 스윕 애니메이션 | AC-B01-02 | TASK-B01-1 |
| TASK-B01-3 | frontend | 다크모드 토글 팔레트 전환 | AC-B01-03 | TASK-B01-1 |
| TASK-B03-1 | frontend | B-03 글 상세 전체 레이아웃 | AC-B03-01 | TASK-BE-2 |
| TASK-B04-1 | frontend | B-04 시리즈 카드 목록 레이아웃 | AC-B04-01 | TASK-BE-3 |
| TASK-B05-2 | frontend | B-05 프로젝트 링크 새 탭 열기 플로우 | AC-B05-02 | TASK-B05-1 |
| TASK-B06-1 | frontend | B-06 태그 인덱스 기본 레이아웃 (토글+목록 뷰) | AC-B06-01 | TASK-BE-4 |
| TASK-B07-1 | frontend | B-07 태그 상세 레이아웃 (태그 제목+포스트 목록) | AC-B07-01 | TASK-BE-4 |
| TASK-B02-2 | frontend | B-02 카테고리 필터 인터랙션 | AC-B02-02~03 | TASK-B02-1, TASK-BE-1 |
| TASK-B03-2 | frontend | B-03 시리즈 내비 이전/다음 클릭 플로우 | AC-B03-02~03 | TASK-B03-1 |
| TASK-B04-2 | frontend | B-04 시리즈 카드 클릭 → 글 목록 표시 인터랙션 | AC-B04-02 | TASK-B04-1, TASK-BE-3 |
| TASK-B06-2 | frontend | B-06 그래프 뷰 토글 및 co-occurrence 그래프 표시 | AC-B06-02 | TASK-B06-1 |
| TASK-B01-4 | frontend | B-01 포스트 카드 클릭 → B-03 이동 플로우 | AC-B01-04 | TASK-B01-1, TASK-B03-1 |
| TASK-B01-5 | frontend | B-01 내비 '글' 클릭 → B-02 이동 플로우 | AC-B01-05 | TASK-B01-1, TASK-B02-1 |
| TASK-B07-2 | frontend | B-07 포스트 카드 클릭 → B-03 이동 플로우 | AC-B07-02 | TASK-B07-1, TASK-B03-1 |
| TASK-B01-6 | frontend | project 배지 컴포넌트 구현 및 B-01·B-02·B-03 조건부 표시 | AC-B01-06, AC-B02-04, AC-B03-04 | TASK-B01-1, TASK-B02-1, TASK-B03-1 |
| TASK-B06-3 | frontend | B-06 목록·그래프 태그 클릭 → B-07 이동 플로우 | AC-B06-03~04 | TASK-B06-1, TASK-B06-2, TASK-B07-1 |

---

## task 상세

---

### TASK-BE-1 — 글 목록 조회 계약

**kind**: backend | **depends_on**: 없음 (병렬 가능)

**ac_refs 인용**

| AC-ID | Given | When | Then |
|-------|-------|------|------|
| AC-B01-04 | 홈 화면이 렌더링된 상태 | 포스트 카드를 클릭 | 해당 글 상세 화면(B-03)으로 이동함 |
| AC-B02-01 | /posts 화면에 진입한 상태 | 화면이 렌더링됨 | 카테고리 필터 버튼 그룹과 전체 글 카드 리스트가 표시됨 |
| AC-B02-02 | /posts 화면에 전체 글이 표시된 상태 | 특정 카테고리 필터 버튼을 클릭 | 해당 카테고리에 속하는 글 카드만 목록에 남고 선택된 필터 버튼이 활성 상태로 표시됨 |
| AC-B02-03 | 특정 카테고리 필터가 활성인 상태 | '전체' 필터 버튼을 클릭 | 모든 글 카드가 목록에 복원됨 |

**steps**
1. 글 목록 조회 계약(slug, lognum, title, description, category, date, difficulty, readingTime, project 포함; project는 nullable)을 정의하고 구현
2. 카테고리 값을 파라미터로 받아 해당 카테고리 글 목록만 반환하는 필터 계약 구현
3. 계약 응답 형식이 PRD backend 명세와 일치하는지 확인

**success_criteria**: AC-B02-01 GREEN, AC-B02-02 GREEN, AC-B02-03 GREEN

---

### TASK-BE-2 — 글 상세 조회 계약

**kind**: backend | **depends_on**: 없음 (병렬 가능)

**ac_refs 인용**

| AC-ID | Given | When | Then |
|-------|-------|------|------|
| AC-B03-01 | 특정 글 상세 페이지에 진입한 상태 | 화면이 렌더링됨 | 포스트 헤더, h1 제목, TL;DR 블록, 키워드 프리뷰, 본문, 참고한 링크 섹션, 시리즈 내비 카드가 모두 표시됨 |
| AC-B03-02 | 글 상세 본문이 표시된 상태이고 이전 글이 존재하는 상태 | 시리즈 내비의 이전 글 카드를 클릭 | 이전 글 상세 화면으로 이동함 |
| AC-B03-03 | 글 상세 본문이 표시된 상태이고 다음 글이 존재하는 상태 | 시리즈 내비의 다음 글 카드를 클릭 | 다음 글 상세 화면으로 이동함 |

**steps**
1. 글 상세 조회 계약(slug, lognum, title, description, category, date, difficulty, readingTime, tldr, keywords, body, seriesPrev, seriesNext, refs, project 포함; project는 nullable)을 정의하고 구현
2. seriesPrev·seriesNext 필드로 시리즈 이전/다음 글 참조 정보를 제공하여 nav-series 인터랙션 지원
3. 계약 응답 형식이 PRD backend 명세와 일치하는지 확인

**success_criteria**: AC-B03-01 GREEN, AC-B03-02 GREEN, AC-B03-03 GREEN

---

### TASK-BE-3 — 시리즈 목록·상세 조회 계약

**kind**: backend | **depends_on**: 없음 (병렬 가능)

**ac_refs 인용**

| AC-ID | Given | When | Then |
|-------|-------|------|------|
| AC-B04-01 | /series 화면에 진입한 상태 | 화면이 렌더링됨 | 시리즈 카드 목록이 시리즈 제목·글 수·최신 업데이트 날짜와 함께 표시됨 |
| AC-B04-02 | /series 화면에 시리즈 카드 목록이 표시된 상태 | 특정 시리즈 카드를 클릭 | 해당 시리즈 글 목록(순서 번호 포함)이 표시됨 |

**steps**
1. 시리즈 목록 조회 계약(seriesId, title, postCount, lastUpdated 포함)을 정의하고 구현
2. 시리즈 상세 조회 계약(해당 시리즈 글 목록을 순서 번호 order 포함하여 반환)을 정의하고 구현
3. 계약 응답 형식이 PRD backend 명세와 일치하는지 확인

**success_criteria**: AC-B04-01 GREEN, AC-B04-02 GREEN

---

### TASK-BE-4 — 태그 관련 조회 계약

**kind**: backend | **depends_on**: 없음 (병렬 가능)

**ac_refs 인용**

| AC-ID | Given | When | Then |
|-------|-------|------|------|
| AC-B06-01 | /tags 화면에 진입한 상태 | 화면이 렌더링됨 | 뷰 전환 토글과 태그 목록(태그명 + 글 수)이 기본 목록 뷰로 표시됨 |
| AC-B06-02 | /tags 화면에서 목록 뷰가 활성인 상태 | '그래프 뷰' 토글을 클릭 | 태그 co-occurrence 그래프가 표시되며 목록 뷰는 감춰짐 |
| AC-B06-03 | /tags 화면에서 목록 뷰가 표시된 상태 | 목록의 특정 태그를 클릭 | 해당 태그 상세 화면(B-07)으로 이동함 |
| AC-B06-04 | /tags 화면에서 그래프 뷰가 표시된 상태 | 그래프의 특정 태그 노드를 클릭 | 해당 태그 상세 화면(B-07)으로 이동함 |
| AC-B07-01 | /tags/[tag] 화면에 진입한 상태 | 화면이 렌더링됨 | 태그 제목('#[태그명]')과 해당 태그가 포함된 포스트 카드 목록이 표시됨 |
| AC-B07-02 | /tags/[tag] 화면에 포스트 카드 목록이 표시된 상태 | 포스트 카드를 클릭 | 해당 글 상세 화면(B-03)으로 이동함 |

**steps**
1. 태그 목록 조회 계약(tag, postCount 포함)을 정의하고 구현
2. 태그 co-occurrence 조회 계약(source, target, weight 엣지 목록; weight = 동일 글에 공존한 수; 고립 태그 제외)을 정의하고 구현
3. 태그별 포스트 조회 계약(tag 식별자 파라미터로 해당 태그 포함 포스트 목록 반환)을 정의하고 구현
4. 계약 응답 형식이 PRD backend 명세와 일치하는지 확인

**success_criteria**: AC-B06-01 GREEN, AC-B06-02 GREEN, AC-B06-03 GREEN, AC-B06-04 GREEN, AC-B07-01 GREEN, AC-B07-02 GREEN

---

### TASK-B01-1 — 화면 B-01 홈 전체 레이아웃

**kind**: frontend | **depends_on**: 없음 (병렬 가능)

**ac_refs 인용**

| AC-ID | Given | When | Then |
|-------|-------|------|------|
| AC-B01-01 | 사이트 루트에 진입한 상태 | 홈 페이지가 렌더링됨 | 로고(SLOG_), 내비 메뉴(글·시리즈·소개·RSS), 히어로 제목, bio 2줄, 통계 라인, 포스트 카드 리스트, 푸터가 모두 화면에 표시됨 |

**steps**
1. prd.contract.json screens[B-01].components 전수 확인 — logo-slog·nav-main·button-darkmode·hero-title·text-bio·text-stat·list-feed·text-footer
2. 헤더 영역(logo-slog·nav-main·button-darkmode)을 계약 key 기준으로 구현하고 스택 표준 마커 부착
3. 히어로 영역(hero-title·text-bio·text-stat)을 계약 key 기준으로 구현하고 마커 부착
4. 포스트 카드 피드(list-feed) 컴포넌트를 구현하고 LOG 번호·카테고리·제목·설명·날짜·난이도·읽기 시간 포함
5. 푸터(text-footer)를 구현하고 마커 부착
6. 각 컴포넌트에 계약 key 기준 스택 표준 마커를 부착 (스택 어댑터 위임)

**success_criteria**: AC-B01-01 GREEN

---

### TASK-B01-2 — 포스트 카드 hover 형광펜 스윕 애니메이션

**kind**: frontend | **depends_on**: TASK-B01-1

**ac_refs 인용**

| AC-ID | Given | When | Then |
|-------|-------|------|------|
| AC-B01-02 | 홈 피드에 포스트 카드가 렌더링된 상태 | 포스트 카드 위에 마우스를 올림 | 카드 제목의 형광펜 mark가 스윕 애니메이션으로 나타남 |

**steps**
1. list-feed 컴포넌트의 카드 hover 상태를 감지하는 인터랙션 로직 구현
2. 카드 제목에 형광펜 mark가 background-size 0% → 100% 스윕 전환으로 나타나는 애니메이션 구현
3. prefers-reduced-motion 미디어 쿼리 활성 시 전환(transition)을 제거하는 분기 처리

**success_criteria**: AC-B01-02 GREEN

---

### TASK-B01-3 — 다크모드 토글 팔레트 전환

**kind**: frontend | **depends_on**: TASK-B01-1

**ac_refs 인용**

| AC-ID | Given | When | Then |
|-------|-------|------|------|
| AC-B01-03 | 홈 화면이 라이트 모드로 렌더링된 상태 | 다크모드 토글을 클릭 | 전체 페이지 배경·텍스트 색상이 다크 팔레트로 전환됨 |

**steps**
1. button-darkmode 컴포넌트에 클릭 이벤트 핸들러 연결
2. 클릭 시 전체 페이지 배경·텍스트 색상을 다크 팔레트로 전환하는 상태 토글 구현
3. 재클릭 시 라이트 팔레트로 복원되는 동작 구현
4. 라이트 모드를 기본 상태로 유지

**success_criteria**: AC-B01-03 GREEN

---

### TASK-B01-4 — 홈 피드 카드 클릭 → B-03 이동 플로우

**kind**: frontend | **depends_on**: TASK-B01-1, TASK-B03-1

**ac_refs 인용**

| AC-ID | Given | When | Then |
|-------|-------|------|------|
| AC-B01-04 | 홈 화면이 렌더링된 상태 | 포스트 카드를 클릭 | 해당 글 상세 화면(B-03)으로 이동함 |

**steps**
1. list-feed 카드 컴포넌트에 클릭 이벤트 핸들러 연결
2. 클릭 시 해당 글의 식별자(slug 등)를 기반으로 B-03 상세 화면으로 이동하는 내비게이션 로직 구현
3. B-03 화면 진입 계약(entry: 포스트 카드 클릭)과 연결 확인

**success_criteria**: AC-B01-04 GREEN

---

### TASK-B01-5 — 홈 내비 '글' 링크 → B-02 이동 플로우

**kind**: frontend | **depends_on**: TASK-B01-1, TASK-B02-1

**ac_refs 인용**

| AC-ID | Given | When | Then |
|-------|-------|------|------|
| AC-B01-05 | 홈 화면이 렌더링된 상태 | 내비 '글' 링크를 클릭 | 전체 글 목록 화면(B-02)으로 이동함 |

**steps**
1. nav-main 컴포넌트의 '글' 링크에 B-02 화면으로 이동하는 내비게이션 연결
2. B-02 화면 진입 계약(entry: 상단 내비 '글' 링크 클릭)과 연결 확인

**success_criteria**: AC-B01-05 GREEN

---

### TASK-B01-6 — project 배지 컴포넌트 및 B-01·B-02·B-03 조건부 표시

**kind**: frontend | **depends_on**: TASK-B01-1, TASK-B02-1, TASK-B03-1

**ac_refs 인용**

| AC-ID | Given | When | Then |
|-------|-------|------|------|
| AC-B01-06 | 홈 화면에서 project 필드가 있는 포스트가 피드에 포함된 상태 | 화면이 렌더링됨 | 해당 포스트 카드에 project 배지가 표시됨 |
| AC-B02-04 | /posts 화면에서 project 필드가 있는 포스트가 목록에 포함된 상태 | 화면이 렌더링됨 | 해당 포스트 카드에 project 배지가 표시됨 |
| AC-B03-04 | project 필드가 있는 글 상세 페이지에 진입한 상태 | 화면이 렌더링됨 | 포스트 헤더 메타 영역에 project 배지가 표시됨 |

**steps**
1. badge-project 컴포넌트를 계약 key 기준으로 구현하고 스택 표준 마커 부착
2. list-feed(B-01) 포스트 카드에서 project 필드가 있는 항목에만 badge-project 표시, 없는 경우 미표시 로직 구현
3. list-posts(B-02) 포스트 카드에서 동일한 조건부 badge-project 표시 로직 적용
4. text-post-meta(B-03) 포스트 헤더 메타 영역에서 project 필드가 있는 글에만 badge-project 표시, 없는 경우 미표시 로직 구현

**success_criteria**: AC-B01-06 GREEN, AC-B02-04 GREEN, AC-B03-04 GREEN

---

### TASK-B02-1 — 화면 B-02 전체 글 목록 레이아웃

**kind**: frontend | **depends_on**: 없음 (병렬 가능)

**ac_refs 인용**

| AC-ID | Given | When | Then |
|-------|-------|------|------|
| AC-B02-01 | /posts 화면에 진입한 상태 | 화면이 렌더링됨 | 카테고리 필터 버튼 그룹과 전체 글 카드 리스트가 표시됨 |

**steps**
1. prd.contract.json screens[B-02].components 확인 — tab-filter·list-posts
2. tab-filter 컴포넌트(전체·트러블슈팅·딥다이브·프로젝트회고·작업로그)를 계약 key 기준으로 구현하고 마커 부착
3. list-posts 컴포넌트(포스트 카드 포맷 B-01과 동일)를 구현하고 마커 부착
4. 각 컴포넌트에 스택 표준 마커 부착 (스택 어댑터 위임)

**success_criteria**: AC-B02-01 GREEN

---

### TASK-B02-2 — B-02 카테고리 필터 인터랙션

**kind**: frontend | **depends_on**: TASK-B02-1, TASK-BE-1

**ac_refs 인용**

| AC-ID | Given | When | Then |
|-------|-------|------|------|
| AC-B02-02 | /posts 화면에 전체 글이 표시된 상태 | 특정 카테고리 필터 버튼을 클릭 | 해당 카테고리에 속하는 글 카드만 목록에 남고 선택된 필터 버튼이 활성 상태로 표시됨 |
| AC-B02-03 | 특정 카테고리 필터가 활성인 상태 | '전체' 필터 버튼을 클릭 | 모든 글 카드가 목록에 복원됨 |

**steps**
1. tab-filter 버튼 클릭 시 선택된 카테고리를 상태로 저장하는 로직 구현
2. 선택된 카테고리에 따라 list-posts를 필터링하여 해당 글만 표시하는 로직 구현
3. 활성 필터 버튼에 선택 상태 시각 표시 구현
4. '전체' 버튼 클릭 시 필터 상태를 초기화하여 모든 글 카드를 복원하는 로직 구현

**success_criteria**: AC-B02-02 GREEN, AC-B02-03 GREEN

---

### TASK-B03-1 — 화면 B-03 글 상세 전체 레이아웃

**kind**: frontend | **depends_on**: TASK-BE-2

**ac_refs 인용**

| AC-ID | Given | When | Then |
|-------|-------|------|------|
| AC-B03-01 | 특정 글 상세 페이지에 진입한 상태 | 화면이 렌더링됨 | 포스트 헤더(LOG 번호·카테고리·날짜·난이도), h1 제목, TL;DR 블록, 키워드 프리뷰, 본문, 참고한 링크 섹션, 시리즈 내비 카드가 모두 표시됨 |

**steps**
1. prd.contract.json screens[B-03].components 확인 — text-post-meta·text-post-title·text-tldr·list-keywords·text-body·list-refs·nav-series
2. 포스트 헤더(text-post-meta: LOG 번호·카테고리·날짜·난이도)를 계약 key 기준으로 구현하고 마커 부착
3. h1 제목(text-post-title) 구현 및 마커 부착
4. TL;DR 블록(text-tldr) 구현 및 마커 부착
5. 키워드 프리뷰 칩 목록(list-keywords) 구현 및 마커 부착
6. 본문 영역(text-body: 헤딩·대화체 인용·코드 블록·mark 포함) 구현 및 마커 부착
7. 참고한 링크 섹션(list-refs) 구현 및 마커 부착
8. 시리즈 내비 카드(nav-series: 이전 글/다음 글) 구현 및 마커 부착

**success_criteria**: AC-B03-01 GREEN

---

### TASK-B03-2 — B-03 시리즈 내비 이전/다음 클릭 플로우

**kind**: frontend | **depends_on**: TASK-B03-1

**ac_refs 인용**

| AC-ID | Given | When | Then |
|-------|-------|------|------|
| AC-B03-02 | 글 상세 본문이 표시된 상태이고 이전 글이 존재하는 상태 | 시리즈 내비의 이전 글 카드를 클릭 | 이전 글 상세 화면으로 이동함 |
| AC-B03-03 | 글 상세 본문이 표시된 상태이고 다음 글이 존재하는 상태 | 시리즈 내비의 다음 글 카드를 클릭 | 다음 글 상세 화면으로 이동함 |

**steps**
1. nav-series 컴포넌트의 이전 글 카드에 클릭 이벤트 연결하여 이전 글 상세 화면으로 이동하는 로직 구현
2. nav-series 컴포넌트의 다음 글 카드에 클릭 이벤트 연결하여 다음 글 상세 화면으로 이동하는 로직 구현
3. 경계 글(첫 글·마지막 글)의 경우 해당 방향 카드 미표시 또는 비활성 처리 구현

**success_criteria**: AC-B03-02 GREEN, AC-B03-03 GREEN

---

### TASK-B04-1 — 화면 B-04 시리즈 카드 목록 레이아웃

**kind**: frontend | **depends_on**: TASK-BE-3

**ac_refs 인용**

| AC-ID | Given | When | Then |
|-------|-------|------|------|
| AC-B04-01 | /series 화면에 진입한 상태 | 화면이 렌더링됨 | 시리즈 카드 목록이 시리즈 제목·글 수·최신 업데이트 날짜와 함께 표시됨 |

**steps**
1. prd.contract.json screens[B-04].components 확인 — list-series·list-series-posts
2. list-series 컴포넌트(시리즈 제목·글 수·최신 업데이트 날짜 포함 카드 리스트)를 계약 key 기준으로 구현하고 마커 부착

**success_criteria**: AC-B04-01 GREEN

---

### TASK-B04-2 — B-04 시리즈 카드 클릭 → 글 목록 표시 인터랙션

**kind**: frontend | **depends_on**: TASK-B04-1, TASK-BE-3

**ac_refs 인용**

| AC-ID | Given | When | Then |
|-------|-------|------|------|
| AC-B04-02 | /series 화면에 시리즈 카드 목록이 표시된 상태 | 특정 시리즈 카드를 클릭 | 해당 시리즈 글 목록(순서 번호 포함)이 표시됨 |

**steps**
1. list-series 카드 클릭 이벤트 핸들러 연결
2. 선택된 시리즈의 글 목록을 list-series-posts 컴포넌트에 순서 번호 포함 표시하는 로직 구현
3. list-series-posts 컴포넌트에 계약 key 기준 마커 부착

**success_criteria**: AC-B04-02 GREEN

---

### TASK-B05-1 — 화면 B-05 About 레이아웃

**kind**: frontend | **depends_on**: 없음 (병렬 가능)

**ac_refs 인용**

| AC-ID | Given | When | Then |
|-------|-------|------|------|
| AC-B05-01 | /about 화면에 진입한 상태 | 화면이 렌더링됨 | 이력 요약 영역, 기술 스택 영역, 프로젝트 링크 영역, 연락처 영역이 모두 화면에 표시됨 |

**steps**
1. prd.contract.json screens[B-05].components 확인 — text-bio-detail·list-stack·list-projects·list-contact
2. 이력 요약 영역(text-bio-detail) 구현 및 마커 부착
3. 기술 스택 목록(list-stack) 구현 및 마커 부착
4. 프로젝트 링크 목록(list-projects) 구현 및 마커 부착
5. 연락처 목록(list-contact) 구현 및 마커 부착
6. 실제 콘텐츠 텍스트는 저자 직접 제공 예정임을 자리표시로 명시

**success_criteria**: AC-B05-01 GREEN

---

### TASK-B05-2 — B-05 프로젝트 링크 새 탭 열기 플로우

**kind**: frontend | **depends_on**: TASK-B05-1

**ac_refs 인용**

| AC-ID | Given | When | Then |
|-------|-------|------|------|
| AC-B05-02 | /about 화면에서 프로젝트 링크 영역이 표시된 상태 | 특정 프로젝트 링크를 클릭 | 해당 외부 링크(GitHub 등)가 새 탭에서 열림 |

**steps**
1. list-projects 컴포넌트 각 링크에 외부 URL 새 탭 열기 동작 연결
2. 링크 클릭 시 현재 탭 이동 없이 새 탭으로 열리는 동작 확인

**success_criteria**: AC-B05-02 GREEN

---

### TASK-B06-1 — 화면 B-06 태그 인덱스 기본 레이아웃

**kind**: frontend | **depends_on**: TASK-BE-4

**ac_refs 인용**

| AC-ID | Given | When | Then |
|-------|-------|------|------|
| AC-B06-01 | /tags 화면에 진입한 상태 | 화면이 렌더링됨 | 뷰 전환 토글('목록 뷰 / 그래프 뷰')과 태그 목록(태그명 + 글 수)이 기본 목록 뷰로 표시됨 |

**steps**
1. prd.contract.json screens[B-06].components 확인 — tab-view-toggle·list-tags·list-graph
2. tab-view-toggle 컴포넌트(목록 뷰/그래프 뷰 전환, 기본값 목록 뷰)를 계약 key 기준으로 구현하고 마커 부착
3. list-tags 컴포넌트(태그명 + 해당 태그 포스트 수 표시)를 계약 key 기준으로 구현하고 마커 부착
4. 화면 진입 시 목록 뷰가 기본으로 활성 상태가 되는 초기 상태 설정

**success_criteria**: AC-B06-01 GREEN

---

### TASK-B06-2 — B-06 그래프 뷰 토글 및 co-occurrence 그래프 표시

**kind**: frontend | **depends_on**: TASK-B06-1

**ac_refs 인용**

| AC-ID | Given | When | Then |
|-------|-------|------|------|
| AC-B06-02 | /tags 화면에서 목록 뷰가 활성인 상태 | '그래프 뷰' 토글을 클릭 | 태그 co-occurrence 그래프가 표시되며 목록 뷰는 감춰짐 |

**steps**
1. tab-view-toggle의 '그래프 뷰' 클릭 이벤트 핸들러 연결
2. 클릭 시 list-tags(목록 뷰)를 감추고 list-graph(그래프 뷰)를 표시하는 뷰 전환 로직 구현
3. list-graph 컴포넌트(노드=태그·엣지=동일 글에 공존한 태그 쌍 시각화)를 계약 key 기준으로 구현하고 마커 부착
4. 고립 태그(co-occurrence 엣지가 없는 태그)는 그래프에서 제외되는 로직 구현

**success_criteria**: AC-B06-02 GREEN

---

### TASK-B06-3 — B-06 태그 클릭 → B-07 이동 플로우

**kind**: frontend | **depends_on**: TASK-B06-1, TASK-B06-2, TASK-B07-1

**ac_refs 인용**

| AC-ID | Given | When | Then |
|-------|-------|------|------|
| AC-B06-03 | /tags 화면에서 목록 뷰가 표시된 상태 | 목록의 특정 태그를 클릭 | 해당 태그 상세 화면(B-07)으로 이동함 |
| AC-B06-04 | /tags 화면에서 그래프 뷰가 표시된 상태 | 그래프의 특정 태그 노드를 클릭 | 해당 태그 상세 화면(B-07)으로 이동함 |

**steps**
1. list-tags(목록 뷰) 각 태그 항목에 클릭 이벤트 연결하여 해당 태그의 B-07 화면으로 이동하는 내비게이션 로직 구현
2. list-graph(그래프 뷰) 태그 노드에 클릭 이벤트 연결하여 해당 태그의 B-07 화면으로 이동하는 내비게이션 로직 구현
3. B-07 화면 진입 계약(entry: /tags/[tag] 직접 진입 또는 태그 클릭)과 연결 확인

**success_criteria**: AC-B06-03 GREEN, AC-B06-04 GREEN

---

### TASK-B07-1 — 화면 B-07 태그 상세 레이아웃

**kind**: frontend | **depends_on**: TASK-BE-4

**ac_refs 인용**

| AC-ID | Given | When | Then |
|-------|-------|------|------|
| AC-B07-01 | /tags/[tag] 화면에 진입한 상태 | 화면이 렌더링됨 | 태그 제목('#[태그명]')과 해당 태그가 포함된 포스트 카드 목록이 표시됨 |

**steps**
1. prd.contract.json screens[B-07].components 확인 — text-tag-title·list-posts-by-tag
2. text-tag-title 컴포넌트('#[태그명]' 형식)를 계약 key 기준으로 구현하고 마커 부착
3. list-posts-by-tag 컴포넌트(포스트 카드 포맷)를 계약 key 기준으로 구현하고 마커 부착
4. URL 파라미터에서 태그 식별자를 읽어 해당 태그의 포스트 목록을 렌더링하는 로직 구현

**success_criteria**: AC-B07-01 GREEN

---

### TASK-B07-2 — B-07 포스트 카드 클릭 → B-03 이동 플로우

**kind**: frontend | **depends_on**: TASK-B07-1, TASK-B03-1

**ac_refs 인용**

| AC-ID | Given | When | Then |
|-------|-------|------|------|
| AC-B07-02 | /tags/[tag] 화면에 포스트 카드 목록이 표시된 상태 | 포스트 카드를 클릭 | 해당 글 상세 화면(B-03)으로 이동함 |

**steps**
1. list-posts-by-tag 카드 컴포넌트에 클릭 이벤트 핸들러 연결
2. 클릭 시 해당 글 식별자를 기반으로 B-03 상세 화면으로 이동하는 내비게이션 로직 구현
3. B-03 화면 진입 계약(entry: 포스트 카드 클릭)과 연결 확인

**success_criteria**: AC-B07-02 GREEN

---

## 병렬성 노트

`depends_on`이 없는 task는 동시에 착수 가능함. 첫 번째 웨이브에서 병렬 실행 가능한 task:

- TASK-BE-1, TASK-BE-2, TASK-BE-3, TASK-BE-4 (backend 4건 전부)
- TASK-B01-1, TASK-B02-1, TASK-B05-1 (frontend 레이아웃 선행 3건)

완료 체크 기준: TC GREEN이 유일 근거. 구현 완료만으로 체크 금지.
