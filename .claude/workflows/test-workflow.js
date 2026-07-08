export const meta = {
  name: 'test-workflow',
  description: '시나리오시트 e2e=true → E2E spec 생성 → 실앱 GREEN 실측 → 미통과 시 재구현(impl-workflow) 피드백 루프 → 완료열 실측 갱신. 테스트 락 고정.',
  whenToUse: '구현 후 실앱 대상 GREEN 검증. baseUrl(구동 앱) 필요.',
  phases: [
    { title: 'GEN-E2E', detail: '시트 e2e=true 중 spec 없는 것 생성 + gate e2e' },
    { title: 'VERIFY', detail: 'red_run real → all_green 실측' },
    { title: 'FEEDBACK', detail: '미통과 → focus 재구현 루프(테스트 고정)' },
    { title: 'REPORT', detail: 'TC.md GREEN열·PLAN 완료열·tasks status·sheet result 갱신' },
  ],
};

const A = (typeof args === 'string') ? JSON.parse(args) : (args || {});
const { base, feature, baseUrl, autoFix = true } = A;
const maxRounds = autoFix ? (A.maxRounds || 2) : 1;

const tcW = (p, o) => agent(p, { agentType: 'bosu:tc-writer', ...o });
const lead = (p, o) => agent(p, { agentType: 'bosu:test-lead', ...o });
const det = (p, o) => agent(p, { agentType: 'general-purpose', model: 'sonnet', ...o });
const VERIFY = { type: 'object', required: ['all_green'], properties: { all_green: { type: 'boolean' }, green_ratio: { type: 'string' }, failing: { type: 'array', items: { type: 'string' } } } };

phase('GEN-E2E');
if (!base || !feature) return { accepted: false, summary: 'base·feature 필수' };
if (!baseUrl) return { accepted: false, summary: 'baseUrl(구동 앱) 필요 — 구현 후 재기동' };

await tcW(`[E2E 생성] base=${base} feature=${feature}\n` +
  `sheet_${feature}.json 의 e2e=true 행 중 tc/tests/specs/e2e/{scenario_id}.spec.js 없는 것 생성. 제목 SC-${feature}-{NNN}, require('../../helpers'), 셀렉터 ui()·진입 gotoScreen()만.`,
  { label: 'gen-e2e', phase: 'GEN-E2E' });
let ge = await det(`bash: cd ${base}/.. && python3 workflows/_tools/gate_check.py e2e. {pass, fails[]} 반환.`, { label: 'gate:e2e', schema: { type: 'object', properties: { pass: { type: 'boolean' }, fails: { type: 'array' } } }, phase: 'GEN-E2E' });
if (!ge.pass) {
  await tcW(`[E2E-FIX] gate e2e 실패: ${JSON.stringify(ge.fails)}\n최소 수정. 시나리오 시트 계약 준수.`, { label: 'e2e:fix', phase: 'GEN-E2E' });
}

let round = 0, verify;
while (round < maxRounds) {
  round += 1;
  phase('VERIFY');
  verify = await det(`bash: cd ${base}/.. && workflows/_tools/red_run.sh real ${baseUrl}\n` +
    `red_report_real.json 의 {all_green, green_ratio, failing[]} 반환. 실행만.`,
    { label: `verify:${round}`, schema: VERIFY, phase: 'VERIFY' });
  if (verify.all_green || !autoFix) break;

  phase('FEEDBACK');
  const diag = await lead(`[실패 진단] round=${round} failing=${JSON.stringify(verify.failing)}\n` +
    `제목을 AC-*(단위)/STRUCT-*(구조)/SC-*(E2E) 분류 → focusAcs·focusScreens 추출. {focusAcs[], focusScreens[], hints} 반환. 테스트·락 수정 금지.`,
    { label: `diag:${round}`, schema: { type: 'object', properties: { focusAcs: { type: 'array' }, focusScreens: { type: 'array' }, hints: { type: 'string' } } }, phase: 'FEEDBACK' });
  await workflow('impl-workflow', { base, feature, focusAcs: diag.focusAcs || [], focusScreens: diag.focusScreens || [], hints: diag.hints });
}

phase('REPORT');
const report = await lead(`[검증 인수검수] base=${base} feature=${feature} rounds=${round}\n` +
  `red_report_real 실측 근거로 TC_${feature}.md GREEN열 · PLAN_${feature}.md 완료열(담당 AC 전부 GREEN인 task만 ✅) · tasks.json status · sheet_${feature}.json result(P/F) 갱신. ` +
  `bash: python3 workflows/_tools/gen_test_sheet.py --feature ${feature}. {accepted, all_green, green_ratio, failing[], rounds, summary} 반환.`,
  { label: 'lead:test', schema: { type: 'object', required: ['accepted', 'all_green'], properties: { accepted: { type: 'boolean' }, all_green: { type: 'boolean' }, green_ratio: { type: 'string' }, failing: { type: 'array' }, rounds: { type: 'number' }, summary: { type: 'string' } } }, phase: 'REPORT' });
return { stage: 'test', feature, rounds: round, ...report };
