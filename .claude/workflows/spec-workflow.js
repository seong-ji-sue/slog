export const meta = {
  name: 'spec-workflow',
  description: 'PRD → PLAN → TC 순차 위임 오케스트레이터 (명세 범위: TC까지). impl/test 연쇄 없음.',
  whenToUse: 'PRD·Plan·TC 명세를 도출할 때. startAt으로 특정 단계부터 실행 가능.',
  phases: [
    { title: 'DISCOVER', detail: '입력값 검증 + 계약 파일 존재 확인' },
    { title: 'PRD',      detail: 'prd-writer → prd.contract.json + PRD_{feature}.md' },
    { title: 'PLAN',     detail: 'plan-writer → plan.contract.json + PLAN_{feature}.md' },
    { title: 'TC',       detail: 'tc-writer → tests/**/*.spec.* (RED) + TC.md' },
  ],
};

// ── 입력 파싱 ──────────────────────────────────────────────────────────────────
const A = (typeof args === 'string') ? JSON.parse(args) : (args || {});
const { base, feature, brief, startAt = 'prd' } = A;

// ── 에이전트 dispatch 래퍼 ─────────────────────────────────────────────────────
// det: 결정론 실행(게이트·bash 위임 전용) — general-purpose sonnet
const det = (p, o) => agent(p, { agentType: 'general-purpose', model: 'sonnet', ...o });

// ── 게이트 스키마 ──────────────────────────────────────────────────────────────
// verdict = 루프백 목적지 내장 판정 (CONTRACT.md §7):
//   APPROVE | REVISE_THIS | REVISE_EARLIER | REVIEW_REQUIRED
const GATE_SCHEMA = {
  type: 'object',
  required: ['pass', 'verdict'],
  properties: {
    pass:    { type: 'boolean' },
    verdict: { type: 'string' },
    fails:   { type: 'array', items: { type: 'string' } },
    earlier: { type: 'array', items: { type: 'string' } },
    reviews: { type: 'array', items: { type: 'string' } },
  },
};

// ── runGate: gate_check.py 실행 → manifest 판정 반환 ──────────────────────────
async function runGate(stage) {
  return det(
    `bash 실행: cd ${base}/.. && python3 workflows/_tools/gate_check.py ${stage} --feature ${feature}\n` +
    `그 다음 ${base}/_data/manifests/${stage}.manifest.json 을 읽어 ` +
    `{pass, verdict, fails, earlier, reviews} 필드를 그대로 반환. 산출물 수정 금지.`,
    { label: `gate:${stage}`, schema: GATE_SCHEMA, phase: stage.toUpperCase() }
  );
}

// ── verdict 라우팅: 수정 루프를 돌리면 안 되는 판정 분기 ──────────────────────
function routeVerdict(stageName, g) {
  // 사람 결정 대기 — 실패 아님. 수정 에이전트를 돌리지 않고 사람에게 표면화.
  if (g.verdict === 'REVIEW_REQUIRED') {
    return {
      pass: false,
      stopped: `${stageName.toUpperCase()} REVIEW_REQUIRED — 사람 결정 필요 (실패 아님)`,
      reviews: g.reviews,
    };
  }
  // 상류 문제 — 이 단계 수정으로 못 고침. startAt으로 상류부터 재실행.
  if (g.verdict === 'REVISE_EARLIER') {
    return {
      pass: false,
      stopped: `${stageName.toUpperCase()} REVISE_EARLIER — 상류 단계 재실행 필요 (이 단계 수정 금지)`,
      earlier: g.earlier,
    };
  }
  return null; // APPROVE 또는 REVISE_THIS → 호출부에서 처리
}

// ── runStage: writer 위임 → 게이트 → verdict 라우팅 → 1회 재게이트 ────────────
async function runStage(stageName, agentType, prompt) {
  phase(stageName.toUpperCase());

  await agent(prompt, { agentType, label: stageName, phase: stageName.toUpperCase() });

  let g = await runGate(stageName);
  const routed = routeVerdict(stageName, g);
  if (routed) return routed;

  if (!g.pass) {
    log(`[${stageName}] gate ${g.verdict}: ${JSON.stringify(g.fails)} — 최소 수정 후 재게이트`);
    await agent(
      `[${stageName.toUpperCase()}-FIX] gate 실패 항목: ${JSON.stringify(g.fails)}\n` +
      `해당 산출물만 최소 수정. PRD 계약(prd.contract.json) 불변. 수정 완료 후 반환.` +
      (stageName === 'tc'
        ? '\nspec 수정이 필요하면: tc/tc.lock.json 삭제 → 수정 → red_run.sh 재실행(재-RED·재락). 락 상태 수정은 훅이 차단한다.'
        : ''),
      { agentType, label: `${stageName}:fix`, phase: stageName.toUpperCase() }
    );
    g = await runGate(stageName);
    const rerouted = routeVerdict(stageName, g);
    if (rerouted) return rerouted;
    if (!g.pass) {
      return { pass: false, stopped: `${stageName.toUpperCase()} gate FAIL`, fails: g.fails };
    }
  }
  return { pass: true };
}

