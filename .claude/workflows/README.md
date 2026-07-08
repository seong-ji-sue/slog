# workflows — 명세 파이프라인 엔진 (PRD→Plan→TC, ECC TDD)

Claude Code **Workflow 툴 DSL**로 작성된 명세 워크플로우 + 게이트 툴 + 계약 스키마.

> **설치**: `setup.sh`가 이 디렉터리를 대상 프로젝트 `.claude/workflows/`로 복사한다(Workflow 툴이 `name`으로 찾고, 산출물이 프로젝트 로컬 `.claude/specs/`에 있어야 하므로). **소유는 BOSU(SSOT)** — 사본 수정 금지, BOSU에서 고쳐 재설치. 에이전트·스킬·훅은 BOSU 플러그인이 `bosu:` 프리픽스로 직접 제공.

---

## 워크플로우

| 워크플로우 | 역할 |
|-----------|------|
| `spec-workflow.js` | **명세**: PRD→PLAN→TC(RED) 순차 위임. `startAt`으로 단계 독립 실행. 코드 전무 전제 |
| `impl-workflow.js` | (후속) plan 소비 구현 → build/lint → 락 드리프트 확인. 테스트 미수정 |
| `test-workflow.js` | (후속) 실앱 GREEN 실측 → 재구현 피드백 루프 |

## 단계 구성 (spec-workflow가 순차 위임)

```
PRD  agent:bosu:prd-writer  skill:prd-spec  → prd/prd.contract.json + PRD_{f}.md
PLAN agent:bosu:plan-writer skill:plan-spec → plan/plan.contract.json + PLAN_{f}.md
TC   agent:bosu:tc-writer   skill:tc-spec   → tc/tests/*.spec.js(RED) + TC.md + tc.lock.json
```
각 단계 = [agent+skill+RULES+hook+계약] 단위. 결정론(순서·게이트)은 JS 하드코딩 — "창작=agent, 검증=코드".

## 계약 체인 (SSOT: `_schema/CONTRACT.md`)

```
prd.contract.json acs[].id → plan.contract.json tasks[].ac_refs → tc spec 테스트 제목
```
- **TC portability**: TC는 `prd.contract.json`만 소비(Plan 미참조) — 떼어 다른 PRD/Plan에 붙여도 동작.
- 스키마: `_schema/prd.contract.schema.json` · `_schema/plan.contract.schema.json`.

## 기동

```
Workflow(name:"spec-workflow", args:{
  base: "<abs>/.claude/specs", feature: "feed",
  brief: "기획서 요약/경로",
  startAt: "prd"            // "prd"|"plan"|"tc"
})
```

## 도구 (`_tools/`)

| 도구 | 역할 |
|------|------|
| `gate_check.py {prd\|plan\|tc} --feature {f}` | 산출물 재파싱 기계 게이트 (자가신고 불신). exit 0=APPROVE/1=REVISE_THIS·EARLIER/2=누락/3=REVIEW_REQUIRED — CONTRACT.md §7 |
| `red_run.sh [port]` / `red_run.sh real` | RED(코드 부재 실앱)/GREEN(구현 후 실앱) 실측. valid RED 시 `tc.lock.json` 생성 |
| `gen_structure_spec.py --feature {f}` | prd.contract → 구조 검증 spec 결정론 생성 |
| `gen_test_sheet.py --feature {f}` | AC↔TC 시트 export |
| `shell_app/` | 코드 부재 RED 대상 기본 빈 셸 |

## RED 판정 (ECC valid RED)

`valid_red = total>0 AND PASS=0 AND INFRA=0 AND OTHER_FAIL=0 AND LOGIC_ABSENT=total`.
INFRA(문법·모듈·서버)=무효. LOGIC_ABSENT(계약 key 부재)=유효 RED. **목업 모드 없음** — 실행 대상은 항상 실앱(부재 or 구현).
확정 시 spec sha256 → `tc/tc.lock.json`. 이후 spec 변조 = HUMAN GATE.

## 스택 어댑터 (유일한 스택 종속 지점)

계약(AC-ID·G/W/T·key·label)은 스택 무관. `helpers.js`가 TC 실행 시점에 해석:
- `ui(page, screen_id, key)` → 웹 기본 `getByTestId("{screen_id}-{key}")` — 타 스택은 `resolveLocator`만 교체
- `gotoScreen(page, screen_id)` → 프리셋 환경변수(`PRESET_SPEC_APP_ROUTE_{SID}`), 없으면 기본 라우트 `/{screen_id}`

## 산출물 (`.claude/specs/`)

```
prd/PRD_{feature}.md · prd.contract.json
plan/PLAN_{feature}.md · plan.contract.json
tc/TC.md · tests/{screen_id}.spec.js · tc.lock.json
_data/manifests/{stage}.manifest.json · red_report.json
```
