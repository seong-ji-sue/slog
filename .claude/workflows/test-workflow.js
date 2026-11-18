export const meta = {
  name: 'test-workflow',
  description: '테스트 워크플로우(4/4): 시나리오시트 e2e=true → E2E spec 생성 → 실앱 GREEN 실측 → 실패 시 TRIAGE(test-lead가 IMPLEMENTATION_BUG/SPEC_MISMATCH/TEST_FLAKY 3분류) → BUG만 focus 재구현(impl-workflow) 루프, SPEC_MISMATCH는 즉시 중단·역행 신호, FLAKY는 재검증 1회 → 완료열 실측 갱신. 테스트 락 고정, GREEN 판정 직전 해시 재검증.',
  whenToUse: '구현 후 실앱 대상 GREEN 검증. baseUrl(구동 앱) 필요. 구현~테스트 구간은 완전 자동.',
  phases: [
    { title: 'GEN-E2E',  detail: '시트 e2e=true 중 spec 없는 것 생성 + gate e2e (0건이면 생략)' },
    { title: 'VERIFY',   detail: 'red_run real → all_green 실측' },
    { title: 'TRIAGE',   detail: 'test-lead → 실패 원인 3분류(IMPLEMENTATION_BUG/SPEC_MISMATCH/TEST_FLAKY)' },
    { title: 'FEEDBACK', detail: 'BUG 분류만 → focus 재구현 루프(테스트 고정, 변조 시 즉시 중단)' },
    { title: 'REPORT',   detail: '해시 재검증 → TC.md GREEN열·PLAN 완료열·sheet result 갱신' },
  ],
};

const A = (typeof args === 'string') ? JSON.parse(args) : (args || {});
const { base, feature, baseUrl, autoFix = true } = A;
const maxRounds = autoFix ? (A.maxRounds || 3) : 1;

const tcW = (p, o) => agent(p, { agentType: 'bosu:tc-writer', ...o });
const lead = (p, o) => agent(p, { agentType: 'bosu:test-lead', ...o });
const det = (p, o) => agent(p, { agentType: 'general-purpose', model: 'sonnet', ...o });
const VERIFY = { type: 'object', required: ['all_green'], properties: { all_green: { type: 'boolean' }, green_ratio: { type: 'string' }, failing: { type: 'array', items: { type: 'string' } } } };
const GATE = { type: 'object', required: ['pass'], properties: { pass: { type: 'boolean' }, fails: { type: 'array' } } };
const TRIAGE_SCHEMA = {
  type: 'object', required: ['items'],
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object', required: ['test', 'cause'],
        properties: {
          test: { type: 'string' },
          cause: { enum: ['IMPLEMENTATION_BUG', 'SPEC_MISMATCH', 'TEST_FLAKY'] },
          note: { type: 'string' },
        },
      },
    },
    focusAcs: { type: 'array' }, focusScreens: { type: 'array' }, hints: { type: 'string' },
    spec_mismatch: { type: 'boolean' }, root_cause_level: { enum: ['prd', 'plan', 'tc', null] },
    flaky_only: { type: 'boolean' },
  },
};

phase('GEN-E2E');
if (!base || !feature) return { accepted: false, summary: 'base·feature 필수' };
if (!baseUrl) return { accepted: false, summary: 'baseUrl(구동 앱) 필요 — 구현 후 재기동' };

const e2eCount = await det(
  `bash: cat ${base}/tc/sheet_${feature}.json 2>/dev/null | python3 -c "import json,sys; print(sum(1 for r in json.load(sys.stdin).get('rows',[]) if r.get('e2e')))" || echo 0\n` +
  `{count: number} 반환.`,
  { label: 'e2e:count', schema: { type: 'object', required: ['count'], properties: { count: { type: 'number' } } }, phase: 'GEN-E2E' }
);

