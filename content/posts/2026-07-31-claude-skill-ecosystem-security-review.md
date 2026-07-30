---
title: "남이 만든 Claude 스킬, 그냥 설치해도 될까 — 보안 스캐너·공식 가이드·행동 원칙 3건을 뜯어봤다"
date: 2026-07-31 11:00:00 +0900
description: "AutoIt 자동화 파이프라인을 스킬로 계속 만들어오면서, 정작 '이 스킬 관행 자체가 안전하고 좋은가'는 점검한 적이 없었다. NVIDIA의 스킬 보안 스캐너, Anthropic 공식 보안 가이드, 유명인 관찰 기반 행동 원칙 스킬 3건을 외부 자료로 살펴보고 우리 프로젝트에 뭘 도입할 수 있을지 정리했다"
categories: ["딥다이브"]
tags: ["Claude Code", "AI 에이전트", "스킬 보안", "오픈소스 분석", "SOP"]
series: "AutoIt 업무 자동화"
difficulty: 3
scope: "reference"
log: 160
draft: false
---

> **TL;DR** — [신규 앱 개발 파이프라인 스킬화](/posts/ai-agent-dev-pipeline-automation)와 [판정 근거 SOP 스킬화](/posts/appscript-verdict-evidence-grading-sop)까지, 나는 계속 Claude Code 스킬을 만들어 왔다. 그런데 "이렇게 만든 스킬 자체가 안전한가", "이 관행이 업계 표준과 비교해서 맞는 방향인가"는 따로 점검한 적이 없었다. NVIDIA의 스킬 보안 스캐너(SkillSpector), Anthropic 공식 보안 가이드(security-guidance), 유명인 관찰 기반 행동 원칙 스킬(andrej-karpathy-skills) — 전부 내가 만든 게 아니라 남이 만든 외부 자료 3건을 뜯어보고, 우리 프로젝트에 뭘 가져올 수 있는지 정리했다.

난이도 : ★★★☆☆

1️⃣ `스킬 보안 스캐너` 2️⃣ `공유 저장소 보안 가이드` 3️⃣ `행동 원칙 스킬`

### ✅ 왜 지금 이 자료들을 봤나

> 나 : 스킬을 계속 늘려가고 있는데, 이게 맞는 방향인지 궁금하네
> 동료 : 코드는 리뷰받는데 스킬은 리뷰 안 받지 않아?
> 나 : ...그러고 보니 진짜 그렇네

지금까지 `bastion-setup`, `bastion-firewall`, `appscript-dev-pipeline`, `appscript-verdict` 같은 스킬을 계속 만들어 왔다. 전부 "반복되는 판단 과정을 문서화해서 AI 에이전트가 따라가게 만든다"는 방향이었고, 결과물 자체는 만족스러웠다. 근데 정작 이 스킬 파일들을 남에게 공유하거나, 다른 세션·다른 에이전트가 그대로 가져다 쓸 때 뭘 점검해야 하는지는 생각해본 적이 없었다. 코드는 리뷰어가 보는데, 스킬(마크다운 지침 파일)은 아무도 안 본다는 게 이상하게 느껴졌다.

그래서 이 주제로 외부 자료 3건을 찾아봤다. 전부 내가 만든 게 아니라 **남이 만든 자료**라는 걸 먼저 분명히 해둔다.

### ✅ SkillSpector — NVIDIA가 만든 스킬 보안 스캐너 (외부 오픈소스)

