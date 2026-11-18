export const meta = {
  name: 'impl-workflow',
  description: '구현 워크플로우(3/4) — ECRC: plan.contract.json 위상정렬 → 레벨별 병렬 구현(Execute, 파일 소유권 배타) → build/lint(Check, 최대 2회) → 리뷰 합의 루프(Review — worker↔code-reviewer 핑퐁, critical/major 0까지 최대 3라운드) → 락 해시 드리프트 재확인(Complete). 테스트 파일·tc.lock.json 절대 미수정. PREP 하드 게이트(RED 선행 미확인 시 에이전트 dispatch 없이 즉시 중단).',
  whenToUse: 'TC(RED) 락 + 명세 승인(Human Gate 2) 후 구현. test-workflow가 재구현(focusAcs) 시 연쇄 호출. 구현~테스트 구간은 완전 자동(Human Gate 없음).',
  phases: [
    { title: 'PREP',   detail: '하드 게이트(gate tc PASS·tc.lock·valid RED) → plan.contract 로드·위상정렬·소유권 충돌 직렬화' },
    { title: 'IMPL',   detail: 'Execute — depends_on 레벨별 병렬 구현 (파일 소유권 배타 · 디자인 토큰 준수)' },
    { title: 'BUILD',  detail: 'Check — build/lint 실패 시 진단→담당 수정→재빌드 루프(최대 2회)' },
    { title: 'REVIEW', detail: 'Review — code-reviewer 합의 루프 (critical/major 0까지, 최대 3라운드)' },
    { title: 'REPORT', detail: 'Complete — hash drift 재확인 + impl-lead 인수검수' },
  ],
};

const A = (typeof args === 'string') ? JSON.parse(args) : (args || {});
const { base, feature, focusAcs = [], focusScreens = [], hints, dryRun } = A;

const ui = (p, o) => agent(p, { agentType: 'bosu:ui_developer', ...o });
const api = (p, o) => agent(p, { agentType: 'bosu:api_developer', ...o });
const db = (p, o) => agent(p, { agentType: 'bosu:db_manager', ...o });
const lead = (p, o) => agent(p, { agentType: 'bosu:impl-lead', ...o });
const reviewer = (p, o) => agent(p, { agentType: 'bosu:code-reviewer', ...o });
const det = (p, o) => agent(p, { agentType: 'general-purpose', model: 'sonnet', ...o });
const pick = (k) => (k === 'frontend' ? ui : k === 'db' ? db : api);

const NOTEST = '★ 테스트 파일(*.spec.js)·tc.lock.json·tc.e2e.lock.json 절대 수정 금지. 구현 코드만. 계약 key마다 스택 표준 마커 부착(웹 기본 data-testid="{screen_id}-{key}", 타 스택은 프리셋 마커).';
const OWNERSHIP = '★ 파일 소유권: 이 task의 target 범위 파일만 생성·수정 — 같은 레벨에서 병렬 실행 중인 다른 task의 대상 파일 수정 금지. 공용 파일(라우팅 등록·설정·index)은 자기 항목 추가만 최소 diff.';
const TOKENS = (b) => `디자인 토큰: ${b}/_data/design/design_system.json · DESIGN_*.md 존재 시 로드해 색·타이포·간격·컴포넌트 프리셋 준수.`;

phase('PREP');
if (!base || !feature) return { accepted: false, summary: 'base·feature 필수' };

// ── 하드 게이트: 에이전트 판단 이전, 코드로 RED 선행을 강제 (ECC TDD — 우회 불가) ──
const hardGate = await det(
  `bash 순차 실행 후 결과만 반환(산출물 수정 금지):\n` +
  `1) cd ${base}/.. && python3 workflows/_tools/gate_check.py tc --feature ${feature}; echo "gate_exit=$?"\n` +
  `2) test -f ${base}/tc/tc.lock.json && echo "lock=1" || echo "lock=0"\n` +
  `3) cat ${base}/_data/manifests/red_report.json 2>/dev/null | python3 -c "import json,sys; print(json.load(sys.stdin).get('valid_red'))" || echo "None"\n` +
  `{gate_pass: gate_exit==0, lock_exists, valid_red} 반환.`,
  { label: 'prep:hard-gate', phase: 'PREP', schema: { type: 'object', required: ['gate_pass', 'lock_exists', 'valid_red'], properties: { gate_pass: { type: 'boolean' }, lock_exists: { type: 'boolean' }, valid_red: { type: 'boolean' } } } }
);
if (!hardGate.gate_pass || !hardGate.lock_exists || !hardGate.valid_red) {
  return {
    accepted: false,
    aborted: 'PREP 하드 게이트 FAIL — RED 선행 미확인, 구현 진입 거부(ECC TDD 강제). 에이전트 판단으로 우회 불가.',
    detail: hardGate,
    next: '명세 워크플로우(spec-workflow)로 valid RED 를 먼저 실측·락 등록하라.',
  };
}

