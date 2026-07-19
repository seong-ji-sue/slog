---
name: blog-draft
description: >
  현재 세션의 작업을 worklog 초안으로 자동 생성한다.
  트리거: 사용자가 /blog-draft 호출, 또는 "오늘 작업 블로그 초안", "작업 로그 초안 만들어줘" 요청 시.
  인자(선택): 주제 또는 슬러그 힌트 (없으면 현재 세션 전체를 대상으로 함).
---

# blog-draft 스킬

slog 블로그(`/Users/seongjisu/Documents/project/slog`)의 `content/drafts/` 에
worklog 초안 파일을 생성한다. 반드시 아래 5단계를 순서대로 실행한다.

---

## 안전 규칙 (최우선 — 어떤 경우에도 위반 금지)

- **자동 공개 절대 금지**: frontmatter `draft: true` 는 생성 시 고정이며, 스킬이 직접 `false` 로 바꾸지 않는다.
- **secret_scan 통과 전 발행 이동 금지**: 3단계 스캔이 exit 1 을 반환하면 파일을 `content/posts/` 로 이동하지 않는다.
- **회사·내부 시스템명 일반화**: 실제 회사명, 내부 서비스명, 내부 도메인은 "현 직장", "사내 시스템", "내부 서비스" 등 role 명칭으로 치환한다. 특정 인명(한글 성+이름)은 "팀장", "동료" 등으로 대체한다.

---

## 0단계 — 프로젝트 카테고리 선택

작업 내용을 아래 7종 project taxonomy 중 하나로 분류한다(불확실하면 사용자에게 물어본다):

| project 값 | 설명 |
|-----------|------|
| `유튜브-자막-요약` | 유튜브 자막 다운로드 및 요약 도구 |
| `ai-스킬-오케스트레이션` | AI 스킬/에이전트 오케스트레이션 모음 |
| `autoit-자동화` | AutoIt 기반 업무 자동화 (회사) |
| `ssh-key-관리` | SSH Key 관리 솔루션 (회사) |
| `윈도우-설정` | 윈도우 설정·운영 (회사) |
| `aws-관리` | AWS 인프라 관리·설정 (회사) |
| `ai-블로그-자동관리` | 이 블로그 자체의 AI 자동화(spec 파이프라인, blog-draft 등) |

회사 프로젝트(`autoit-자동화`·`ssh-key-관리`·`윈도우-설정`·`aws-관리`)로 분류된 경우, 1단계 요약과 2단계 본문 작성 시 **기술적 구현 내용 위주로 서술**하고 회사명·내부 시스템명·고객사명 등 식별 정보는 일반화된 설명으로 치환한다(안전 규칙과 동일 원칙).

## 1단계 — 작업 요약

인자로 주제가 주어졌으면 그 주제를 기준으로, 없으면 현재 대화 세션 전체를 분석한다.
아래 5개 항목으로 의미 단위 요약을 작성한다 (초안 본문의 재료가 됨):

1. **목표** — 이 세션에서 하려던 것 (원래 요구사항)
2. **작업 내역** — 시간순이 아닌 의미순 3~5개 묶음. 각 항목: "무엇을 → 어떻게 → 결과"
3. **의사결정** — "A vs B 에서 B 선택, 이유는 OO" 형태. 면접·회고 재사용 재료
4. **막혔던 것 & 해결** — 에러·삽질과 원인·해결 방법. 없으면 생략
5. **결과 & 다음 할 일** — 산출물(파일/커밋/PR), 남은 TODO

---

## 2단계 — 초안 생성

`templates/worklog.md` 구조와 `docs/STYLE_GUIDE.md` 말투를 동시에 적용해
완성된 마크다운 본문을 작성한다.

### 구조 (templates/worklog.md 기준)

```
---
(frontmatter — 4단계에서 채움)
---

> **TL;DR** — 한 줄 요약 (형광펜 계승)

1️⃣ `핵심작업1` 2️⃣ `핵심작업2`

## ✅ 목표
## ✅ 작업 내역
## ✅ 의사결정 기록
## ✅ 막혔던 것 & 해결
## ✅ 결과 & 다음 할 일

### 체크리스트 (공개 전 필수)
- [ ] 시크릿·API 키·내부 URL 마스킹 확인
- [ ] 회사 고유 정보(프로젝트명·인명) 마스킹 확인
- [ ] draft: false 로 변경
```

### 말투 규칙 (docs/STYLE_GUIDE.md)

- 본문 서술: 평어체 `~다 / ~된다 / ~이다`
- 리스트·표·요약: 개조식 `~음 / ~함 / ~됨 / ~임`
- 존댓말(`~합니다`) 금지
- `~!` 는 문단 마무리에 글당 2~3회만
- 1인칭: "나는/내가" 사용, "필자" 금지
- 난이도 별점: `난이도 : ★★★☆☆` 형식 (TL;DR 바로 아래)
- ✅ 섹션 마커 유지

---

## 3단계 — 마스킹 스캔

생성된 초안 내용을 임시 버퍼에 두고, 아래 명령으로 스캔을 실행한다:

```bash
bash /Users/seongjisu/Documents/project/slog/.claude/skills/blog-draft/secret_scan.sh <파일경로>
```

- **exit 0 / "CLEAN"** → 4단계로 진행
- **exit 1** → 발견된 라인을 사용자에게 보여주고, 해당 내용을 수정한 뒤 스캔을 재실행한다. 통과 전에는 파일 저장을 완료하지 않는다.

---

## 4단계 — 파일 저장

저장 경로: `content/drafts/YYYY-MM-DD-slug.md`

- `YYYY-MM-DD`: 오늘 날짜 (`date +%Y-%m-%d`)
- `slug`: 주제에서 영문 소문자·하이픈으로 추출 (예: `blog-draft-skill-setup`)

### frontmatter 규칙

```yaml
---
title: "글 제목"
date: YYYY-MM-DD HH:MM:00 +0900
description: "검색 결과·목록에 노출될 한 줄 요약"
categories: ["작업로그"]
tags: ["claude-code"]        # 관련 기술 태그 추가
tools: []                    # 사용한 도구·스킬
project: "<0단계에서 선택한 project 값>"
log: <N>                     # 아래 규칙으로 계산
difficulty: <1~5>            # 별점 숫자 (1=★☆☆☆☆ ~ 5=★★★★★)
draft: true                  # 고정 — 스킬이 절대 false 로 바꾸지 않음
---
```

**log 번호 계산**:
```bash
# content/posts/ 와 content/drafts/ 양쪽에서 최대값 추출 후 +1
MAX_LOG=$(grep -h 'log:' \
  /Users/seongjisu/Documents/project/slog/content/posts/*.md \
  /Users/seongjisu/Documents/project/slog/content/drafts/*.md \
  2>/dev/null | grep -oE '[0-9]+' | sort -n | tail -1)
NEXT_LOG=$(( ${MAX_LOG:-81} + 1 ))
```

---

## 5단계 — 사용자 검토 안내

파일 저장 후 아래 메시지를 출력한다:

```
초안 저장 완료: content/drafts/YYYY-MM-DD-slug.md (log: N)

검토 후 발행하려면:
1. 파일을 열어 내용 확인 및 수정
2. frontmatter 에서 draft: true → draft: false 로 변경
3. 파일을 content/posts/ 로 이동
4. git add · commit · push

⚠️ 자동 발행은 하지 않음. 위 4단계를 직접 완료해야 블로그에 반영됨.
```