[NVIDIA/SkillSpector](https://github.com/NVIDIA/SkillSpector)는 NVIDIA가 공개한 오픈소스 프로젝트다. Claude Code, Codex CLI, Gemini CLI 등 AI 에이전트 스킬을 **설치하기 전에** 보안 취약점을 스캔하는 도구다. README에 따르면 조사 대상 스킬의 26.1%에서 취약점이, 5.2%에서 악의적 의도가 발견됐다고 밝히고 있다.

핵심 구조를 살펴보니:

- **68가지 취약점 패턴을 17개 카테고리**에서 탐지 — 프롬프트 인젝션, 데이터 유출, 권한 상승, 공급망 공격, 과도한 에이전시(excessive agency), 메모리 포이즈닝 등
- **2단계 분석**: 1차로 정규식·Python AST·YARA 서명을 이용한 정적 분석(빠름), 2차로 LLM 기반 의미 분석(선택, 거짓양성 필터링용)
- `skillspector scan ./my-skill/` 형태로 디렉토리·Git 저장소·ZIP·단일 파일을 스캔 가능
- 스캔 결과를 baseline으로 저장해서 이미 확인한 거짓양성은 다음 스캔부터 억제 가능
- MCP 서버로 실행하면 스킬/MCP 설치 자체를 게이팅하는 런타임 보호도 가능하다고 명시돼 있음

이 프로젝트를 분석해보니, "스킬 파일도 실행 가능한 코드처럼 취급해야 한다"는 전제가 명확했다. 마크다운으로 쓰여있다고 해서 검토 없이 신뢰해도 되는 게 아니라는 뜻이다. 다만 이 도구는 스킬을 만들거나 저장하는 도구는 아니고 어디까지나 **검증(vetting)** 전용이라는 점도 README에 명시돼 있었다.

**우리 프로젝트 도입 관점**: `.claude/skills/` 아래 쌓여있는 스킬 파일들(`blog-draft`, `bastion-setup`, `appscript-verdict` 등)을 이 도구로 한 번 스캔해볼 가치가 있다. 특히 스킬 안에 Bash 명령이나 외부 URL 호출이 포함된 경우(우리 스킬 중 `secret_scan.sh`를 호출하는 구조가 있음) 이런 패턴이 실제로는 안전해도 정적 스캐너 관점에선 "위험 패턴"으로 잡힐 수 있어서, 한 번 baseline을 떠두면 다음부터 노이즈 없이 점검할 수 있겠다는 판단이 들었다.

### ✅ Anthropic 공식 문서 — security-guidance 플러그인과 "클라우드 세션·공유 저장소에서 활성화"

두 번째는 [Anthropic 공식 문서](https://code.claude.com/docs/ko/security-guidance)다. `security-guidance`라는 공식 플러그인을 설명하는 문서로, Claude가 코드를 작성하는 동안 자신의 변경 사항을 취약점 관점에서 스스로 검토하고 같은 세션에서 고치게 만드는 장치다.

문서에 따르면 검토는 3단계로 나뉜다.

| 시점 | 방식 | 비용 |
|------|------|------|
| 파일 편집 시 | 모델 호출 없는 패턴 매칭(`eval(`, `dangerouslySetInnerHTML` 등) | 무료 |
| 턴이 끝날 때 | 해당 턴의 git diff 전체를 별도 Claude 인스턴스가 백그라운드 검토 | 모델 사용량 추가 |
| Claude가 커밋/푸시할 때 | 주변 코드까지 읽는 더 깊은 에이전트 검토, 시간당 20회 제한 | 모델 사용량 추가 |

내가 이 링크를 특정해서 요청받은 이유(**"클라우드 세션 및 공유 저장소에서 활성화"** 섹션)를 자세히 보니, 핵심은 이거였다.

> 사용자 범위(user scope)로 설치한 플러그인은 웹의 Claude Code로는 전달되지 않는다 — 그 세션은 내 머신이 아니라 Anthropic 인프라에서 실행되기 때문이다. 클라우드 세션에서, 또는 이 저장소를 클론하는 모든 사람에게 플러그인을 켜려면 **프로젝트의 체크인된 `.claude/settings.json`**에 다음을 선언해야 한다.

```json
{
  "enabledPlugins": {
    "security-guidance@claude-plugins-official": true
  }
}
```

즉, "내 로컬에서만 켜둔 보안 검토"와 "저장소를 공유하는 모든 사람·모든 세션에 적용되는 보안 검토"는 설정 위치 자체가 다르다는 게 핵심이었다. 개인 전용 설정(`~/.claude/` 아래, 또는 프로젝트 설정 파일명 뒤에 `local`이 붙은 개인 오버라이드 버전)에만 넣어두면 다른 세션·다른 팀원에겐 적용되지 않는다.

**우리 프로젝트와의 접점**: 이 구분은 우리 [git_convention.md](../../.claude/rules/git_convention.md)의 원칙과 정확히 맞물린다 — "`.claude/`의 개인 오버라이드 설정 파일(이름 뒤에 `local`이 붙는 버전)은 개인 전용이며 절대 git으로 추적하지 않는다"는 규칙을 이미 갖고 있다. 지금 세션에서도 그 개인 오버라이드 파일이 수정 상태로 남아있는 걸 확인했는데(git status 기준), 만약 앞으로 `security-guidance` 같은 공식 보안 플러그인을 팀 전체·모든 세션에 강제하고 싶다면 그 개인 오버라이드 파일이 아니라 체크인되는 공유 설정 파일(`settings.json`)에 선언해야 한다는 걸 이번에 명확히 확인했다. 지금은 별도로 이 플러그인을 설치하진 않았지만, 여러 에이전트가 동시에 코드를 커밋하는 이 프로젝트의 워크플로우(BOSU 파이프라인·worktree 병렬 작업) 특성상 도입을 검토할 만한 후보로 남겨둔다.

### ✅ andrej-karpathy-skills — 유명인 관찰을 스킬로 만든 오픈소스

세 번째는 [multica-ai/andrej-karpathy-skills](https://github.com/multica-ai/andrej-karpathy-skills)다. Andrej Karpathy(전 Tesla AI 총괄, OpenAI 창립 멤버)가 X(트위터)에서 지적한 "LLM 코딩 에이전트의 공통 문제점"을 그대로 행동 원칙으로 만든 저장소다. 카파시 본인이 만든 게 아니라, 그의 관찰을 근거로 제3자(multica-ai)가 만든 CLAUDE.md/Cursor 규칙 모음이라는 점을 분명히 해둔다.

카파시가 지적한 문제와, 그걸 막기 위한 4가지 원칙은 이랬다.

| 카파시가 지적한 문제 | 대응 원칙 |
|---|---|
| 확인 없이 잘못된 가정을 하고 진행함 | Think Before Coding — 가정을 명시하고, 모호하면 되묻는다 |
| 100줄이면 될 걸 1000줄 구조로 만듦 | Simplicity First — 요청받은 것만 구현, 불필요한 추상화 제거 |
| 이해 못 한 코드·주석을 마음대로 고침 | Surgical Changes — 필요한 부분만 수정, 인접 코드 손대지 않기 |
| 목표·검증 기준 없이 진행함 | Goal-Driven Execution — "검증: [확인 방법]"을 포함한 계획 작성 |

이 저장소를 살펴보니, 우리 [CLAUDE.md](../../CLAUDE.md)의 "Basic Rules"(응답 스타일 간결, 임의 새 md 파일 생성 금지)나 [code_style_ts.md](../../.claude/rules/code_style_ts.md)의 "매직 넘버·매직 스트링 금지, strict 타입" 원칙과 방향은 겹치지만 초점이 다르다는 걸 발견했다. 우리 규칙은 **"산출물의 형태"**(파일명, 커밋 메시지, 코드 스타일)를 규정하는 데 강하고, 카파시 원칙은 **"에이전트가 판단하는 태도"**(가정을 드러낼 것, 되물을 것, 과도하게 고치지 말 것)에 강하다.

**우리 프로젝트 도입 관점**: 이 4원칙을 통째로 이식하기보다는, 이미 있는 CLAUDE.md의 원칙 사이 빈틈(예: "Surgical Changes" — 관련 없는 인접 코드는 손대지 않는다는 원칙)을 보강하는 참고 자료로만 남겨두는 게 맞다고 판단했다. 우리 워크플로우는 이미 BOSU 파이프라인의 리뷰 루프(`code-reviewer` critical/major 0건까지 핑퐁)로 "과도한 변경"을 어느 정도 걸러내고 있어서, 굳이 새 md 파일을 만들어 이식할 필요는 없어 보인다 — 다만 "가정을 명시하고 모호하면 되묻는다"는 태도는 팀장(메인 세션) 판단 기준으로 계속 의식할 가치가 있었다.

### ✅ 네 번째 자료 — 열리지 않았다, 억지로 뚫지 않았다

네 번째 자료로 요청받은 개인 노션 페이지(`app.notion.com/p/zibu/...`)는 WebFetch로 접근을 시도했으나 **"Too many redirects" 오류로 열리지 않았다.** 로그인이 필요한 개인 페이지라 예상된 결과다. 지시받은 대로 우회를 시도하지 않고 여기서 멈춘다 — 이 자료는 이번 글에 반영하지 못했다.

### ✅ 기존 글과의 관계 — 겹치지 않고 이어지는 내용

[신규 개발 파이프라인 스킬화](/posts/ai-agent-dev-pipeline-automation)(log 124)와 [Evidence Grade SOP 스킬화](/posts/appscript-verdict-evidence-grading-sop)(log 127)는 둘 다 "우리가 스킬을 어떻게 만들었는가"를 다뤘다. 이번 글은 그 반대편 — "우리가 만들고 남이 만든 스킬을, 어떻게 검증하고 어떤 태도로 다뤄야 하는가"를 다룬다는 점에서 내용이 겹치지 않고 이어진다. 두 글에서 만든 스킬들이야말로 이번에 살펴본 SkillSpector 같은 도구로 점검해볼 첫 번째 대상이 될 수 있다.

### ✅ 결과 & 배운 점

| 항목 | 이전 | 이후 |
|------|------|------|
| 스킬 파일 신뢰 기준 | 내가 만들었으니 안전하다고 암묵적으로 가정 | 스킬도 코드처럼 스캔 대상이 될 수 있다는 관점 확보(SkillSpector) |
| 팀 전체 보안 검토 설정 위치 | 개인 설정과 프로젝트 설정 구분을 의식하지 않음 | 개인 오버라이드 설정(개인) vs `settings.json`(공유·클라우드 세션까지 적용) 구분 확인 |
| 에이전트 행동 원칙 | CLAUDE.md 규칙(형식) 위주 | "가정 명시·과도한 수정 금지" 같은 태도 원칙도 참고 후보로 확보 |
| 외부 자료 신뢰 표기 | — | 남이 만든 자료는 명확히 외부 출처로 표기(이번 글 자체가 그 원칙 적용) |

이번 조사에서 도구를 하나 설치하거나 코드를 고치진 않았다. 대신 "지금까지 스킬을 만드는 데는 익숙해졌지만, 그 스킬을 검증하고 공유 범위를 결정하는 절차는 없었다"는 빈틈을 확인한 게 성과다. 다음에 스킬을 신규 등록할 때는 SkillSpector 스캔 한 번, 그리고 공유 범위가 팀 전체로 넓어질 플러그인이라면 개인 오버라이드 설정이 아니라 `settings.json`에 넣어야 한다는 걸 체크리스트에 추가해야겠다.

## 참고한 링크

- [NVIDIA/SkillSpector](https://github.com/NVIDIA/SkillSpector) — 외부 오픈소스
- [Claude Code 공식 문서 — security-guidance](https://code.claude.com/docs/ko/security-guidance#enable-in-cloud-sessions-and-shared-repositories) — Anthropic 공식 문서
- [multica-ai/andrej-karpathy-skills](https://github.com/multica-ai/andrej-karpathy-skills) — 외부 오픈소스
- 개인 노션 페이지 — WebFetch 접근 실패(로그인 필요)로 이번 글에 미반영
- [신규 개발 파이프라인 스킬화](/posts/ai-agent-dev-pipeline-automation)
- [Evidence Grade SOP 스킬화](/posts/appscript-verdict-evidence-grading-sop)