if (e2eCount.count > 0) {
  await tcW(`[E2E 생성] base=${base} feature=${feature}\n` +
    `sheet_${feature}.json 의 e2e=true 행 중 tc/tests/specs/e2e/{scenario_id}.spec.js 없는 것 생성. 제목 SC-${feature}-{NNN}, require('../../helpers'), 셀렉터 ui()·진입 gotoScreen()만.`,
    { label: 'gen-e2e', phase: 'GEN-E2E' });
  let ge = await det(`bash: cd ${base}/.. && python3 workflows/_tools/gate_check.py e2e --feature ${feature}. {pass, fails[]} 반환.`, { label: 'gate:e2e', schema: GATE, phase: 'GEN-E2E' });
  if (!ge.pass) {
    await tcW(`[E2E-FIX] gate e2e 실패: ${JSON.stringify(ge.fails)}\n최소 수정. 시나리오 시트 계약 준수. 단위 spec·락 미수정.`, { label: 'e2e:fix', phase: 'GEN-E2E' });
    ge = await det(`bash: cd ${base}/.. && python3 workflows/_tools/gate_check.py e2e --feature ${feature}. {pass, fails[]} 반환.`, { label: 'gate:e2e:2', schema: GATE, phase: 'GEN-E2E' });
    if (!ge.pass) return { accepted: false, stage: 'test', stopped: 'GEN-E2E gate 재실패', fails: ge.fails };
  }
} else {
  log('[GEN-E2E] 시트 e2e 행 0건 — E2E 생성 생략, 단위+구조 spec만 검증');
}

let round = 0, flakyRetries = 0, verify, triage = null;
while (true) {
  round += 1;
  phase('VERIFY');
  verify = await det(`bash: cd ${base}/.. && workflows/_tools/red_run.sh real ${baseUrl}\n` +
    `${base}/_data/manifests/red_report_real.json 의 {all_green, green_ratio, failing[]} 반환. 실행만, 산출물 수정 금지.`,
    { label: `verify:${round}`, schema: VERIFY, phase: 'VERIFY' });
  if (verify.all_green || !autoFix || round >= maxRounds) break;

  // ── TRIAGE: 실패를 고치기 전에 원인부터 3분류 — 잘못된 재구현(무한 삽질) 차단 ──
  phase('TRIAGE');
  triage = await lead(`[TRIAGE] round=${round} failing=${JSON.stringify(verify.failing)}\n` +
    `실패 테스트 각각의 원인을 [소스코드 + prd/plan 계약 + spec 제목/단언 + 실행 로그] 근거로 3분류:\n` +
    `- IMPLEMENTATION_BUG: 계약은 옳고 구현이 계약을 미충족(마커 누락·로직 오류) → 재구현 대상\n` +
    `- SPEC_MISMATCH: 명세끼리 모순이거나 테스트가 계약과 다른 것을 검증 — 재구현으로 해결 불가. root_cause_level(prd|plan|tc) 판정\n` +
    `- TEST_FLAKY: 타이밍·환경 기인 간헐 실패(로그상 비결정적) → 재검증 대상\n` +
    `제목 분류(AC-*(단위)/STRUCT-*(구조)/SC-*(E2E))로 BUG 분류분의 focusAcs·focusScreens 추출.\n` +
    `spec_mismatch = SPEC_MISMATCH 1건 이상. flaky_only = 전 실패가 TEST_FLAKY. 테스트·락 수정 금지.\n` +
    `{items[], focusAcs[], focusScreens[], hints, spec_mismatch, root_cause_level, flaky_only} 반환.`,
    { label: `triage:${round}`, schema: TRIAGE_SCHEMA, phase: 'TRIAGE' });

  if (triage.spec_mismatch) {
    return {
      accepted: false, stage: 'test', stopped: 'TRIAGE — SPEC_MISMATCH: 명세 결함이 원인, 재구현 루프 중단(무한 삽질 차단)',
      root_cause_level: triage.root_cause_level || 'prd',
      triage: triage.items, rounds: round,
      reentry: `Main: Workflow('spec-workflow', {base, feature, startAt:'${triage.root_cause_level || 'prd'}', hints}) 로 명세 재확정 후 구현 재진입.`,
    };
  }

  if (triage.flaky_only) {
    if (flakyRetries >= 1) {
      return { accepted: false, stage: 'test', stopped: 'TRIAGE — TEST_FLAKY 반복(재검증 1회 후에도 간헐 실패) — 환경 점검 필요', triage: triage.items, rounds: round };
    }
    flakyRetries += 1;
    log('[TRIAGE] 전 실패 FLAKY 분류 — 재구현 없이 재검증 1회');
    continue;
  }

  phase('FEEDBACK');
  const implRes = await workflow('impl-workflow', { base, feature, focusAcs: triage.focusAcs || [], focusScreens: triage.focusScreens || [], hints: triage.hints });
  if (implRes && implRes.hash_drift > 0) {
    return { accepted: false, stage: 'test', stopped: 'HUMAN GATE — 재구현 중 테스트 해시 변조 감지', hash_drift: implRes.hash_drift, rounds: round };
  }
  if (implRes && implRes.root_cause_level) {
    return {
      accepted: false, stage: 'test', stopped: '재구현(impl)이 명세 결함 보고 — 재구현 루프 중단',
      root_cause_level: implRes.root_cause_level, rounds: round,
      reentry: `Main: Workflow('spec-workflow', {base, feature, startAt:'${implRes.root_cause_level}', hints}) 로 명세 재확정 후 구현 재진입.`,
    };
  }
}

