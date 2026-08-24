# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: B-02.spec.js >> AC-B02-02: 카테고리 필터 클릭 시 해당 카테고리 글만 노출되고 버튼이 활성 상태가 됨
- Location: B-02.spec.js:14:1

# Error details

```
TimeoutError: locator.click: Timeout 2500ms exceeded.
Call log:
  - waiting for getByTestId('B-02-tab-filter').getByRole('button', { name: '트러블슈팅' })

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - banner [ref=e2]:
    - generic [ref=e3]:
      - link "SLOG 홈으로" [ref=e4] [cursor=pointer]:
        - /url: /
        - text: SLOG_
      - navigation "주 내비게이션" [ref=e5]:
        - link "글" [ref=e6] [cursor=pointer]:
          - /url: /posts
        - link "핫이슈" [ref=e7] [cursor=pointer]:
          - /url: /hot-issues
        - link "태그" [ref=e8] [cursor=pointer]:
          - /url: /tags
        - link "소개" [ref=e9] [cursor=pointer]:
          - /url: /about
        - link "RSS" [ref=e10] [cursor=pointer]:
          - /url: "#"
      - button "다크 모드로 전환" [ref=e11] [cursor=pointer]: DARK
  - main [ref=e12]:
    - main [ref=e13]:
      - heading "글" [level=1] [ref=e14]
      - searchbox "글 검색" [ref=e15]
      - group "분류 필터" [ref=e16]:
        - button "전체" [ref=e17] [cursor=pointer]
        - button "회사 프로젝트" [ref=e18] [cursor=pointer]
        - button "개인 프로젝트" [ref=e19] [cursor=pointer]
        - button "참고자료" [ref=e20] [cursor=pointer]
        - button "기술조사" [ref=e21] [cursor=pointer]
      - generic [ref=e22]:
        - group "정렬 기준" [ref=e23]:
          - button "최신순" [ref=e24] [cursor=pointer]
          - button "조회수순" [ref=e25] [cursor=pointer]
        - group "보기 형식" [ref=e26]:
          - button "목록" [pressed] [ref=e27] [cursor=pointer]
          - button "카드" [ref=e28] [cursor=pointer]
      - generic [ref=e29]:
        - generic [ref=e30]:
          - generic [ref=e31]:
            - text: NO_133
            - link "참고자료" [ref=e32] [cursor=pointer]:
              - /url: /posts?scope=reference
          - link "대기업 개발 조직은 AI를 어떻게 쓰고 있나 — 생산성·보안·조직문화 리서치 정리 GitHub Copilot 도입 이후 생산성 지표와 기술 부채 사례, 국내 대기업의 AI 보안 정책, 버스 지수·무비난 포스트모템 같은 조직 문화 장치까지 — AI 시대 개발 조직 운영에 대해 조사·정리한 리서치 노트 2026.07.31 · 난이도 ★★☆☆☆ · 5 min · 조회 0" [ref=e33] [cursor=pointer]:
            - /url: /posts/2026-07-31-ai-adoption-large-tech-orgs-research
            - heading "대기업 개발 조직은 AI를 어떻게 쓰고 있나 — 생산성·보안·조직문화 리서치 정리" [level=2] [ref=e34]:
              - mark [ref=e35]: 대기업 개발 조직은 AI를 어떻게 쓰고 있나 — 생산성·보안·조직문화 리서치 정리
            - paragraph [ref=e36]: GitHub Copilot 도입 이후 생산성 지표와 기술 부채 사례, 국내 대기업의 AI 보안 정책, 버스 지수·무비난 포스트모템 같은 조직 문화 장치까지 — AI 시대 개발 조직 운영에 대해 조사·정리한 리서치 노트
            - generic [ref=e37]: 2026.07.31 · 난이도 ★★☆☆☆ · 5 min · 조회 0
        - generic [ref=e38]:
          - generic [ref=e39]:
            - text: NO_132
            - link "참고자료" [ref=e40] [cursor=pointer]:
              - /url: /posts?scope=reference
          - link "AI 에이전트는 E2E 테스트를 대체할까 — Slack 엔지니어링팀 200건 실험 정리 AI 에이전트가 기존 결정론적 E2E 테스트를 대체할 수 있는지 Slack 엔지니어링팀이 200건 이상의 실험으로 검증한 내용을 조사·정리했다. 신뢰성·속도·비용 데이터를 보면 답은 '대체가 아니라 보완'이었다 2026.07.31 · 난이도 ★★☆☆☆ · 5 min · 조회 4" [ref=e41] [cursor=pointer]:
            - /url: /posts/2026-07-31-agentic-testing-research-notes
            - heading "AI 에이전트는 E2E 테스트를 대체할까 — Slack 엔지니어링팀 200건 실험 정리" [level=2] [ref=e42]:
              - mark [ref=e43]: AI 에이전트는 E2E 테스트를 대체할까 — Slack 엔지니어링팀 200건 실험 정리
            - paragraph [ref=e44]: AI 에이전트가 기존 결정론적 E2E 테스트를 대체할 수 있는지 Slack 엔지니어링팀이 200건 이상의 실험으로 검증한 내용을 조사·정리했다. 신뢰성·속도·비용 데이터를 보면 답은 '대체가 아니라 보완'이었다
            - generic [ref=e45]: 2026.07.31 · 난이도 ★★☆☆☆ · 5 min · 조회 4
        - generic [ref=e46]:
          - generic [ref=e47]:
            - text: NO_131
            - link "기술조사" [ref=e48] [cursor=pointer]:
              - /url: /posts?scope=research
          - link "TDD 개념 정리 — Fake It부터 삼각측량까지 테스트를 먼저 쓰고 최소한의 코드로 통과시킨 뒤 정리한다는 TDD의 기본 사이클부터, 막혔을 때 쓰는 6가지 실전 기법(Fake It·삼각측량 등), FIRST 원칙, 테스트 피라미드, 테스트 더블 용어까지 학습하며 정리한 개념 노트 2026.07.31 · 난이도 ★★☆☆☆ · 6 min · 조회 15" [ref=e49] [cursor=pointer]:
            - /url: /posts/2026-07-31-tdd-concepts-and-techniques
            - heading "TDD 개념 정리 — Fake It부터 삼각측량까지" [level=2] [ref=e50]:
              - mark [ref=e51]: TDD 개념 정리 — Fake It부터 삼각측량까지
            - paragraph [ref=e52]: 테스트를 먼저 쓰고 최소한의 코드로 통과시킨 뒤 정리한다는 TDD의 기본 사이클부터, 막혔을 때 쓰는 6가지 실전 기법(Fake It·삼각측량 등), FIRST 원칙, 테스트 피라미드, 테스트 더블 용어까지 학습하며 정리한 개념 노트
            - generic [ref=e53]: 2026.07.31 · 난이도 ★★☆☆☆ · 6 min · 조회 15
        - generic [ref=e54]:
          - generic [ref=e55]:
            - text: NO_130
            - link "기술조사" [ref=e56] [cursor=pointer]:
              - /url: /posts?scope=research
          - link "Git처럼 작업을 전환하는 AI 컨텍스트 매니저 설계기 세션이 끊기면 AI와의 작업 맥락이 통째로 휘발되는 문제를, 1세대 단일 작업 기록 시스템에서 Git 스타일 멀티태스킹 구조(2세대)로 발전시킨 설계 기록. 서버단 캐싱과 무엇이 다른지도 함께 정리했다 2026.07.31 · 난이도 ★★★☆☆ · 5 min · 조회 0" [ref=e57] [cursor=pointer]:
            - /url: /posts/2026-07-31-git-style-context-manager-for-ai
            - heading "Git처럼 작업을 전환하는 AI 컨텍스트 매니저 설계기" [level=2] [ref=e58]:
              - mark [ref=e59]: Git처럼 작업을 전환하는 AI 컨텍스트 매니저 설계기
            - paragraph [ref=e60]: 세션이 끊기면 AI와의 작업 맥락이 통째로 휘발되는 문제를, 1세대 단일 작업 기록 시스템에서 Git 스타일 멀티태스킹 구조(2세대)로 발전시킨 설계 기록. 서버단 캐싱과 무엇이 다른지도 함께 정리했다
            - generic [ref=e61]: 2026.07.31 · 난이도 ★★★☆☆ · 5 min · 조회 0
        - generic [ref=e62]:
          - generic [ref=e63]:
            - text: NO_160
            - link "참고자료" [ref=e64] [cursor=pointer]:
              - /url: /posts?scope=reference
          - link "남이 만든 Claude 스킬, 그냥 설치해도 될까 — 보안 스캐너·공식 가이드·행동 원칙 3건을 뜯어봤다 AutoIt 자동화 파이프라인을 스킬로 계속 만들어오면서, 정작 '이 스킬 관행 자체가 안전하고 좋은가'는 점검한 적이 없었다. NVIDIA의 스킬 보안 스캐너, Anthropic 공식 보안 가이드, 유명인 관찰 기반 행동 원칙 스킬 3건을 외부 자료로 살펴보고 우리 프로젝트에 뭘 도입할 수 있을지 정리했다 2026.07.31 · 난이도 ★★★☆☆ · 11 min · 조회 0" [ref=e65] [cursor=pointer]:
            - /url: /posts/2026-07-31-claude-skill-ecosystem-security-review
            - heading "남이 만든 Claude 스킬, 그냥 설치해도 될까 — 보안 스캐너·공식 가이드·행동 원칙 3건을 뜯어봤다" [level=2] [ref=e66]:
              - mark [ref=e67]: 남이 만든 Claude 스킬, 그냥 설치해도 될까 — 보안 스캐너·공식 가이드·행동 원칙 3건을 뜯어봤다
            - paragraph [ref=e68]: AutoIt 자동화 파이프라인을 스킬로 계속 만들어오면서, 정작 '이 스킬 관행 자체가 안전하고 좋은가'는 점검한 적이 없었다. NVIDIA의 스킬 보안 스캐너, Anthropic 공식 보안 가이드, 유명인 관찰 기반 행동 원칙 스킬 3건을 외부 자료로 살펴보고 우리 프로젝트에 뭘 도입할 수 있을지 정리했다
            - generic [ref=e69]: 2026.07.31 · 난이도 ★★★☆☆ · 11 min · 조회 0
        - generic [ref=e70]:
          - generic [ref=e71]:
            - text: NO_129
            - link "기술조사" [ref=e72] [cursor=pointer]:
              - /url: /posts?scope=research
          - link "20,000줄짜리 CLAUDE.md를 500줄로 — 모듈별 문서 분리 설계기 AI 설정 문서 하나가 20,000줄까지 불어나 매 요청마다 과금이 튀던 문제를, 역할별로 문서를 쪼개고 필요한 것만 골라 로드하는 구조로 다시 설계한 기록. 팀원 간 작업 이력 공유 부재 문제도 표준 폴더 구조로 함께 풀었다 2026.07.31 · 난이도 ★★★☆☆ · 4 min · 조회 0" [ref=e73] [cursor=pointer]:
            - /url: /posts/2026-07-31-claude-md-modular-structure-design
            - heading "20,000줄짜리 CLAUDE.md를 500줄로 — 모듈별 문서 분리 설계기" [level=2] [ref=e74]:
              - mark [ref=e75]: 20,000줄짜리 CLAUDE.md를 500줄로 — 모듈별 문서 분리 설계기
            - paragraph [ref=e76]: AI 설정 문서 하나가 20,000줄까지 불어나 매 요청마다 과금이 튀던 문제를, 역할별로 문서를 쪼개고 필요한 것만 골라 로드하는 구조로 다시 설계한 기록. 팀원 간 작업 이력 공유 부재 문제도 표준 폴더 구조로 함께 풀었다
            - generic [ref=e77]: 2026.07.31 · 난이도 ★★★☆☆ · 4 min · 조회 0
        - generic [ref=e78]:
          - generic [ref=e79]:
            - text: NO_128
            - link "기술조사" [ref=e80] [cursor=pointer]:
              - /url: /posts?scope=research
          - link "여러 AI에게 일을 나눠 맡기는 법 — 오케스트레이터 패턴과 Human Gate AI를 팀원처럼 쓰기 위해 Main-Sub 오케스트레이터 구조를 만들고, AI가 스스로 멈춰서 사람에게 물어봐야 하는 조건(Human Gate)을 명문화한 기록. 재사용 가능한 에이전트·스킬 생태계(ECC)를 먼저 찾고, 없을 때만 직접 만든다는 원칙도 함께 정리했다 2026.07.31 · 난이도 ★★★☆☆ · 6 min · 조회 0" [ref=e81] [cursor=pointer]:
            - /url: /posts/2026-07-31-multi-agent-orchestrator-human-gate
            - heading "여러 AI에게 일을 나눠 맡기는 법 — 오케스트레이터 패턴과 Human Gate" [level=2] [ref=e82]:
              - mark [ref=e83]: 여러 AI에게 일을 나눠 맡기는 법 — 오케스트레이터 패턴과 Human Gate
            - paragraph [ref=e84]: AI를 팀원처럼 쓰기 위해 Main-Sub 오케스트레이터 구조를 만들고, AI가 스스로 멈춰서 사람에게 물어봐야 하는 조건(Human Gate)을 명문화한 기록. 재사용 가능한 에이전트·스킬 생태계(ECC)를 먼저 찾고, 없을 때만 직접 만든다는 원칙도 함께 정리했다
            - generic [ref=e85]: 2026.07.31 · 난이도 ★★★☆☆ · 6 min · 조회 0
        - generic [ref=e86]:
          - generic [ref=e87]:
            - text: NO_127
            - link "회사 프로젝트" [ref=e88] [cursor=pointer]:
              - /url: /posts?scope=company
            - generic [ref=e89]: AutoIt 자동화
          - link "판정 실수를 코드가 아니라 SOP로 막기 — Evidence Grade 체계를 스킬로 박제하다 \"성공했다고 보고했는데 실제론 실패였던\" 사고를 판정엔진 하나 고치는 걸로 끝내지 않고, 다음에 누가 하든 같은 실수를 못 하도록 Evidence Grade A/B/C 체계를 Claude Code 스킬(SOP)로 박제한 기록 2026.07.31 · 난이도 ★★★★☆ · 5 min · 조회 0" [ref=e90] [cursor=pointer]:
            - /url: /posts/2026-07-31-appscript-verdict-evidence-grading-sop
            - heading "판정 실수를 코드가 아니라 SOP로 막기 — Evidence Grade 체계를 스킬로 박제하다" [level=2] [ref=e91]:
              - mark [ref=e92]: 판정 실수를 코드가 아니라 SOP로 막기 — Evidence Grade 체계를 스킬로 박제하다
            - paragraph [ref=e93]: "\"성공했다고 보고했는데 실제론 실패였던\" 사고를 판정엔진 하나 고치는 걸로 끝내지 않고, 다음에 누가 하든 같은 실수를 못 하도록 Evidence Grade A/B/C 체계를 Claude Code 스킬(SOP)로 박제한 기록"
            - generic [ref=e94]: 2026.07.31 · 난이도 ★★★★☆ · 5 min · 조회 0
        - generic [ref=e95]:
          - generic [ref=e96]:
            - text: NO_126
            - link "회사 프로젝트" [ref=e97] [cursor=pointer]:
              - /url: /posts?scope=company
            - generic [ref=e98]: AutoIt 자동화
          - link "WEB 자동화 앱 포트폴리오 확장 — 표준 구조를 새 앱마다 재사용하기 GitLab·Azure·Jenkins·사내 플랫폼까지 WEB 자동화 앱을 하나씩 늘려가면서, AppScript 공통화 리팩토링에서 세운 표준 구조를 신규 앱마다 어떻게 재사용했는지 정리한 기록 2026.07.30 · 난이도 ★★★☆☆ · 7 min · 조회 0" [ref=e99] [cursor=pointer]:
            - /url: /posts/2026-07-30-web-automation-portfolio-expansion
            - heading "WEB 자동화 앱 포트폴리오 확장 — 표준 구조를 새 앱마다 재사용하기" [level=2] [ref=e100]:
              - mark [ref=e101]: WEB 자동화 앱 포트폴리오 확장 — 표준 구조를 새 앱마다 재사용하기
            - paragraph [ref=e102]: GitLab·Azure·Jenkins·사내 플랫폼까지 WEB 자동화 앱을 하나씩 늘려가면서, AppScript 공통화 리팩토링에서 세운 표준 구조를 신규 앱마다 어떻게 재사용했는지 정리한 기록
            - generic [ref=e103]: 2026.07.30 · 난이도 ★★★☆☆ · 7 min · 조회 0
        - generic [ref=e104]:
          - generic [ref=e105]:
            - text: NO_125
            - link "회사 프로젝트" [ref=e106] [cursor=pointer]:
              - /url: /posts?scope=company
            - generic [ref=e107]: AutoIt 자동화
          - link "베스천 자동 세팅 스킬화 — 연결→방화벽→초기설정→배포 STEP 파이프라인 매 POC마다 손으로 반복하던 베스천 서버 세팅을 연결·방화벽·초기설정·배포 STEP 단위 스킬로 쪼갠 기록. ProxyCommand 점프호스트 전환과 로컬 SSoT 원칙, Workgroup 환경에서 RDS 라이선스(CAL)가 카운팅되지 않던 문제의 원인까지 정리했다 2026.07.30 · 난이도 ★★★★☆ · 16 min · 조회 0" [ref=e108] [cursor=pointer]:
            - /url: /posts/2026-07-30-bastion-automation-skillify
            - heading "베스천 자동 세팅 스킬화 — 연결→방화벽→초기설정→배포 STEP 파이프라인" [level=2] [ref=e109]:
              - mark [ref=e110]: 베스천 자동 세팅 스킬화 — 연결→방화벽→초기설정→배포 STEP 파이프라인
            - paragraph [ref=e111]: 매 POC마다 손으로 반복하던 베스천 서버 세팅을 연결·방화벽·초기설정·배포 STEP 단위 스킬로 쪼갠 기록. ProxyCommand 점프호스트 전환과 로컬 SSoT 원칙, Workgroup 환경에서 RDS 라이선스(CAL)가 카운팅되지 않던 문제의 원인까지 정리했다
            - generic [ref=e112]: 2026.07.30 · 난이도 ★★★★☆ · 16 min · 조회 0
        - generic [ref=e113]:
          - generic [ref=e114]:
            - text: NO_118
            - link "회사 프로젝트" [ref=e115] [cursor=pointer]:
              - /url: /posts?scope=company
            - generic [ref=e116]: AutoIt 자동화
          - link "배포 설정을 코드가 아니라 DB로 — config 중앙관리 전환 배포 버전 마커를 파일에서 config.ini 섹션으로 옮긴 작은 개선을 시작으로, 서버별 배포 설정 전체를 파일+환경델타 병합 방식에서 DB 중앙관리로 전환하며 겪은 인코딩·CRLF 트러블슈팅 기록 2026.07.30 · 난이도 ★★★☆☆ · 7 min · 조회 0" [ref=e117] [cursor=pointer]:
            - /url: /posts/2026-07-30-deploy-config-db-centralization
            - heading "배포 설정을 코드가 아니라 DB로 — config 중앙관리 전환" [level=2] [ref=e118]:
              - mark [ref=e119]: 배포 설정을 코드가 아니라 DB로 — config 중앙관리 전환
            - paragraph [ref=e120]: 배포 버전 마커를 파일에서 config.ini 섹션으로 옮긴 작은 개선을 시작으로, 서버별 배포 설정 전체를 파일+환경델타 병합 방식에서 DB 중앙관리로 전환하며 겪은 인코딩·CRLF 트러블슈팅 기록
            - generic [ref=e121]: 2026.07.30 · 난이도 ★★★☆☆ · 7 min · 조회 0
        - generic [ref=e122]:
          - generic [ref=e123]:
            - text: NO_124
            - link "회사 프로젝트" [ref=e124] [cursor=pointer]:
              - /url: /posts?scope=company
            - generic [ref=e125]: AutoIt 자동화
          - link "AI 에이전트로 신규 개발 파이프라인을 자동화하다 신규 앱 자동화 스크립트를 만들 때마다 반복되던 분석·개발·배포·검증 과정을 Claude Code 스킬로 파이프라인화하고, 스크립트 자체도 AI가 읽을 수 있는 로그 마커로 표준화한 기록 2026.07.29 · 난이도 ★★★☆☆ · 7 min · 조회 0" [ref=e126] [cursor=pointer]:
            - /url: /posts/2026-07-29-ai-agent-dev-pipeline-automation
            - heading "AI 에이전트로 신규 개발 파이프라인을 자동화하다" [level=2] [ref=e127]:
              - mark [ref=e128]: AI 에이전트로 신규 개발 파이프라인을 자동화하다
            - paragraph [ref=e129]: 신규 앱 자동화 스크립트를 만들 때마다 반복되던 분석·개발·배포·검증 과정을 Claude Code 스킬로 파이프라인화하고, 스크립트 자체도 AI가 읽을 수 있는 로그 마커로 표준화한 기록
            - generic [ref=e130]: 2026.07.29 · 난이도 ★★★☆☆ · 7 min · 조회 0
        - generic [ref=e131]:
          - generic [ref=e132]:
            - text: NO_117
            - link "회사 프로젝트" [ref=e133] [cursor=pointer]:
              - /url: /posts?scope=company
            - generic [ref=e134]: AutoIt 자동화
          - link "서버 자격증명을 안전하게 저장하기 — PEM에서 Fernet 암호화까지 서버 접속 비밀번호를 평문 컬럼·환경변수로 흩어 관리하다 Fernet 대칭키 암호화로 전환하고, AI 코드리뷰가 지적한 CRITICAL/HIGH 취약점을 반영해 모든 진입점에 일관 적용한 기록 2026.07.29 · 난이도 ★★★★☆ · 5 min · 조회 0" [ref=e135] [cursor=pointer]:
            - /url: /posts/2026-07-29-server-credential-fernet-encryption
            - heading "서버 자격증명을 안전하게 저장하기 — PEM에서 Fernet 암호화까지" [level=2] [ref=e136]:
              - mark [ref=e137]: 서버 자격증명을 안전하게 저장하기 — PEM에서 Fernet 암호화까지
            - paragraph [ref=e138]: 서버 접속 비밀번호를 평문 컬럼·환경변수로 흩어 관리하다 Fernet 대칭키 암호화로 전환하고, AI 코드리뷰가 지적한 CRITICAL/HIGH 취약점을 반영해 모든 진입점에 일관 적용한 기록
            - generic [ref=e139]: 2026.07.29 · 난이도 ★★★★☆ · 5 min · 조회 0
        - generic [ref=e140]:
          - generic [ref=e141]:
            - text: NO_116
            - link "회사 프로젝트" [ref=e142] [cursor=pointer]:
              - /url: /posts?scope=company
            - generic [ref=e143]: AutoIt 자동화
          - link "paramiko의 배신 — native SSH CLI로 전환한 이유 FastAPI 비동기 루프에서 paramiko를 쓰다 겪은 세션 충돌을 여러 차례 땜질하다, 결국 사내 보안 접근제어가 paramiko 자체를 차단한다는 사실을 확인하고 native SSH CLI로 전면 전환한 기록 2026.07.28 · 난이도 ★★★★☆ · 7 min · 조회 0" [ref=e144] [cursor=pointer]:
            - /url: /posts/2026-07-28-paramiko-native-ssh-migration
            - heading "paramiko의 배신 — native SSH CLI로 전환한 이유" [level=2] [ref=e145]:
              - mark [ref=e146]: paramiko의 배신 — native SSH CLI로 전환한 이유
            - paragraph [ref=e147]: FastAPI 비동기 루프에서 paramiko를 쓰다 겪은 세션 충돌을 여러 차례 땜질하다, 결국 사내 보안 접근제어가 paramiko 자체를 차단한다는 사실을 확인하고 native SSH CLI로 전면 전환한 기록
            - generic [ref=e148]: 2026.07.28 · 난이도 ★★★★☆ · 7 min · 조회 0
        - generic [ref=e149]:
          - generic [ref=e150]:
            - text: NO_123
            - link "회사 프로젝트" [ref=e151] [cursor=pointer]:
              - /url: /posts?scope=company
            - generic [ref=e152]: AutoIt 자동화
          - link "해외 POC 대응기 — 인프라·라이선스·보안정책 이슈들 동남아 고객사 POC를 여러 차례 지원하며 반복적으로 부딪힌 UAC 알림창, RDS 라이선스, C드라이브 접근 차단 이슈를 해결하고 AWS EC2에 Bastion 서버를 자동으로 세팅하기까지의 기록 2026.07.28 · 난이도 ★★★☆☆ · 10 min · 조회 0" [ref=e153] [cursor=pointer]:
            - /url: /posts/2026-07-28-overseas-poc-infra-license-security
            - heading "해외 POC 대응기 — 인프라·라이선스·보안정책 이슈들" [level=2] [ref=e154]:
              - mark [ref=e155]: 해외 POC 대응기 — 인프라·라이선스·보안정책 이슈들
            - paragraph [ref=e156]: 동남아 고객사 POC를 여러 차례 지원하며 반복적으로 부딪힌 UAC 알림창, RDS 라이선스, C드라이브 접근 차단 이슈를 해결하고 AWS EC2에 Bastion 서버를 자동으로 세팅하기까지의 기록
            - generic [ref=e157]: 2026.07.28 · 난이도 ★★★☆☆ · 10 min · 조회 0
        - generic [ref=e158]:
          - generic [ref=e159]:
            - text: NO_121
            - link "회사 프로젝트" [ref=e160] [cursor=pointer]:
              - /url: /posts?scope=company
            - generic [ref=e161]: AutoIt 자동화
          - link "반복되는 XPath 탐색을 자동화하는 자체 진단 도구 만들기 새 웹 자동화 스크립트를 만들 때마다 사람이 손으로 찾던 로그인 폼 XPath 탐색을, 코드부터 짜지 않고 PRD→PLAN→TC 순으로 기획한 뒤 자체 도구로 자동화한 과정 2026.07.27 · 난이도 ★★★☆☆ · 6 min · 조회 0" [ref=e162] [cursor=pointer]:
            - /url: /posts/2026-07-27-xpath-prober-self-tool
            - heading "반복되는 XPath 탐색을 자동화하는 자체 진단 도구 만들기" [level=2] [ref=e163]:
              - mark [ref=e164]: 반복되는 XPath 탐색을 자동화하는 자체 진단 도구 만들기
            - paragraph [ref=e165]: 새 웹 자동화 스크립트를 만들 때마다 사람이 손으로 찾던 로그인 폼 XPath 탐색을, 코드부터 짜지 않고 PRD→PLAN→TC 순으로 기획한 뒤 자체 도구로 자동화한 과정
            - generic [ref=e166]: 2026.07.27 · 난이도 ★★★☆☆ · 6 min · 조회 0
        - generic [ref=e167]:
          - generic [ref=e168]:
            - text: NO_112
            - link "회사 프로젝트" [ref=e169] [cursor=pointer]:
              - /url: /posts?scope=company
            - generic [ref=e170]: AutoIt 자동화
          - link "SAP GUI 로그인 자동화 — \"거짓 성공 판정\"을 구조적으로 차단하기까지 SAP GUI 자동 로그인 스크립트를 세 번 갈아엎으며 만든 기록. 진짜 문제는 로그인 자체가 아니라 '성공했다고 보고했는데 실제론 실패였던' 판정 사고였고, 이를 별도 판정엔진으로 뽑아내 구조적으로 해소했다. 2026.07.23 · 난이도 ★★★★★ · 9 min · 조회 0" [ref=e171] [cursor=pointer]:
            - /url: /posts/2026-07-23-sap-gui-login-verdict-engine
            - heading "SAP GUI 로그인 자동화 — \"거짓 성공 판정\"을 구조적으로 차단하기까지" [level=2] [ref=e172]:
              - mark [ref=e173]: SAP GUI 로그인 자동화 — "거짓 성공 판정"을 구조적으로 차단하기까지
            - paragraph [ref=e174]: SAP GUI 자동 로그인 스크립트를 세 번 갈아엎으며 만든 기록. 진짜 문제는 로그인 자체가 아니라 '성공했다고 보고했는데 실제론 실패였던' 판정 사고였고, 이를 별도 판정엔진으로 뽑아내 구조적으로 해소했다.
            - generic [ref=e175]: 2026.07.23 · 난이도 ★★★★★ · 9 min · 조회 0
        - generic [ref=e176]:
          - generic [ref=e177]:
            - text: NO_113
            - link "회사 프로젝트" [ref=e178] [cursor=pointer]:
              - /url: /posts?scope=company
            - generic [ref=e179]: AutoIt 자동화
          - link "VNC 원격 접속 자동화 신규 개발 — 고객 문의 하나에서 시작된 앱스크립트 PSM for SSH/System에서는 되는데 우리 플랫폼에서는 VNC가 되냐는 고객 문의에서 시작해, RFB 프로토콜을 조사하고 VNC 원격 접속 자동화 앱스크립트를 신규 개발한 기록 2026.07.21 · 난이도 ★★★☆☆ · 5 min · 조회 0" [ref=e180] [cursor=pointer]:
            - /url: /posts/2026-07-21-vnc-remote-automation
            - heading "VNC 원격 접속 자동화 신규 개발 — 고객 문의 하나에서 시작된 앱스크립트" [level=2] [ref=e181]:
              - mark [ref=e182]: VNC 원격 접속 자동화 신규 개발 — 고객 문의 하나에서 시작된 앱스크립트
            - paragraph [ref=e183]: PSM for SSH/System에서는 되는데 우리 플랫폼에서는 VNC가 되냐는 고객 문의에서 시작해, RFB 프로토콜을 조사하고 VNC 원격 접속 자동화 앱스크립트를 신규 개발한 기록
            - generic [ref=e184]: 2026.07.21 · 난이도 ★★★☆☆ · 5 min · 조회 0
        - generic [ref=e185]:
          - generic [ref=e186]:
            - text: NO_114
            - link "회사 프로젝트" [ref=e187] [cursor=pointer]:
              - /url: /posts?scope=company
            - generic [ref=e188]: AutoIt 자동화
          - link "해상도·DPI에 안 흔들리는 좌표 자동화 — 템플릿 매칭에서 ORB, 그리고 DPI Aware까지 같은 해상도인데 장비마다 이미지 매칭이 되거나 안 되는 문제에서 시작해, 템플릿 매칭 → ORB 특징점 매칭 → DPI Aware API 좌표 계산까지 세 번에 걸쳐 좌표 자동화를 갈아엎은 기록 2026.07.20 · 난이도 ★★★★☆ · 6 min · 조회 0" [ref=e189] [cursor=pointer]:
            - /url: /posts/2026-07-20-dpi-resolution-independent-coordinates
            - heading "해상도·DPI에 안 흔들리는 좌표 자동화 — 템플릿 매칭에서 ORB, 그리고 DPI Aware까지" [level=2] [ref=e190]:
              - mark [ref=e191]: 해상도·DPI에 안 흔들리는 좌표 자동화 — 템플릿 매칭에서 ORB, 그리고 DPI Aware까지
            - paragraph [ref=e192]: 같은 해상도인데 장비마다 이미지 매칭이 되거나 안 되는 문제에서 시작해, 템플릿 매칭 → ORB 특징점 매칭 → DPI Aware API 좌표 계산까지 세 번에 걸쳐 좌표 자동화를 갈아엎은 기록
            - generic [ref=e193]: 2026.07.20 · 난이도 ★★★★☆ · 6 min · 조회 0
        - generic [ref=e194]:
          - generic [ref=e195]:
            - text: NO_115
            - link "회사 프로젝트" [ref=e196] [cursor=pointer]:
              - /url: /posts?scope=company
            - generic [ref=e197]: AutoIt 자동화
          - link "AppScript 공통화 리팩토링 — 11종 표준화 + 버전드 구조 전환 앱마다 제각각이던 자동화 스크립트 구조를 표준 2파일 규칙(login/utils)과 버전드 디렉토리 레이아웃으로 통합한 기록. 이후 신규 앱 개발 속도를 좌우한 작업이었다 2026.07.19 · 난이도 ★★★☆☆ · 5 min · 조회 0" [ref=e198] [cursor=pointer]:
            - /url: /posts/2026-07-19-appscript-commonization-refactor
            - heading "AppScript 공통화 리팩토링 — 11종 표준화 + 버전드 구조 전환" [level=2] [ref=e199]:
              - mark [ref=e200]: AppScript 공통화 리팩토링 — 11종 표준화 + 버전드 구조 전환
            - paragraph [ref=e201]: 앱마다 제각각이던 자동화 스크립트 구조를 표준 2파일 규칙(login/utils)과 버전드 디렉토리 레이아웃으로 통합한 기록. 이후 신규 앱 개발 속도를 좌우한 작업이었다
            - generic [ref=e202]: 2026.07.19 · 난이도 ★★★☆☆ · 5 min · 조회 0
      - navigation "페이지 네비게이션" [ref=e203]:
        - button "이전 5페이지" [disabled] [ref=e204]: 이전
        - button "1페이지" [ref=e205] [cursor=pointer]: "1"
        - button "2페이지" [ref=e206] [cursor=pointer]: "2"
        - button "3페이지" [ref=e207] [cursor=pointer]: "3"
        - button "4페이지" [ref=e208] [cursor=pointer]: "4"
        - button "5페이지" [ref=e209] [cursor=pointer]: "5"
        - button "다음 5페이지" [ref=e210] [cursor=pointer]: 다음
  - contentinfo [ref=e211]:
    - generic [ref=e212]:
      - generic [ref=e213]: © 2026 Zibu — 기록으로 증명
      - generic [ref=e214]:
        - link "GitHub" [ref=e215] [cursor=pointer]:
          - /url: https://github.com/seong-ji-sue
        - text: ·
        - link "RSS" [ref=e216] [cursor=pointer]:
          - /url: "#"
        - text: ·
        - link "Tistory 아카이브" [ref=e217] [cursor=pointer]:
          - /url: https://zibu-story.tistory.com
  - button "Open Next.js Dev Tools" [ref=e223] [cursor=pointer]:
    - img [ref=e224]
  - alert [ref=e227]
```

