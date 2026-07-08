# PLAN_blog — 구현 계획 (사람용 진행 추적)

> **consumes**: `prd/prd.contract.json` (acs + screens만)
> **task 수**: 16 (frontend 13 + backend 3)
> **AC 커버리지**: 15/15 (고아 AC 0 보증)
> **완료 체크 근거**: TC GREEN이 유일 기준 — 구현 완료만으로 체크 금지

---

## AC 전수 목록 (원천)

| AC-ID | screen_id | layer | 커버 task |
|-------|-----------|-------|-----------|
| AC-B01-01 | B-01 | render | TASK-B01-1 |
| AC-B01-02 | B-01 | interaction | TASK-B01-2 |
| AC-B01-03 | B-01 | interaction | TASK-B01-3 |
| AC-B01-04 | B-01 | flow | TASK-B01-4, TASK-BE-1 |
| AC-B01-05 | B-01 | flow | TASK-B01-5 |
| AC-B02-01 | B-02 | render | TASK-B02-1, TASK-BE-1 |
| AC-B02-02 | B-02 | interaction | TASK-B02-2, TASK-BE-1 |
| AC-B02-03 | B-02 | interaction | TASK-B02-2, TASK-BE-1 |
| AC-B03-01 | B-03 | render | TASK-B03-1, TASK-BE-2 |
| AC-B03-02 | B-03 | interaction | TASK-B03-2, TASK-BE-2 |
| AC-B03-03 | B-03 | interaction | TASK-B03-2, TASK-BE-2 |
| AC-B04-01 | B-04 | render | TASK-B04-1, TASK-BE-3 |
| AC-B04-02 | B-04 | interaction | TASK-B04-2, TASK-BE-3 |
| AC-B05-01 | B-05 | render | TASK-B05-1 |
| AC-B05-02 | B-05 | interaction | TASK-B05-2 |

---

## 태스크 표 (구현 권장 순서)

| task_id | kind | target 요약 | ac_refs | depends_on |
|---------|------|-------------|---------|------------|
| TASK-BE-1 | backend | 글 목록·카테고리 필터 조회 계약 | AC-B01-04, AC-B02-01, AC-B02-02, AC-B02-03 | — |
| TASK-BE-2 | backend | 글 상세 조회 계약 (시리즈 prev/next 포함) | AC-B03-01, AC-B03-02, AC-B03-03 | — |
| TASK-BE-3 | backend | 시리즈 목록·상세 조회 계약 | AC-B04-01, AC-B04-02 | — |
| TASK-B01-1 | frontend | 홈 전체 레이아웃 (헤더·히어로·피드·푸터) | AC-B01-01 | — |
| TASK-B02-1 | frontend | 전체 글 목록 레이아웃 (필터+리스트) | AC-B02-01 | — |
| TASK-B03-1 | frontend | 글 상세 전체 레이아웃 | AC-B03-01 | TASK-BE-2 |
| TASK-B04-1 | frontend | 시리즈 목록 레이아웃 | AC-B04-01 | TASK-BE-3 |
| TASK-B05-1 | frontend | About 레이아웃 (4개 영역) | AC-B05-01 | — |
| TASK-B01-2 | frontend | 홈 피드 카드 hover 스윕 애니메이션 | AC-B01-02 | TASK-B01-1 |
| TASK-B01-3 | frontend | 다크모드 토글 팔레트 전환 | AC-B01-03 | TASK-B01-1 |
| TASK-B01-4 | frontend | 홈 피드 카드 → 글 상세 이동 | AC-B01-04 | TASK-B01-1, TASK-B03-1 |
| TASK-B01-5 | frontend | 홈 내비 '글' → 목록 화면 이동 | AC-B01-05 | TASK-B01-1, TASK-B02-1 |
| TASK-B02-2 | frontend | 카테고리 필터 인터랙션 (필터·전체복원) | AC-B02-02, AC-B02-03 | TASK-B02-1, TASK-BE-1 |
| TASK-B03-2 | frontend | 시리즈 내비 이전/다음 이동 | AC-B03-02, AC-B03-03 | TASK-B03-1 |
| TASK-B04-2 | frontend | 시리즈 카드 클릭 → 글 목록 표시 | AC-B04-02 | TASK-B04-1, TASK-BE-3 |
| TASK-B05-2 | frontend | About 프로젝트 링크 새 탭 열기 | AC-B05-02 | TASK-B05-1 |

