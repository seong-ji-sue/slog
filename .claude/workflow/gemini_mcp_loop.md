# Gemini Orchestration SOP

**Purpose**: Defines when and how the team lead (Claude Opus) uses Gemini and runs meetings.
**Owner**: Team lead (this session)
**Last updated**: 2026.11.18

---

> **BOSU 일감 흐름 예외 (사용자 결정 — 지적 85)**: `.bosu/hub.json` 이 있는 프로젝트의 일감은 최신 develop 위 전체 테스트 GREEN 이면 `orca_flow.py finish` 가 커밋·develop 머지·작업 공간 정리·`git push origin develop` 까지 승인 없이 자동으로 한다(레포 루트 develop 의 보통 push 도 승인 표시 없이). 아래의 develop push 승인 게이트는 일감 흐름 밖(손으로 하는 작업)에만 해당한다. master·main push, 강제·지우기 push 는 언제나 사용자 승인.

## 역할 분리

| 주체 | 역할 |
|------|------|
| **팀장 (Claude Opus)** | 단순/복잡 분류 → Gemini 호출 여부 결정 → 회의 주재 → 에이전트 dispatch |
| **Gemini** | 요구사항 분석·다듬기, 외부 조사, 구현 명세서 초안, 필요 에이전트 제안 |
| **서브에이전트** | 회의에서 합의된 스펙 기반으로 각자 구현 |

---

## 단순 vs 복잡 판단 기준

| 분류 | 기준 |
|------|------|
| **단순** | 에이전트 1개로 해결 가능한 작은 작업 |
| **복잡** | 신기능·API·DB·인증·여러 에이전트 필요·다파일 변경 |

---

## 복잡 작업 전체 플로우

```
1. 팀장: 복잡 작업 판단
       ↓
2. Gemini 필수 호출 (gemini-web MCP)
   → mcp__gemini-web__ask_gemini 또는 deep_research 호출
   → 출력: 요구사항 정리, 외부 조사 결과, 구현 명세서 초안, 필요 에이전트 목록
       ↓
3. 회의 (팀장 주재, 서브에이전트 참여)
   - Gemini 명세서 공유
   - 각 에이전트 담당 확정
   - 구현 방법·API 스펙·인터페이스 합의
   - 의존성·실행 순서 결정 (예: DB → API → UI)
   - 각자 테스트 기준 합의
   - 회의록 → docs/meetings/YYYY-MM-DD_HHMM_[slug].md
       ↓
4. git worktree add (feature/<topic>)
       ↓
5. 에이전트 병렬 dispatch (회의 합의 기반, 독립 작업 동시 실행)
       ↓
6. ECCC 루프 (Execute → Check → Continue → Complete)
       ↓
7. feature push → local develop merge → worktree cleanup (자동)
       ↓
8. ⛔ push 승인 요청 → git push origin develop → 🚀 deploy
       ↓
9. Post-Complete (팀장 수동):
   - 회의록 마무리 (bosu:claude_curator)
   - 문서 싱크 (claude_curator 수동 호출)
   - 스킬·에이전트 확인 후 필요 시 추가
```

---

## 단순 작업 플로우

```
1. 팀장: 에이전트 1개 직접 dispatch (회의·Gemini 없음)
2. 에이전트 worktree에서 구현
3. code_reviewer 리뷰 (🔴 0개까지)
4. feature push → local develop merge → worktree cleanup
5. ⛔ push 승인 → git push origin develop
```

---

## Gemini 호출 방법

gemini-web MCP 서버를 통해 호출:

- 단발 질문 → `mcp__gemini-web__ask_gemini`
- 멀티턴 대화 → `mcp__gemini-web__start_chat` / `continue_chat`
- 파일 첨부 → `mcp__gemini-web__ask_with_file`
- 심층 조사(느림) → `mcp__gemini-web__deep_research`

Gemini 출력 항목:
1. 요구사항 정리·다듬기
2. 외부 조사 결과 (라이브러리, 레퍼런스 등)
3. 구현 명세서 (파일·단계·검증 방법)
4. 커밋 메시지 제안
5. 담당 에이전트 제안

> MCP 서버 설정 → 프로젝트 루트 `.mcp.json`, 인증·모델 설정 → `.claude/mcp_servers/`

---

## 회의의 역할

회의는 단순 계획 공유가 아니라 **실제 회사 회의처럼** 진행:

- Gemini 명세서를 기반으로 서브에이전트들이 각자 담당 파악
- API 스펙·인터페이스를 미리 합의 → 병렬 작업 시 충돌 최소화
- 의존성 순서 확정 → 흐름 꼬임 방지
- 테스트 기준 합의 → 오류 조기 발견

> 회의에서 합의가 잘 될수록 ECCC 루프에서 Stage 2·3 에스컬레이션이 줄어듦

---

## References

- Team lead definition → [../AGENT.md](../AGENT.md)
- Agent routing → [../AGENTS.md](../AGENTS.md)
- ECCC harness → [harness_ecc.md](harness_ecc.md)
- Gemini MCP server → [../mcp_servers/](../mcp_servers/)
