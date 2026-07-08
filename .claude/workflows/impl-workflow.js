export const meta = {
  name: 'impl-workflow',
  description: 'plan.contract.json 위상정렬 → 레벨별 병렬 구현 → build/lint → 락 해시 드리프트 재확인. 테스트 파일·tc.lock.json 절대 미수정. PREP 하드 게이트(RED 선행 미확인 시 에이전트 dispatch 없이 즉시 중단).',
  whenToUse: 'TC(RED) 락 확정 후 구현. spec 완료 후 Main이 호출하거나 test-workflow가 재구현(focusAcs) 시 연쇄 호출.',
  phases: [
    { title: 'PREP', detail: '하드 게이트(gate tc PASS·tc.lock·valid RED) → plan.contract 로드·위상정렬' },
    { title: 'IMPL', detail: 'depends_on 위상정렬 레벨별 병렬 구현' },
    { title: 'BUILD', detail: 'build/lint (프리셋 주입 명령)' },
    { title: 'REPORT', detail: 'hash drift 재확인 + impl-lead 인수검수' },
  ],
};

const A = (typeof args === 'string') ? JSON.parse(args) : (args || {});
const { base, feature, focusAcs = [], focusScreens = [], hints, dryRun } = A;

const ui = (p, o) => agent(p, { agentType: 'bosu:ui_developer', ...o });
const api = (p, o) => agent(p, { agentType: 'bosu:api_developer', ...o });
const db = (p, o) => agent(p, { agentType: 'bosu:db_manager', ...o });
const lead = (p, o) => agent(p, { agentType: 'bosu:impl-lead', ...o });
const det = (p, o) => agent(p, { agentType: 'general-purpose', model: 'sonnet', ...o });

const NOTEST = '★ 테스트 파일(*.spec.js)·tc.lock.json·tc.e2e.lock.json 절대 수정 금지. 구현 코드만. 계약 key마다 스택 표준 마커 부착(웹 기본 data-testid="{screen_id}-{key}", 타 스택은 프리셋 마커).';

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

const prep = await lead(`[구현 진입검증] base=${base} feature=${feature}\n` +
  `plan/plan.contract.json 로드. feature 필드==${feature} 확인(아니면 stale 중단). ` +
  `tasks[]를 depends_on 위상정렬해 레벨 배열로 반환 — 각 task는 {task_id, ac_refs, kind, target, steps, success_criteria} 그대로.`,
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
      `${hints ? 'hints: ' + hints + '\n' : ''}${NOTEST}`,
      { label: `impl:${t.task_id}`, phase: 'IMPL' });
  }));
}

phase('BUILD');
const build = await det(`[BUILD/LINT] 스택 빌드·린트 실행. 명령은 프리셋 주입값 우선:\n` +
  `- 환경변수 PRESET_SPEC_BUILD_UI / PRESET_SPEC_BUILD_API / PRESET_SPEC_BUILD_DB 가 있으면 그대로 실행\n` +
  `- 없으면 프로젝트 표준 감지(package.json build/lint 스크립트, pyproject 등)로 대체\n` +
  `결과 {built, errors[]} 반환. 실패 시 원인 파일 명시. 테스트 파일 수정 금지.`,
  { label: 'build', schema: { type: 'object', properties: { built: { type: 'boolean' }, errors: { type: 'array' } } }, phase: 'BUILD' });
if (!build.built) {
  await det(`[BUILD-FIX] 빌드/린트 오류: ${JSON.stringify(build.errors)}\n담당 개발자에게 넘길 최소 수정 지점 정리(테스트 미수정).`, { label: 'build:diag', phase: 'BUILD' });
}

phase('REPORT');
const report = await lead(`[구현 인수검수] base=${base} feature=${feature}\n` +
  `bash: cd ${base}/.. && python3 workflows/_tools/gate_check.py tc --feature ${feature} → hash_drift>0이면 accepted=false + HUMAN GATE(테스트 변조). ` +
  `task/success_criteria 자체가 PRD AC와 모순되는 등 명세 결함이 원인이면 root_cause_level(prd|plan|null) 포함. ` +
  `{accepted, summary, built:${!!build.built}, hash_drift, failing_tasks[], root_cause_level} 반환.`,
  { label: 'lead:impl', schema: { type: 'object', required: ['accepted'], properties: { accepted: { type: 'boolean' }, summary: { type: 'string' }, hash_drift: { type: 'number' }, failing_tasks: { type: 'array' }, root_cause_level: { enum: ['prd', 'plan', null] } } }, phase: 'REPORT' });
return { stage: 'impl', feature, built: build.built, ...report };