---

## 병렬성 노트

`depends_on`이 없는 task는 병렬 실행 가능함:

**1라운드 병렬 (depends_on 없음)**:
- TASK-BE-1, TASK-BE-2, TASK-BE-3 (백엔드 계약 3건)
- TASK-B01-1, TASK-B02-1, TASK-B05-1 (프론트엔드 독립 레이아웃)

**2라운드 (1라운드 완료 후)**:
- TASK-B03-1 (← TASK-BE-2)
- TASK-B04-1 (← TASK-BE-3)
- TASK-B01-2, TASK-B01-3 (← TASK-B01-1)

**3라운드 (2라운드 완료 후)**:
- TASK-B01-4 (← TASK-B01-1, TASK-B03-1)
- TASK-B01-5 (← TASK-B01-1, TASK-B02-1)
- TASK-B02-2 (← TASK-B02-1, TASK-BE-1)
- TASK-B03-2 (← TASK-B03-1)
- TASK-B04-2 (← TASK-B04-1, TASK-BE-3)
- TASK-B05-2 (← TASK-B05-1)

---

## task 상세

---

### TASK-BE-1 — 글 목록·카테고리 필터 조회 계약

**kind**: backend
**target**: 글 목록·상세 조회 계약 구현: slug·lognum·title·description·category·date·difficulty·readingTime 포함 목록 반환 및 카테고리 필터 파라미터 지원
**depends_on**: 없음

**ac_refs 및 G/W/T**:

| AC-ID | Given | When | Then |
|-------|-------|------|------|
| AC-B01-04 | 홈 화면이 렌더링된 상태 | 포스트 카드를 클릭 | 해당 글 상세 화면(B-03)으로 이동함 |
| AC-B02-01 | /posts 화면에 진입한 상태 | 화면이 렌더링됨 | 태그 필터 버튼 그룹과 전체 글 카드 리스트가 표시됨 |
| AC-B02-02 | /posts 화면에 전체 글이 표시된 상태 | 특정 카테고리 필터 버튼을 클릭 | 해당 카테고리에 속하는 글 카드만 목록에 남고 선택된 필터 버튼이 활성 상태로 표시됨 |
| AC-B02-03 | 특정 카테고리 필터가 활성인 상태 | '전체' 필터 버튼을 클릭 | 모든 글 카드가 목록에 복원됨 |

**steps**:
1. 글 목록 조회 계약(slug, lognum, title, description, category, date, difficulty, readingTime 포함)을 정의하고 구현
2. 카테고리 값을 파라미터로 받아 해당 카테고리 글 목록만 반환하는 필터 계약 구현
3. 계약 응답 형식이 PRD impl_requirements.backend 명세와 일치하는지 확인

**success_criteria**:
- AC-B02-01 GREEN
- AC-B02-02 GREEN
- AC-B02-03 GREEN

---

### TASK-BE-2 — 글 상세 조회 계약

**kind**: backend
**target**: 글 상세 조회 계약 구현: slug·lognum·title·description·category·date·difficulty·readingTime·tldr·keywords·body·seriesPrev·seriesNext·refs 포함 단일 항목 반환
**depends_on**: 없음

**ac_refs 및 G/W/T**:

| AC-ID | Given | When | Then |
|-------|-------|------|------|
| AC-B03-01 | 특정 글 상세 페이지에 진입한 상태 | 화면이 렌더링됨 | 포스트 헤더(LOG 번호·카테고리·날짜·난이도), h1 제목, TL;DR 블록, 키워드 프리뷰, 본문, 참고한 링크 섹션, 시리즈 내비 카드가 모두 표시됨 |
| AC-B03-02 | 글 상세 본문이 표시된 상태이고 이전 글이 존재하는 상태 | 시리즈 내비의 이전 글 카드를 클릭 | 이전 글 상세 화면으로 이동함 |
| AC-B03-03 | 글 상세 본문이 표시된 상태이고 다음 글이 존재하는 상태 | 시리즈 내비의 다음 글 카드를 클릭 | 다음 글 상세 화면으로 이동함 |

**steps**:
1. 글 상세 조회 계약(slug, lognum, title, description, category, date, difficulty, readingTime, tldr, keywords, body, seriesPrev, seriesNext, refs 포함)을 정의하고 구현
2. seriesPrev·seriesNext 필드로 시리즈 이전/다음 글 참조 정보를 제공하여 nav-series 인터랙션 지원
3. 계약 응답 형식이 PRD impl_requirements.backend 명세와 일치하는지 확인

**success_criteria**:
- AC-B03-01 GREEN
- AC-B03-02 GREEN
- AC-B03-03 GREEN

---

### TASK-BE-3 — 시리즈 목록·상세 조회 계약

**kind**: backend
**target**: 시리즈 목록·상세 조회 계약 구현: seriesId·title·postCount·lastUpdated 목록 및 시리즈 내 글 목록(순서 번호 포함) 반환
**depends_on**: 없음

**ac_refs 및 G/W/T**:

| AC-ID | Given | When | Then |
|-------|-------|------|------|
| AC-B04-01 | /series 화면에 진입한 상태 | 화면이 렌더링됨 | 시리즈 카드 목록이 시리즈 제목·글 수·최신 업데이트 날짜와 함께 표시됨 |
| AC-B04-02 | /series 화면에 시리즈 카드 목록이 표시된 상태 | 특정 시리즈 카드를 클릭 | 해당 시리즈 글 목록(순서 번호 포함)이 표시됨 |

**steps**:
1. 시리즈 목록 조회 계약(seriesId, title, postCount, lastUpdated 포함)을 정의하고 구현
2. 시리즈 상세 조회 계약(해당 시리즈 글 목록을 순서 번호 order 포함하여 반환)을 정의하고 구현
3. 계약 응답 형식이 PRD impl_requirements.backend 명세와 일치하는지 확인

**success_criteria**:
- AC-B04-01 GREEN
- AC-B04-02 GREEN

---

### TASK-B01-1 — 홈 전체 레이아웃 구현

**kind**: frontend
**target**: 화면 B-01(홈) 전체 레이아웃 구현: 로고·내비·다크모드 토글 헤더, 히어로 영역(제목·bio·통계 라인), 포스트 카드 피드 리스트, 푸터 컴포넌트 배치
**depends_on**: 없음

**ac_refs 및 G/W/T**:

| AC-ID | Given | When | Then |
|-------|-------|------|------|
| AC-B01-01 | 사이트 루트에 진입한 상태 | 홈 페이지가 렌더링됨 | 로고(SLOG_), 내비 메뉴(글·시리즈·소개·RSS), 히어로 제목, bio 2줄, 통계 라인, 포스트 카드 리스트, 푸터가 모두 화면에 표시됨 |

**steps**:
1. prd.contract.json screens[B-01].components 전수 확인 — logo-slog·nav-main·button-darkmode·hero-title·text-bio·text-stat·list-feed·text-footer
2. 헤더 영역(logo-slog·nav-main·button-darkmode)을 계약 key 기준으로 구현하고 스택 표준 마커 부착
3. 히어로 영역(hero-title·text-bio·text-stat)을 계약 key 기준으로 구현하고 마커 부착
4. 포스트 카드 피드(list-feed) 컴포넌트를 구현하고 LOG 번호·카테고리·제목·설명·날짜·난이도·읽기 시간 포함
5. 푸터(text-footer)를 구현하고 마커 부착
6. 각 컴포넌트에 계약 key 기준 스택 표준 마커를 부착 (스택 어댑터 위임)

**success_criteria**:
- AC-B01-01 GREEN