# Test source

```ts
  1  | // B-02.spec.js — 전체 글 목록 + 태그 필터 화면 TC
  2  | // 소비 계약: prd.contract.json screens[B-02] + acs[AC-B02-*]
  3  | const { test, expect } = require('@playwright/test');
  4  | const { gotoScreen, ui } = require('./helpers');
  5  | 
  6  | test('AC-B02-01: /posts 진입 시 필터 버튼 그룹과 글 카드 리스트가 표시됨', async ({ page }) => {
  7  |   // Given/When — /posts 화면 진입
  8  |   await gotoScreen(page, 'B-02');
  9  |   // Then — 계약 key 관측
  10 |   await expect(ui(page, 'B-02', 'tab-filter')).toBeVisible();
  11 |   await expect(ui(page, 'B-02', 'list-posts')).toBeVisible();
  12 | });
  13 | 
  14 | test('AC-B02-02: 카테고리 필터 클릭 시 해당 카테고리 글만 노출되고 버튼이 활성 상태가 됨', async ({ page }) => {
  15 |   // Given — /posts 화면에 전체 글이 표시된 상태
  16 |   await gotoScreen(page, 'B-02');
  17 |   const filter = ui(page, 'B-02', 'tab-filter');
  18 |   await expect(filter).toBeVisible();
  19 |   // When — '트러블슈팅' 필터 버튼을 클릭
> 20 |   await filter.getByRole('button', { name: '트러블슈팅' }).click();
     |                                                       ^ TimeoutError: locator.click: Timeout 2500ms exceeded.
  21 |   // Then — 필터 버튼이 활성 상태(aria-selected 또는 data-active)로 표시됨
  22 |   const activeBtn = filter.getByRole('button', { name: '트러블슈팅' });
  23 |   const isActive = await activeBtn.evaluate(el =>
  24 |     el.getAttribute('aria-selected') === 'true' ||
  25 |     el.getAttribute('data-active') === 'true' ||
  26 |     el.classList.contains('active')
  27 |   );
  28 |   expect(isActive).toBe(true);
  29 |   // 글 목록이 여전히 존재함
  30 |   await expect(ui(page, 'B-02', 'list-posts')).toBeVisible();
  31 | });
  32 | 
  33 | test('AC-B02-03: 전체 필터 클릭 시 모든 글이 복원됨', async ({ page }) => {
  34 |   // Given — 특정 카테고리 필터가 활성인 상태
  35 |   await gotoScreen(page, 'B-02');
  36 |   const filter = ui(page, 'B-02', 'tab-filter');
  37 |   await expect(filter).toBeVisible();
  38 |   await filter.getByRole('button', { name: '트러블슈팅' }).click();
  39 |   // When — '전체' 필터 버튼을 클릭
  40 |   await filter.getByRole('button', { name: '전체' }).click();
  41 |   // Then — 글 카드 목록이 전체 복원 상태로 표시됨
  42 |   await expect(ui(page, 'B-02', 'list-posts')).toBeVisible();
  43 |   const allActive = filter.getByRole('button', { name: '전체' });
  44 |   const isActive = await allActive.evaluate(el =>
  45 |     el.getAttribute('aria-selected') === 'true' ||
  46 |     el.getAttribute('data-active') === 'true' ||
  47 |     el.classList.contains('active')
  48 |   );
  49 |   expect(isActive).toBe(true);
  50 | });
  51 | 
  52 | test('AC-B02-04: project 필드가 있는 포스트 카드에 project 배지가 표시됨', async ({ page }) => {
  53 |   // Given — /posts 화면에서 project 필드가 있는 포스트가 목록에 포함된 상태
  54 |   await gotoScreen(page, 'B-02');
  55 |   await expect(ui(page, 'B-02', 'list-posts')).toBeVisible();
  56 |   // When — 화면이 렌더링됨
  57 |   // Then — badge-project 요소가 화면에 하나 이상 존재함
  58 |   await expect(ui(page, 'B-02', 'badge-project').first()).toBeVisible();
  59 | });
  60 | 
```