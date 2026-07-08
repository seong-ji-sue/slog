export const meta = {
  name: 'impl-workflow',
  description: 'tasks.json 위상정렬 → 레벨별 병렬 구현 → build/lint → 락 해시 드리프트 재확인. 테스트 파일·tc.lock.json 절대 미수정.',
  whenToUse: 'TC(RED) 락 확정 후 구현. spec-workflow가 연쇄 호출하거나 재구현(focusAcs) 시.',
  phases: [
    { title: 'PREP', detail: 'tasks 로드 + 락 무결성(plan_id==feature, tc gate PASS)' },
    { title: 'IMPL', detail: 'depends_on 위상정렬 레벨별 병렬 구현' },
    { title: 'BUILD', detail: 'build/lint/pytest (스택별)' },
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

const NOTEST = '★ 테스트 파일(*.spec.js)·tc.lock.json 절대 수정 금지. 구현 코드만. 계약 key마다 data-testid="{screen_id}-{key}" 부착.';

phase('PREP');
if (!base || !feature) return { accepted: false, summary: 'base·feature 필수' };
const prep = await lead(`[구현 진입검증] base=${base} feature=${feature}\n` +
  `plan/tasks.json 로드. plan_id(feature 필드)==${feature} 확인(아니면 stale 중단). ` +
  `bash: cd ${base}/.. && python3 workflows/_tools/gate_check.py tc → APPROVE(exit 0) 아니면 진입 거부. ` +
  `validate/be-validate 제외한 task를 depends_on 위상정렬해 레벨 배열로 반환.`,
  { label: 'prep', schema: { type: 'object', required: ['ok'], properties: { ok: { type: 'boolean' }, reason: { type: 'string' }, levels: { type: 'array' } } }, phase: 'PREP' });
if (!prep.ok) return { accepted: false, summary: prep.reason || 'PREP 실패' };
if (dryRun) return { accepted: false, dryRun: true, levels: prep.levels };

phase('IMPL');
const route = (t) => {
  const ty = t.type || '';
  if (ty.startsWith('be-mapper') || ty.startsWith('be-dao')) return db;
  if (ty.startsWith('be-')) return api;
  return ui; // ui-*, ui-instrument
};
const focus = (t) =>
  (!focusAcs.length && !focusScreens.length) ||
  (t.ac_refs || []).some((a) => focusAcs.includes(a)) ||
  focusScreens.includes(t.screen_id);

for (const level of (prep.levels || [])) {
  const doable = (level || []).filter(focus);
  if (!doable.length) continue;
  await parallel(doable.map((t) => () => {
    const dev = route(t);
    return dev(`[구현] task=${t.task_id} type=${t.type} screen=${t.screen_id}\n` +
      `files=${JSON.stringify(t.files)} steps=${JSON.stringify(t.steps)} success=${JSON.stringify(t.success_criteria)}\n` +
      `${hints ? 'hints: ' + hints + '\n' : ''}${NOTEST}`,
      { label: `impl:${t.task_id}`, phase: 'IMPL' });
  }));
}

phase('BUILD');
const build = await det(`[BUILD/LINT] 스택 빌드(nextjs-fastapi 프리셋 예). bash로:\n` +
  `- UI 변경 시: (cd web/frontend && npx tsc --noEmit && npx eslint . || true)\n` +
  `- API 변경 시: (cd web/api && ruff check . && pytest -q || true)\n` +
  `- DB 변경 시: alembic 마이그레이션 무오류 확인\n` +
  `결과 {built, errors[]} 반환. 실패 시 원인 파일 명시.`,
  { label: 'build', schema: { type: 'object', properties: { built: { type: 'boolean' }, errors: { type: 'array' } } }, phase: 'BUILD' });
if (!build.built) {
  await det(`[BUILD-FIX] 빌드/린트 오류: ${JSON.stringify(build.errors)}\n담당 개발자에게 넘길 최소 수정 지점 정리(테스트 미수정).`, { label: 'build:diag', phase: 'BUILD' });
}

phase('REPORT');
const report = await lead(`[구현 인수검수] base=${base} feature=${feature}\n` +
  `bash: cd ${base}/.. && python3 workflows/_tools/gate_check.py tc → verdict=REVIEW_REQUIRED(해시 드리프트)면 accepted=false + HUMAN GATE(테스트 변조). ` +
  `{accepted, summary, built:${!!build.built}, hash_drift, failing_tasks[]} 반환.`,
  { label: 'lead:impl', schema: { type: 'object', required: ['accepted'], properties: { accepted: { type: 'boolean' }, summary: { type: 'string' }, hash_drift: { type: 'number' }, failing_tasks: { type: 'array' } } }, phase: 'REPORT' });
return { stage: 'impl', feature, built: build.built, ...report };