---

### TASK-B01-2 — 홈 피드 카드 hover 스윕 애니메이션

**kind**: frontend
**target**: 홈 피드 포스트 카드 hover 형광펜 스윕 애니메이션 구현 (prefers-reduced-motion 대응 포함)
**depends_on**: TASK-B01-1

**ac_refs 및 G/W/T**:

| AC-ID | Given | When | Then |
|-------|-------|------|------|
| AC-B01-02 | 홈 피드에 포스트 카드가 렌더링된 상태 | 포스트 카드 위에 마우스를 올림 | 카드 제목의 형광펜 mark가 스윕 애니메이션으로 나타남 |

**steps**:
1. list-feed 컴포넌트의 카드 hover 상태를 감지하는 인터랙션 로직 구현
2. 카드 제목에 형광펜 mark가 background-size 0% → 100% 스윕 전환으로 나타나는 애니메이션 구현
3. prefers-reduced-motion 미디어 쿼리 활성 시 전환(transition)을 제거하는 분기 처리

**success_criteria**:
- AC-B01-02 GREEN

---

### TASK-B01-3 — 다크모드 토글 팔레트 전환

**kind**: frontend
**target**: 다크모드 토글(button-darkmode) 클릭 시 전체 페이지 팔레트 전환 구현 (라이트 기본, 재클릭 시 복원)
**depends_on**: TASK-B01-1

> **U-003 참고**: 다크 팔레트 색상값 미확정. AC-B01-03 then은 전환 동작 확인까지만 가능; 정확한 색상값 단언은 별도 디자인 결정 후 TC에서 확정.

**ac_refs 및 G/W/T**:

| AC-ID | Given | When | Then |
|-------|-------|------|------|
| AC-B01-03 | 홈 화면이 라이트 모드로 렌더링된 상태 | 다크모드 토글을 클릭 | 전체 페이지 배경·텍스트 색상이 다크 팔레트로 전환됨 |

**steps**:
1. button-darkmode 컴포넌트에 클릭 이벤트 핸들러 연결
2. 클릭 시 전체 페이지 배경·텍스트 색상을 다크 팔레트로 전환하는 상태 토글 구현
3. 재클릭 시 라이트 팔레트로 복원되는 동작 구현
4. 라이트 모드를 기본 상태로 유지

**success_criteria**:
- AC-B01-03 GREEN

---

### TASK-B01-4 — 홈 피드 카드 → 글 상세 이동

**kind**: frontend
**target**: 홈 피드 포스트 카드 클릭 시 해당 글 상세 화면(B-03)으로 이동하는 플로우 구현
**depends_on**: TASK-B01-1, TASK-B03-1

**ac_refs 및 G/W/T**:

| AC-ID | Given | When | Then |
|-------|-------|------|------|
| AC-B01-04 | 홈 화면이 렌더링된 상태 | 포스트 카드를 클릭 | 해당 글 상세 화면(B-03)으로 이동함 |

**steps**:
1. list-feed 카드 컴포넌트에 클릭 이벤트 핸들러 연결
2. 클릭 시 해당 글의 식별자(slug 등)를 기반으로 B-03 상세 화면으로 이동하는 내비게이션 로직 구현
3. B-03 화면 진입 계약(entry: 포스트 카드 클릭)과 연결 확인

**success_criteria**:
- AC-B01-04 GREEN

---

### TASK-B01-5 — 홈 내비 '글' → 목록 화면 이동

**kind**: frontend
**target**: 홈 내비 '글' 링크 클릭 시 전체 글 목록 화면(B-02)으로 이동하는 플로우 구현
**depends_on**: TASK-B01-1, TASK-B02-1

**ac_refs 및 G/W/T**:

| AC-ID | Given | When | Then |
|-------|-------|------|------|
| AC-B01-05 | 홈 화면이 렌더링된 상태 | 내비 '글' 링크를 클릭 | 전체 글 목록 화면(B-02)으로 이동함 |