phase('REPORT');
// GREEN 판정 직전 해시 락 재검증 — 테스트 변조로 만든 GREEN 차단 (하드 게이트)
const finalGate = await det(`bash: cd ${base}/.. && python3 workflows/_tools/gate_check.py tc --feature ${feature}. {pass, fails[]} 반환. 산출물 수정 금지.`,
  { label: 'gate:final', schema: GATE, phase: 'REPORT' });
if (!finalGate.pass && (finalGate.fails || []).some((f) => String(f).includes('드리프트'))) {
  return { accepted: false, stage: 'test', stopped: 'HUMAN GATE — GREEN 판정 직전 해시 드리프트 감지(테스트 변조)', fails: finalGate.fails, rounds: round };
}

const report = await lead(`[검증 인수검수] base=${base} feature=${feature} rounds=${round} all_green(실측)=${!!verify.all_green}\n` +
  `red_report_real 실측 근거로 tc/TC.md GREEN열 · plan/PLAN_${feature}.md 완료열(담당 AC 전부 GREEN인 task만 ✅) · tc/sheet_${feature}.json result(P/F) 갱신. ` +
  `수정 허용 파일은 위 3종(+xlsx 재export)뿐 — spec(*.spec.js)·tc.lock.json·tc.e2e.lock.json 수정 금지(락 드리프트=HUMAN GATE). ` +
  `bash: cd ${base}/.. && python3 workflows/_tools/gen_test_sheet.py --feature ${feature} (엑셀 재export). ` +
  `all_green=false면 accepted:true 금지. 마지막 TRIAGE 분류: ${JSON.stringify((triage && triage.items || []).slice(0, 5))}. ` +
  `rounds==${maxRounds}이고 all_green:false이며 동일 AC/화면이 매 라운드 반복 실패했으면 root_cause_level(prd|plan|tc|null) 포함. ` +
  `{accepted, all_green, green_ratio, failing[], rounds, summary, root_cause_level} 반환.`,
  { label: 'lead:test', schema: { type: 'object', required: ['accepted', 'all_green'], properties: { accepted: { type: 'boolean' }, all_green: { type: 'boolean' }, green_ratio: { type: 'string' }, failing: { type: 'array' }, rounds: { type: 'number' }, summary: { type: 'string' }, root_cause_level: { enum: ['prd', 'plan', 'tc', null] } } }, phase: 'REPORT' });
return { stage: 'test', feature, rounds: round, triage_last: triage && triage.items, ...report };