// focus(재구현) 지정 시 피처 필터 대신 ac_refs 교집합으로 선별 — 전체 회귀 시 타 피처 task도 수리 대상
const hasFocus = focusAcs.length > 0 || focusScreens.length > 0;
const selectRule = hasFocus
  ? `focus 재구현 모드(focusAcs=${JSON.stringify(focusAcs)}, focusScreens=${JSON.stringify(focusScreens)}) — 피처 필터 없이 누적 계약 전체 tasks에서 ac_refs가 focusAcs와 교집합이거나 focusScreens의 SID(AC-{SID}- 접두)에 해당하는 AC를 참조하는 task만 선별. 타 피처 소속 task도 포함(전체 회귀 수리). `
  : `누적 계약이므로 tasks 중 이번 피처 소속만 선별: task.feature=="${feature}" 우선, feature 필드가 하나도 없으면(레거시 단일피처 계약) 전체 사용. `;
const prep = await lead(`[구현 진입검증] base=${base} feature=${feature}\n` +
  `plan/plan.contract.json 로드. ${selectRule}` +
  `선별 task가 0개면 stale로 ok:false 중단. ` +
  `선별된 tasks만 depends_on 위상정렬해 레벨 배열로 반환 — 각 task는 {task_id, ac_refs, kind, target, steps, success_criteria} 그대로. ` +
  `[소유권 직렬화] 같은 레벨 내 두 task의 target(구현 대상)이 겹치면 병렬 충돌 — 뒤 task를 다음 레벨로 내려 직렬화한 뒤 반환.`,
  { label: 'prep', schema: { type: 'object', required: ['ok'], properties: { ok: { type: 'boolean' }, reason: { type: 'string' }, levels: { type: 'array' } } }, phase: 'PREP' });
if (!prep.ok) return { accepted: false, summary: prep.reason || 'PREP 실패' };
if (dryRun) return { accepted: false, dryRun: true, levels: prep.levels };

phase('IMPL');
// plan.contract.schema.json: kind = frontend | backend. DB성 backend 는 target 서술로 라우팅.
const route = (t) => {
  if (t.kind === 'frontend') return ui;
  if (/db|dao|mapper|마이그레이션|migration|테이블|스키마/i.test(t.target || '')) return db;
  return api;
};
// focusScreens('A-18' 등) → SID('A18') → ac_refs 접두 매칭
const sids = focusScreens.map((s) => String(s).replace(/[^A-Za-z0-9]/g, '').toUpperCase());
const focus = (t) => {
  if (!focusAcs.length && !focusScreens.length) return true;
  const refs = t.ac_refs || [];
  if (refs.some((a) => focusAcs.includes(a))) return true;
  return refs.some((a) => sids.some((sid) => a.toUpperCase().startsWith(`AC-${sid}-`)));
};

for (const level of (prep.levels || [])) {
  const doable = (level || []).filter(focus);
  if (!doable.length) continue;
  await parallel(doable.map((t) => () => {
    const dev = route(t);
    return dev(`[구현] task=${t.task_id} kind=${t.kind} ac_refs=${JSON.stringify(t.ac_refs)}\n` +
      `target=${t.target}\nsteps=${JSON.stringify(t.steps)} success=${JSON.stringify(t.success_criteria)}\n` +
      `${t.kind === 'frontend' ? TOKENS(base) + '\n' : ''}` +
      `${hints ? 'hints: ' + hints + '\n' : ''}${OWNERSHIP}\n${NOTEST}`,
      { label: `impl:${t.task_id}`, phase: 'IMPL' });
  }));
}

phase('BUILD');
const runBuild = (label) => det(`[BUILD/LINT] 스택 빌드·린트 실행. 명령은 프리셋 주입값 우선:\n` +
  `- 환경변수 PRESET_SPEC_BUILD_UI / PRESET_SPEC_BUILD_API / PRESET_SPEC_BUILD_DB 가 있으면 그대로 실행\n` +
  `- 없으면 프로젝트 표준 감지(package.json build/lint 스크립트, pyproject 등)로 대체\n` +
  `결과 {built, errors[]} 반환. 실패 시 원인 파일 명시. 테스트 파일 수정 금지.`,
  { label, schema: { type: 'object', properties: { built: { type: 'boolean' }, errors: { type: 'array' } } }, phase: 'BUILD' });

let build = await runBuild('build');
let buildRound = 0;
while (!build.built && buildRound < 2) {
  buildRound += 1;
  const diag = await lead(`[BUILD 진단] round=${buildRound} 빌드/린트 오류: ${JSON.stringify(build.errors)}\n` +
    `오류를 담당별 최소 수정 지시로 분해 — {fixes:[{kind:"frontend"|"backend"|"db", target, instruction}]} 반환. 테스트·락 수정 금지.`,
    { label: `build:diag:${buildRound}`, schema: { type: 'object', required: ['fixes'], properties: { fixes: { type: 'array' } } }, phase: 'BUILD' });
  await parallel((diag.fixes || []).map((f) => () =>
    pick(f.kind)(`[BUILD-FIX] round=${buildRound} target=${f.target}\n${f.instruction}\n${NOTEST}`,
      { label: `build:fix:${buildRound}:${f.kind}`, phase: 'BUILD' })));
  build = await runBuild(`build:${buildRound + 1}`);
}