**steps**:
1. nav-main 컴포넌트의 '글' 링크에 B-02 화면으로 이동하는 내비게이션 연결
2. B-02 화면 진입 계약(entry: 상단 내비 '글' 링크 클릭)과 연결 확인

**success_criteria**:
- AC-B01-05 GREEN

---

### TASK-B02-1 — 전체 글 목록 레이아웃 구현

**kind**: frontend
**target**: 화면 B-02(전체 글 목록) 레이아웃 구현: 태그 필터 버튼 그룹(tab-filter)과 전체 글 카드 리스트(list-posts) 배치
**depends_on**: 없음

**ac_refs 및 G/W/T**:

| AC-ID | Given | When | Then |
|-------|-------|------|------|
| AC-B02-01 | /posts 화면에 진입한 상태 | 화면이 렌더링됨 | 태그 필터 버튼 그룹과 전체 글 카드 리스트가 표시됨 |

**steps**:
1. prd.contract.json screens[B-02].components 확인 — tab-filter·list-posts
2. tab-filter 컴포넌트(전체·트러블슈팅·딥다이브·프로젝트회고·작업로그)를 계약 key 기준으로 구현하고 마커 부착
3. list-posts 컴포넌트(포스트 카드 포맷 B-01과 동일)를 구현하고 마커 부착
4. 각 컴포넌트에 스택 표준 마커 부착 (스택 어댑터 위임)

**success_criteria**:
- AC-B02-01 GREEN

---

### TASK-B02-2 — 카테고리 필터 인터랙션 구현

**kind**: frontend
**target**: B-02 카테고리 필터 인터랙션 구현: 필터 버튼 클릭 시 해당 카테고리 글만 노출 및 활성 상태 표시, '전체' 클릭 시 전체 글 복원
**depends_on**: TASK-B02-1, TASK-BE-1

**ac_refs 및 G/W/T**:

| AC-ID | Given | When | Then |
|-------|-------|------|------|
| AC-B02-02 | /posts 화면에 전체 글이 표시된 상태 | 특정 카테고리 필터 버튼을 클릭 | 해당 카테고리에 속하는 글 카드만 목록에 남고 선택된 필터 버튼이 활성 상태로 표시됨 |
| AC-B02-03 | 특정 카테고리 필터가 활성인 상태 | '전체' 필터 버튼을 클릭 | 모든 글 카드가 목록에 복원됨 |

**steps**:
1. tab-filter 버튼 클릭 시 선택된 카테고리를 상태로 저장하는 로직 구현
2. 선택된 카테고리에 따라 list-posts를 필터링하여 해당 글만 표시하는 로직 구현
3. 활성 필터 버튼에 선택 상태 시각 표시 구현
4. '전체' 버튼 클릭 시 필터 상태를 초기화하여 모든 글 카드를 복원하는 로직 구현

**success_criteria**:
- AC-B02-02 GREEN
- AC-B02-03 GREEN

---

### TASK-B03-1 — 글 상세 전체 레이아웃 구현

**kind**: frontend
**target**: 화면 B-03(글 상세) 전체 레이아웃 구현: 포스트 헤더·h1 제목·TL;DR·키워드·본문·참고 링크·시리즈 내비 컴포넌트 배치
**depends_on**: TASK-BE-2

**ac_refs 및 G/W/T**:

| AC-ID | Given | When | Then |
|-------|-------|------|------|
| AC-B03-01 | 특정 글 상세 페이지에 진입한 상태 | 화면이 렌더링됨 | 포스트 헤더(LOG 번호·카테고리·날짜·난이도), h1 제목, TL;DR 블록, 키워드 프리뷰, 본문, 참고한 링크 섹션, 시리즈 내비 카드가 모두 표시됨 |