// ── DISCOVER: 입력값 검증 ──────────────────────────────────────────────────────
phase('DISCOVER');
log(`spec-workflow startAt=${startAt} feature=${feature} base=${base}`);

if (!base || !feature) {
  return { error: 'base·feature 필수' };
}

const validStarts = ['prd', 'plan', 'tc'];
if (!validStarts.includes(startAt)) {
  return { error: `startAt은 'prd'|'plan'|'tc' 중 하나. 받은 값: ${startAt}` };
}

// startAt='plan' 또는 'tc' 이면 앞 단계 계약 파일 존재 전제 — det으로 확인
if (startAt === 'plan' || startAt === 'tc') {
  const checkPrd = await det(
    `bash: ls ${base}/prd/prd.contract.json 2>/dev/null && echo EXISTS || echo MISSING\n` +
    `결과를 { exists: boolean } 로 반환.`,
    {
      label: 'check:prd.contract',
      schema: { type: 'object', required: ['exists'], properties: { exists: { type: 'boolean' } } },
      phase: 'DISCOVER',
    }
  );
  if (!checkPrd.exists) {
    return { error: `startAt=${startAt} 이지만 prd/prd.contract.json 없음. PRD 단계를 먼저 실행할 것.` };
  }
}

if (startAt === 'tc') {
  const checkPlan = await det(
    `bash: ls ${base}/plan/plan.contract.json 2>/dev/null && echo EXISTS || echo MISSING\n` +
    `결과를 { exists: boolean } 로 반환.`,
    {
      label: 'check:plan.contract',
      schema: { type: 'object', required: ['exists'], properties: { exists: { type: 'boolean' } } },
      phase: 'DISCOVER',
    }
  );
  if (!checkPlan.exists) {
    return { error: `startAt=tc 이지만 plan/plan.contract.json 없음. PLAN 단계를 먼저 실행할 것.` };
  }
}

// ── PRD 단계 ──────────────────────────────────────────────────────────────────
if (startAt === 'prd') {
  const prdResult = await runStage(
    'prd',
    'bosu:prd-writer',
    `[PRD] base=${base} feature=${feature}\n` +
    `brief: ${brief || '(없음 — prd.contract.json 이미 존재하는 경우 갱신)'}\n` +
    `CONTRACT.md §1·§2 준수. 출력: prd/prd.contract.json (prd.contract.schema.json 준수) + prd/PRD_${feature}.md.\n` +
    `스택 무관. 셀렉터·파일경로·프레임워크명 금지.`
  );
  if (!prdResult.pass) return prdResult;
}

// ── PLAN 단계 ─────────────────────────────────────────────────────────────────
if (startAt === 'prd' || startAt === 'plan') {
  const planResult = await runStage(
    'plan',
    'bosu:plan-writer',
    `[PLAN] base=${base} feature=${feature}\n` +
    `prd/prd.contract.json의 acs + screens만 소비.\n` +
    `CONTRACT.md §3 준수. 출력: plan/plan.contract.json (plan.contract.schema.json 준수) + plan/PLAN_${feature}.md.\n` +
    `새 AC·식별자 창작 금지. 탈스택: 파일경로·프레임워크명·빌드명령 하드코딩 금지.`
  );
  if (!planResult.pass) return planResult;
}

// ── TC 단계 ──────────────────────────────────────────────────────────────────
const tcResult = await runStage(
  'tc',
  'bosu:tc-writer',
  `[TC] base=${base} feature=${feature}\n` +
  `prd/prd.contract.json의 acs + screens.components만 소비 (plan.contract.json 미참조 — TC portability 보장).\n` +
  `CONTRACT.md §5·§6 준수. 출력: tc/tests/{screen_id}.spec.js (코드부재 RED) + tc/TC.md + tc/tc.lock.json.\n` +
  `셀렉터=ui(key), 진입=gotoScreen(screen_id). 목업 생성 금지. valid RED 확정 후 tc.lock.json 락.`
);
if (!tcResult.pass) return tcResult;

// ── 완료 ──────────────────────────────────────────────────────────────────────
return {
  status: 'done',
  feature,
  stages_run: validStarts.slice(validStarts.indexOf(startAt)),
  artifacts: {
    prd:  startAt === 'prd'  ? [`prd/prd.contract.json`, `prd/PRD_${feature}.md`]  : '(skipped)',
    plan: startAt !== 'tc'   ? [`plan/plan.contract.json`, `plan/PLAN_${feature}.md`] : '(skipped)',
    tc:   ['tc/tests/', 'tc/TC.md', 'tc/tc.lock.json'],
  },
};