// ── REVIEW: worker↔reviewer 합의 루프 (ECRC의 R — 빌드 GREEN 후 논리·계약 검수) ──
phase('REVIEW');
const REVIEW_SCHEMA = {
  type: 'object', required: ['approved'],
  properties: {
    approved: { type: 'boolean', description: 'critical/major 0건이면 true' },
    findings: {
      type: 'array',
      items: {
        type: 'object', required: ['severity', 'issue'],
        properties: {
          severity: { enum: ['critical', 'major', 'minor'] },
          kind: { enum: ['frontend', 'backend', 'db'] },
          file: { type: 'string' },
          issue: { type: 'string' },
          fix: { type: 'string', description: '담당 워커에게 줄 최소 수정 지시' },
        },
      },
    },
    summary: { type: 'string' },
  },
};

let review = { approved: !build.built ? false : undefined, findings: [], summary: '' };
let reviewRound = 0;
let unresolved = [];
if (build.built) {
  while (true) {
    reviewRound += 1;
    review = await reviewer(
      `[리뷰 R${reviewRound}] base=${base} feature=${feature}\n` +
      `이번 구현 변경분(git status/diff 미커밋 워킹트리)을 plan/plan.contract.json의 선별 task(ac_refs·steps·success_criteria)와 대조 검수:\n` +
      `- critical: AC 미충족·기능 버그·보안 결함·계약 key 마커(data-testid 등) 누락\n` +
      `- major: 계약 위반 구조·성능 문제·에러 처리 누락(로딩/빈/에러 상태)\n` +
      `- minor: 스타일·네이밍 (수정 루프 대상 아님 — 기록만)\n` +
      `${reviewRound > 1 ? `직전 라운드 지적: ${JSON.stringify(unresolved)} — 해소 여부 우선 확인.\n` : ''}` +
      `산출물 수정 금지(리뷰만). 테스트 파일·락은 리뷰 대상 아님(수정 지시 금지). {approved, findings[], summary} 반환.`,
      { label: `review:${reviewRound}`, schema: REVIEW_SCHEMA, phase: 'REVIEW' }
    );
    unresolved = (review.findings || []).filter((f) => f.severity !== 'minor');
    if (review.approved && !unresolved.length) break;      // 합의(🔴 0) — Complete
    if (reviewRound >= 3) break;                            // 합의 실패 — REPORT에서 인수 판단
    log(`[REVIEW] R${reviewRound} 🔴 ${unresolved.length}건 — 담당 수정 후 재리뷰`);
    await parallel(unresolved.map((f) => () =>
      pick(f.kind || 'frontend')(
        `[REVIEW-FIX R${reviewRound}] ${f.file ? 'file=' + f.file : ''}\n문제: ${f.issue}\n수정 지시: ${f.fix || '최소 수정으로 해소'}\n${OWNERSHIP}\n${NOTEST}`,
        { label: `review:fix:${reviewRound}`, phase: 'REVIEW' })));
    build = await runBuild(`build:review:${reviewRound}`);  // 수정이 빌드를 깨지 않았는지 재확인
    if (!build.built) break;                                // 리뷰 수정이 빌드 파손 — REPORT로
  }
} else {
  log('[REVIEW] 빌드 미통과 — 리뷰 생략, REPORT로 이관');
}

phase('REPORT');
const report = await lead(`[구현 인수검수 — Complete] base=${base} feature=${feature}\n` +
  `bash: cd ${base}/.. && python3 workflows/_tools/gate_check.py tc --feature ${feature} → hash_drift>0이면 accepted=false + HUMAN GATE(테스트 변조). ` +
  `리뷰 합의 결과: rounds=${reviewRound}, approved=${!!review.approved}, 미해결 critical/major=${JSON.stringify(unresolved.map((f) => f.issue).slice(0, 5))} — 미해결 critical 존재 시 accepted:false. ` +
  `task/success_criteria 자체가 PRD AC와 모순되는 등 명세 결함이 원인이면 root_cause_level(prd|plan|null) 포함. ` +
  `{accepted, summary, built:${!!build.built}, hash_drift, failing_tasks[], root_cause_level} 반환.`,
  { label: 'lead:impl', schema: { type: 'object', required: ['accepted'], properties: { accepted: { type: 'boolean' }, summary: { type: 'string' }, hash_drift: { type: 'number' }, failing_tasks: { type: 'array' }, root_cause_level: { enum: ['prd', 'plan', null] } } }, phase: 'REPORT' });
return {
  stage: 'impl', feature, built: build.built,
  review_rounds: reviewRound, review_approved: !!review.approved,
  unresolved_findings: unresolved,
  ...report,
};