**steps**:
1. prd.contract.json screens[B-03].components 확인 — text-post-meta·text-post-title·text-tldr·list-keywords·text-body·list-refs·nav-series
2. 포스트 헤더(text-post-meta: LOG 번호·카테고리·날짜·난이도)를 계약 key 기준으로 구현하고 마커 부착
3. h1 제목(text-post-title) 구현 및 마커 부착
4. TL;DR 블록(text-tldr) 구현 및 마커 부착
5. 키워드 프리뷰 칩 목록(list-keywords) 구현 및 마커 부착
6. 본문 영역(text-body: 헤딩·대화체 인용·코드 블록·mark 포함) 구현 및 마커 부착
7. 참고한 링크 섹션(list-refs) 구현 및 마커 부착
8. 시리즈 내비 카드(nav-series: 이전 글/다음 글) 구현 및 마커 부착

**success_criteria**:
- AC-B03-01 GREEN

---

### TASK-B03-2 — 시리즈 내비 이전/다음 이동

**kind**: frontend
**target**: B-03 시리즈 내비 카드(nav-series) 이전 글/다음 글 클릭 이동 플로우 구현 (경계 글 처리 포함)
**depends_on**: TASK-B03-1

> **U-001 참고**: 경계 글(첫 글·마지막 글) UI 처리(미표시 vs 비활성)가 미확정. 구현자가 결정하거나 별도 사람 승인 필요.

**ac_refs 및 G/W/T**:

| AC-ID | Given | When | Then |
|-------|-------|------|------|
| AC-B03-02 | 글 상세 본문이 표시된 상태이고 이전 글이 존재하는 상태 | 시리즈 내비의 이전 글 카드를 클릭 | 이전 글 상세 화면으로 이동함 |
| AC-B03-03 | 글 상세 본문이 표시된 상태이고 다음 글이 존재하는 상태 | 시리즈 내비의 다음 글 카드를 클릭 | 다음 글 상세 화면으로 이동함 |

**steps**:
1. nav-series 컴포넌트의 이전 글 카드에 클릭 이벤트 연결하여 이전 글 상세 화면으로 이동하는 로직 구현
2. nav-series 컴포넌트의 다음 글 카드에 클릭 이벤트 연결하여 다음 글 상세 화면으로 이동하는 로직 구현
3. 경계 글(첫 글·마지막 글)의 경우 해당 방향 카드 미표시 또는 비활성 처리 구현 (U-001 결정에 따름)

**success_criteria**:
- AC-B03-02 GREEN
- AC-B03-03 GREEN

---

### TASK-B04-1 — 시리즈 목록 레이아웃 구현

**kind**: frontend
**target**: 화면 B-04(시리즈) 레이아웃 구현: 시리즈 카드 목록(list-series) 배치 — 시리즈 제목·글 수·최신 업데이트 날짜 포함
**depends_on**: TASK-BE-3

**ac_refs 및 G/W/T**:

| AC-ID | Given | When | Then |
|-------|-------|------|------|
| AC-B04-01 | /series 화면에 진입한 상태 | 화면이 렌더링됨 | 시리즈 카드 목록이 시리즈 제목·글 수·최신 업데이트 날짜와 함께 표시됨 |

**steps**:
1. prd.contract.json screens[B-04].components 확인 — list-series·list-series-posts
2. list-series 컴포넌트(시리즈 제목·글 수·최신 업데이트 날짜 포함 카드 리스트)를 계약 key 기준으로 구현하고 마커 부착

**success_criteria**:
- AC-B04-01 GREEN

---

### TASK-B04-2 — 시리즈 카드 클릭 → 글 목록 표시

**kind**: frontend
**target**: B-04 시리즈 카드 클릭 시 해당 시리즈 글 목록(list-series-posts, 순서 번호 포함) 표시 인터랙션 구현
**depends_on**: TASK-B04-1, TASK-BE-3

**ac_refs 및 G/W/T**:

| AC-ID | Given | When | Then |
|-------|-------|------|------|
| AC-B04-02 | /series 화면에 시리즈 카드 목록이 표시된 상태 | 특정 시리즈 카드를 클릭 | 해당 시리즈 글 목록(순서 번호 포함)이 표시됨 |

