# PRD_SCHEMA — PRD 산출물 규격

> PRD는 기획서 요구사항 **전부**를 담는 **스택·코드 무관 명세**임: §0~§7 화면 명세 + §8 impl_requirements(구현 명세).
> TC는 **§4 UI AC + screens.components key만** 소비함. 목업(HTML)·`locate`·`testid`·경로는 PRD 산출물이 아님.
> 근거: ECC CONTRACT.md — 목업 완전 폐기, 탈스택, 컴포넌트는 논리 key만.

---

## 산출물 (기능당)

| 파일 | 내용 |
|------|------|
| `prd/PRD_{feature}.md` | PRD 본문 §0~§8 (해당 기능의 여러 화면 전부) |
| `prd/prd.contract.json` | 기계 계약: `{feature, screens, acs, impl_requirements}` — `prd.contract.schema.json` 준수 |

> **생성하지 않는 것**: `prd/html/`·`prd/components.json`·`prd/screens.json`·`prd/PRD_{area}.json`
> `_data/facts/FACTS_{feature}.json`은 PRD가 만들지 않는다 — 별도 FACTS 단계(`facts-writer`)의 산출물이며, PRD는 이를 승인된 참고 입력으로만 받는다(`prd.contract.json` 필드에는 포함되지 않음).

---

## PRD_{feature}.md 본문 구조

| 절 | 내용 | 게이트 |
|----|------|--------|
| §0 | 개요·목적 (이슈/AS-IS/TO-BE/특장점 — 근거 인용) | — |
| §1 | User Story (역할·행동·가치) | — |
| §2 | 화면·상호작용 (화면별: 경로/신규·수정/영역/버튼/그리드 컬럼/모달 연결/근거) | — |
| §3 | 비즈니스 규칙 BR-ID 표 (분기 열거) | — |
| §4 | **수용기준 AC 표** (원자단위, UI 관측 동작만 — TC 유일 소비 대상) | AC ≥ 1 |
| §5 | 예외·에러 + 이슈 (충돌·판독불가·미확인 "TBD") | — |
| §6 | **비목표** (이번 구현 제외 항목) | 존재 필수 |
| §7 | 용어집 (codes, 코드값 사전) | — |
| §8 | **impl_requirements** (FE·BE 구현 명세 — 행동·인터페이스 수준) | 존재 필수 |

### §4 AC 규칙 (원자단위 강제)

- ID: `AC-{SID}-{NN}` — SID는 screen_id에서 `A-`→`A`. 예) `A-18` → `AC-A18-01`
- 정규식: `AC-[A-Z][A-Z0-9]*(?:-[0-9]+)*-[0-9]{2}`
- AC 1개 = **Given 1 · When 1 · Then 1**. UI에서 관측 가능한 동작만 (렌더·클릭·모달·메시지).
- `then`은 기획서에 명시된 요소/동작만. 추측 금지.
- 분량 가이드: 신규 화면 2~4개(렌더1 + 상호작용), 수정 화면 1~2개.
- `components`: 이 AC가 참조하는 컴포넌트 key 목록 (해당 screen에 실재하는 key만).
- **금지**: `locate`·`testid`·CSS·경로·프레임워크명 — TC 실행 시 스택 어댑터 몫.

### §8 impl_requirements 규칙 (req#8)

코드도 없고 스택도 미정인 상태에서 "FE/BE가 **이렇게 구현돼야 한다**"를 행동·인터페이스 수준으로 서술.

**허용 표현 예시**:
- "화면 A-18은 컬럼 제목/작성자/상태 그리드 + 검색창 + 생성버튼(생성 모달)을 제공해야 한다"
- "피드 목록 조회는 {id, title, author, status} 리스트를 반환하는 계약을 제공해야 한다"

**금지**: 코드·프레임워크명(`React`, `Next.js`, `FastAPI` 등)·파일경로·라이브러리명

---

## prd.contract.json 규격 (`prd.contract.schema.json` 준수)

```jsonc
{
  "feature": "feed",
  "screens": [{
    "screen_id": "A-18",
    "title": "피드 목록",
    "purpose": "관리자가 피드를 조회/생성",
    "entry": "이 화면에 도달하는 사용자 경로 서술(스택 무관)",
    "components": [{
      "key": "grid-list",           // {kind}-{name} 논리 식별자. 셀렉터 아님
      "kind": "grid",               // grid|button|search|modal|field|link|tab|badge|list|text
      "label": "피드 목록",         // 실제 표시 텍스트
      "role": "피드 목록 표시",
      "columns": ["제목","작성자","상태"],
      "behavior": "페이지 로드 시 피드 목록을 그리드로 표시"
    }, {
      "key": "button-create",
      "kind": "button",
      "label": "생성",
      "opens": "modal-create",
      "behavior": "클릭 시 생성 모달 표시"
    }]
  }],
  "acs": [{
    "id": "AC-A18-01",
    "screen_id": "A-18",
    "layer": "render",              // render|interaction|flow
    "given": "피드 목록 화면에 진입한 상태",
    "when": "화면이 로드됨",
    "then": "그리드에 제목/작성자/상태 컬럼이 표시됨",
    "components": ["grid-list"]     // 참조 컴포넌트 key (해당 screen에 실재해야 함)
  }, {
    "id": "AC-A18-02",
    "screen_id": "A-18",
    "layer": "interaction",
    "given": "피드 목록 화면이 표시된 상태",
    "when": "사용자가 생성 버튼을 클릭함",
    "then": "생성 모달이 표시됨",
    "components": ["button-create", "modal-create"]
  }],
  "impl_requirements": {
    "frontend": [
      "화면 A-18은 컬럼 제목/작성자/상태 그리드 + 검색창 + 생성버튼(생성 모달)을 제공해야 한다"
    ],
    "backend": [
      "피드 목록 조회는 {id, title, author, status} 리스트를 반환하는 계약을 제공해야 한다"
    ]
  }
}
```

---

## 컴포넌트 key 명명 규칙

| kind | 예시 key |
|------|----------|
| `grid` | `grid-list`, `grid-result` |
| `button` | `button-create`, `button-search`, `button-delete` |
| `search` | `search-bar`, `search-filter` |
| `modal` | `modal-create`, `modal-confirm`, `modal-detail` |
| `field` | `field-title`, `field-status` |
| `link` | `link-detail`, `link-back` |
| `tab` | `tab-all`, `tab-active` |
| `badge` | `badge-status`, `badge-count` |
| `list` | `list-item`, `list-nav` |
| `text` | `text-empty`, `text-count` |

- 패턴: `^[a-z]+-[a-z0-9-]+$` (스키마 강제)
- key는 화면 내 유일해야 함. `opens` 값은 같은 화면의 실재 key를 가리킴.

---

## 필요 입력

| 입력 | 내용 |
|------|------|
| 기획서 브리프 | 사람이 제공하는 기획 문서·슬라이드·텍스트 |
| 승인된 FACTS (선택) | `_data/facts/FACTS_{feature}.json`(`approved:true`) — 브리프 모호점에 대한 사용자 답변 반영 |
| 도메인 SSoT (선택) | 프로젝트 specs/ — §8 impl_requirements 참고 |

> 추측 금지: 브리프·SSoT에 있는 것만. 없으면 §5 이슈 기록. 창작 = 재작업 사유.
> FACTS는 PRD 이전 Human Gate 단계(`facts-writer`)의 산출물 — PRD는 이를 참고만 하고 재생성하지 않는다.