**steps**:
1. list-series 카드 클릭 이벤트 핸들러 연결
2. 선택된 시리즈의 글 목록을 list-series-posts 컴포넌트에 순서 번호 포함 표시하는 로직 구현
3. list-series-posts 컴포넌트에 계약 key 기준 마커 부착

**success_criteria**:
- AC-B04-02 GREEN

---

### TASK-B05-1 — About 레이아웃 구현

**kind**: frontend
**target**: 화면 B-05(About) 레이아웃 구현: 이력 요약·기술 스택·프로젝트 링크·연락처 4개 영역 배치
**depends_on**: 없음

> **U-002 참고**: 실제 이력 본문 텍스트·연락처 내용 미제공. 영역 구조 존재 여부만 TC에서 확인 가능; 실 콘텐츠는 저자가 구현 단계에서 직접 제공.

**ac_refs 및 G/W/T**:

| AC-ID | Given | When | Then |
|-------|-------|------|------|
| AC-B05-01 | /about 화면에 진입한 상태 | 화면이 렌더링됨 | 이력 요약 영역, 기술 스택 영역, 프로젝트 링크 영역, 연락처 영역이 모두 화면에 표시됨 |

**steps**:
1. prd.contract.json screens[B-05].components 확인 — text-bio-detail·list-stack·list-projects·list-contact
2. 이력 요약 영역(text-bio-detail) 구현 및 마커 부착
3. 기술 스택 목록(list-stack) 구현 및 마커 부착
4. 프로젝트 링크 목록(list-projects) 구현 및 마커 부착
5. 연락처 목록(list-contact) 구현 및 마커 부착
6. U-002에 따라 실제 콘텐츠 텍스트는 저자 직접 제공 예정임을 자리표시로 명시

**success_criteria**:
- AC-B05-01 GREEN

---

### TASK-B05-2 — About 프로젝트 링크 새 탭 열기

**kind**: frontend
**target**: B-05 프로젝트 링크(list-projects) 클릭 시 해당 외부 URL을 새 탭으로 여는 동작 구현
**depends_on**: TASK-B05-1

**ac_refs 및 G/W/T**:

| AC-ID | Given | When | Then |
|-------|-------|------|------|
| AC-B05-02 | /about 화면에서 프로젝트 링크 영역이 표시된 상태 | 특정 프로젝트 링크를 클릭 | 해당 외부 링크(GitHub 등)가 새 탭에서 열림 |

**steps**:
1. list-projects 컴포넌트 각 링크에 외부 URL 새 탭 열기 동작 연결
2. 링크 클릭 시 현재 탭 이동 없이 새 탭으로 열리는 동작 확인

**success_criteria**:
- AC-B05-02 GREEN

---

## 고아 AC 검증 결과

| AC-ID | 커버 task | 상태 |
|-------|-----------|------|
| AC-B01-01 | TASK-B01-1 | 커버됨 |
| AC-B01-02 | TASK-B01-2 | 커버됨 |
| AC-B01-03 | TASK-B01-3 | 커버됨 |
| AC-B01-04 | TASK-B01-4, TASK-BE-1 | 커버됨 |
| AC-B01-05 | TASK-B01-5 | 커버됨 |
| AC-B02-01 | TASK-B02-1, TASK-BE-1 | 커버됨 |
| AC-B02-02 | TASK-B02-2, TASK-BE-1 | 커버됨 |
| AC-B02-03 | TASK-B02-2, TASK-BE-1 | 커버됨 |
| AC-B03-01 | TASK-B03-1, TASK-BE-2 | 커버됨 |
| AC-B03-02 | TASK-B03-2, TASK-BE-2 | 커버됨 |
| AC-B03-03 | TASK-B03-2, TASK-BE-2 | 커버됨 |
| AC-B04-01 | TASK-B04-1, TASK-BE-3 | 커버됨 |
| AC-B04-02 | TASK-B04-2, TASK-BE-3 | 커버됨 |
| AC-B05-01 | TASK-B05-1 | 커버됨 |
| AC-B05-02 | TASK-B05-2 | 커버됨 |

**고아 AC: 0건** — 추적 체인 성립.
