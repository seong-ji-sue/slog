export const meta = {
  name: 'spec-workflow',
  description: '명세 워크플로우(2/4): PRD → PLAN → TC(RED 락) 순차 위임. 진입 조건 = brief-workflow의 승인된 FACTS(Human Gate 1). 각 단계 = 기계 게이트(gate_check.py) + LLM judge(spec-lead 의미검수) 하이브리드. prd/plan 계약은 앱 전체 누적 명세 — 타 피처 항목 보존.',
  whenToUse: 'FACTS 승인(brief-workflow) 후 PRD·Plan·TC 명세를 도출할 때. startAt으로 특정 단계부터 실행 가능. 게이트 재실패 시 root_cause_level로 상위 단계 복귀 신호. 멀티피처는 피처별로 재호출(계약 파일에 누적).',
  phases: [
    { title: 'PRD',  detail: 'prd-writer → prd.contract.json + PRD_{feature}.md + gate prd + judge(spec-lead)' },
    { title: 'PLAN', detail: 'plan-writer → plan.contract.json + PLAN_{feature}.md + gate plan + judge(spec-lead)' },
    { title: 'TC',   detail: 'tc-writer → tests/**/*.spec.* (RED 실측·락) + 시나리오 시트(.xlsx) — 검증은 RED 실측이 담당' },
  ],
};

// ── 입력 파싱 ──────────────────────────────────────────────────────────────────
const A = (typeof args === 'string') ? JSON.parse(args) : (args || {});
const {
  base, feature, brief, startAt = 'prd',
  skipFacts = false,
  hints,
} = A;

// ── 에이전트 dispatch 래퍼 ─────────────────────────────────────────────────────
// det: 결정론 실행(게이트·bash 위임 전용) — general-purpose sonnet
const det = (p, o) => agent(p, { agentType: 'general-purpose', model: 'sonnet', ...o });

// ── 게이트 스키마 ──────────────────────────────────────────────────────────────
const GATE_SCHEMA = {
  type: 'object',
  required: ['pass'],
  properties: {
    pass:  { type: 'boolean' },
    fails: { type: 'array', items: { type: 'string' } },
  },
};
const JUDGE_SCHEMA = {
  type: 'object',
  required: ['approve'],
  properties: {
    approve:  { type: 'boolean' },
    concerns: { type: 'array', items: { type: 'string' } },
    summary:  { type: 'string' },
  },
};

// ── runGate: gate_check.py 실행 → {pass, fails} ────────────────────────────────
async function runGate(stage) {
  return det(
    `bash 실행: cd ${base}/.. && python3 workflows/_tools/gate_check.py ${stage} --feature ${feature}\n` +
    `종료코드와 stdout을 읽어 {pass: boolean, fails: string[]} 로 반환. 산출물 수정 금지.`,
    { label: `gate:${stage}`, schema: GATE_SCHEMA, phase: stage.toUpperCase() }
  );
}

// ── runJudge: 기계 게이트 PASS 후 spec-lead 의미검수 (하이브리드 2차 게이트) ───
// 기계가 형태를, LLM이 내용을 심사한다. 기계 게이트 PASS를 역전할 수 없고(형태 재검증 금지),
// 상류 산출물(BRIEF·FACTS) 대비 의미 누락·모순만 지적한다.
async function runJudge(stageName) {
  return agent(
    `[JUDGE:${stageName}] base=${base} feature=${feature}\n` +
    `기계 게이트(gate ${stageName})는 PASS — 형태는 끝났다. 너는 내용만 심사한다:\n` +
    `- 상류 대조: ${base}/_data/brief/BRIEF_${feature}.md(§3 EARS 전수)·승인된 FACTS(${base}/_data/facts/FACTS_${feature}.json 답변) 대비 이번 산출물에 의미 누락(요구사항·엣지케이스·상태(로딩/빈/에러)·화면)이 있는가?\n` +
    `- 내부 모순: ${stageName === 'prd' ? 'acs G/W/T가 관측 불가하거나 상호 모순인 것' : 'tasks가 AC를 형식상 커버하지만 steps/success_criteria가 AC 취지와 어긋나는 것'}이 있는가?\n` +
    `산출물 수정 금지·기계 게이트 재수행 금지. {approve, concerns[](구체 지적), summary} 반환. 사소한 표현 문제로 reject 금지 — 누락·모순만.`,
    { agentType: 'bosu:spec-lead', label: `judge:${stageName}`, schema: JUDGE_SCHEMA, phase: stageName.toUpperCase() }
  );
}

// ── diagnoseAndEscalate: same-stage 재시도도 실패 시 spec-lead 진단 → 역행 신호 ─
async function diagnoseAndEscalate(stageName, fails) {
  const diag = await agent(
    `[역행 진단] stage=${stageName} fails=${JSON.stringify(fails)}\n` +
    `CONTRACT.md 추적체인(brief→facts→prd→plan→tc) 기준 root_cause_level 판정 — 이 실패가 실제로는 더 상위 단계 산출물 문제인가?\n` +
    `brief·facts는 기획 워크플로우(brief-workflow) 소관 — 그 레벨이면 Main이 brief-workflow를 재기동해야 한다.`,
    {
      agentType: 'bosu:spec-lead', label: `diag:${stageName}`, phase: stageName.toUpperCase(),
      schema: {
        type: 'object', required: ['root_cause_level'],
        properties: {
          root_cause_level: { enum: ['brief', 'facts', 'prd', 'plan', 'tc', null] },
          concerns: { type: 'array', items: { type: 'string' } },
          summary: { type: 'string' },
        },
      },
    }
  );

  const level = diag.root_cause_level || stageName;
  const rc = await det(
    `bash: cd ${base}/.. && python3 workflows/_tools/spec_retry.py bump --feature ${feature} --stage ${level}`,
    { label: `retry:${stageName}`, schema: { type: 'object', properties: { count: { type: 'number' } } }, phase: stageName.toUpperCase() }
  );

  return {
    pass: false, stopped: `${stageName.toUpperCase()} gate FAIL (재게이트 실패)`, stage: stageName, fails,
    root_cause_level: level, concerns: diag.concerns || [], diag_summary: diag.summary || '',
    human_gate_required: (rc.count || 0) >= 3,
    reentry: (level === 'brief' || level === 'facts')
      ? `Workflow('brief-workflow', {base, feature, startAt:'${level}', hints})`
      : `Workflow('spec-workflow', {base, feature, startAt:'${level}', hints})`,
  };
}

// ── runStage: writer 위임 → 기계 게이트 → judge → 각 1회 재시도 → 실패 시 역행 ─
async function runStage(stageName, agentType, prompt, stageHints, useJudge) {
  phase(stageName.toUpperCase());

  await agent(stageHints ? `${prompt}\n[상위 단계 재작업 힌트] ${stageHints}` : prompt, { agentType, label: stageName, phase: stageName.toUpperCase() });

  let g = await runGate(stageName);
  if (!g.pass) {
    log(`[${stageName}] gate FAIL: ${JSON.stringify(g.fails)} — 최소 수정 후 재게이트`);
    await agent(
      `[${stageName.toUpperCase()}-FIX] gate 실패 항목: ${JSON.stringify(g.fails)}\n` +
      `해당 산출물만 최소 수정. 앞선 단계 계약 불변. 수정 완료 후 반환.`,
      { agentType, label: `${stageName}:fix`, phase: stageName.toUpperCase() }
    );
    g = await runGate(stageName);
    if (!g.pass) return diagnoseAndEscalate(stageName, g.fails);
  }

  // LLM judge 의미검수 — 기계 PASS 후에만. reject 시 1회 보완 → 재게이트+재심사 → 그래도 reject면 역행 진단
  if (useJudge) {
    let j = await runJudge(stageName);
    if (!j.approve) {
      log(`[${stageName}] judge REJECT: ${JSON.stringify(j.concerns)} — 보완 후 재심사`);
      await agent(
        `[${stageName.toUpperCase()}-JUDGE-FIX] 의미검수 지적: ${JSON.stringify(j.concerns)}\n` +
        `지적된 누락·모순만 보완(최소 수정). 앞선 단계 계약 불변. 타 피처 항목 보존.`,
        { agentType, label: `${stageName}:judge-fix`, phase: stageName.toUpperCase() }
      );
      g = await runGate(stageName);
      if (!g.pass) return diagnoseAndEscalate(stageName, g.fails);
      j = await runJudge(stageName);
      if (!j.approve) return diagnoseAndEscalate(stageName, j.concerns || ['judge 재심사 reject']);
    }
  }

  await det(
    `bash: cd ${base}/.. && python3 workflows/_tools/spec_retry.py reset --feature ${feature} --stage ${stageName}`,
    { label: `retry:reset:${stageName}`, phase: stageName.toUpperCase() }
  );
  return { pass: true };
}

// ── DISCOVER: 입력값 검증 ──────────────────────────────────────────────────────
phase('PRD');
log(`spec-workflow startAt=${startAt} feature=${feature} base=${base}`);

if (!base || !feature) {
  return { error: 'base·feature 필수' };
}

const validStarts = ['prd', 'plan', 'tc'];
if (!validStarts.includes(startAt)) {
  return { error: `startAt은 'prd'|'plan'|'tc' 중 하나 (FACTS는 brief-workflow 소관). 받은 값: ${startAt}` };
}

const FACTS_PATH = `${base}/_data/facts/FACTS_${feature}.json`;
const BRIEF_PATH = `${base}/_data/brief/BRIEF_${feature}.md`;

// PRD 진입 하드 게이트: 승인된 FACTS(Human Gate 1) 없이는 명세 시작 불가
if (startAt === 'prd' && !skipFacts) {
  const factsCheck = await det(
    `bash: test -f ${FACTS_PATH} && cat ${FACTS_PATH} || echo '{}'\n` +
    `JSON 파싱해 {exists: boolean, approved: boolean} 반환 (approved 필드 그대로 — 판단 금지).`,
    {
      label: 'check:facts-approved',
      schema: { type: 'object', required: ['exists'], properties: { exists: { type: 'boolean' }, approved: { type: 'boolean' } } },
      phase: 'PRD',
    }
  );
  if (!factsCheck.exists || !factsCheck.approved) {
    return {
      error: `승인된 FACTS 없음(exists=${!!factsCheck.exists}, approved=${!!factsCheck.approved}) — 기획 워크플로우 먼저.`,
      next: `Workflow('brief-workflow', {base:'${base}', feature:'${feature}', idea|brief 입력}) → Human Gate 1 승인 후 spec-workflow 재호출.`,
    };
  }
}

// startAt='plan' 또는 'tc' 이면 앞 단계 계약 파일 존재 전제 — det으로 확인
if (startAt === 'plan' || startAt === 'tc') {
  const checkPrd = await det(
    `bash: ls ${base}/prd/prd.contract.json 2>/dev/null && echo EXISTS || echo MISSING\n` +
    `결과를 { exists: boolean } 로 반환.`,
    {
      label: 'check:prd.contract',
      schema: { type: 'object', required: ['exists'], properties: { exists: { type: 'boolean' } } },
      phase: 'PRD',
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
      phase: 'PRD',
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
    `brief: ${brief || `(미전달 — 표준 기획서 ${BRIEF_PATH} 로드. 없으면 승인된 FACTS(${FACTS_PATH})의 source_brief에 보존된 원문 위치를 로드해 요구사항 전수로 사용. 둘 다 없으면 기존 prd.contract.json 갱신 모드로만 진행)`}\n` +
    `${!skipFacts ? `승인된 FACTS: ${FACTS_PATH} — 모호점에 대한 사용자 답변 반영. BRIEF §3 EARS([REQ-xx])는 요구사항 전수 — 전 REQ가 acs로 계약화됐는지 스스로 확인.\n` : ''}` +
    `CONTRACT.md §1·§2 준수. 출력: prd/prd.contract.json (prd.contract.schema.json 준수) + prd/PRD_${feature}.md.\n` +
    `[멀티피처 누적] prd/prd.contract.json이 이미 존재하면 타 피처의 screens/acs를 그대로 보존하고 이번 feature(${feature})의 항목만 추가·갱신. 타 피처 항목 삭제·수정 금지(gate_prd가 contract_registry.json으로 검증). 최상위 feature 필드는 이번 feature로 갱신.\n` +
    `스택 무관. 셀렉터·파일경로·프레임워크명 금지.`,
    hints,
    true // judge: BRIEF·FACTS 대비 의미 누락 심사
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
    `[멀티피처 누적] plan.contract.json의 타 피처 tasks 그대로 보존(삭제·수정 금지). 이번 피처의 각 task에 feature: "${feature}" 필드를 반드시 스탬프.\n` +
    `[병렬 소유권] 같은 depends_on 레벨에서 병렬 실행될 tasks의 target(구현 대상 서술)이 서로 겹치지 않게 분해 — 동일 대상을 두 task가 수정하지 않도록. 겹침이 불가피하면 depends_on으로 직렬화.\n` +
    `새 AC·식별자 창작 금지. 탈스택: 파일경로·프레임워크명·빌드명령 하드코딩 금지.`,
    startAt === 'plan' ? hints : undefined,
    true // judge: AC 취지 대비 tasks 의미 정합 심사
  );
  if (!planResult.pass) return planResult;
}

// ── TC 단계 (judge 없음 — RED 실측 + 락이 검증을 담당) ───────────────────────
const tcResult = await runStage(
  'tc',
  'bosu:tc-writer',
  `[TC] base=${base} feature=${feature}\n` +
  `prd/prd.contract.json의 acs + screens.components만 소비 (plan.contract.json 미참조 — TC portability 보장).\n` +
  `CONTRACT.md §5·§6 준수. 출력: tc/tests/{screen_id}.spec.js (코드부재 RED) + tc/TC.md + tc/sheet_${feature}.json + tc/tc.lock.json.\n` +
  `[멀티피처 누적] tc/tests/의 타 피처 spec 파일 삭제·수정 금지 — 이번 피처 화면의 spec만 생성/갱신. RED 실측(red_run.sh)은 전체 스위트 대상 — 빈 셸 실행이므로 타 피처 spec 포함 전건 LOGIC_ABSENT 성립.\n` +
  `셀렉터=ui(key), 진입=gotoScreen(screen_id). 목업 생성 금지. valid RED 확정 후 tc.lock.json 락.`,
  startAt === 'tc' ? hints : undefined,
  false
);
if (!tcResult.pass) return tcResult;

// ── TC 시나리오 시트 엑셀 export (하드 게이트 — 실제 .xlsx 없이 TC 완료 아님) ──
phase('TC');
const sheetExport = await det(
  `bash: cd ${base}/.. && python3 workflows/_tools/gen_test_sheet.py --feature ${feature}\n` +
  `성공 시 {ok:true, xlsx, rows, e2e} 반환. openpyxl 미설치 등 실패 시 {ok:false, error}(설치 안내 문구 인용) 반환.`,
  {
    label: 'sheet:export', phase: 'TC',
    schema: {
      type: 'object', required: ['ok'],
      properties: { ok: { type: 'boolean' }, xlsx: { type: 'string' }, rows: { type: 'number' }, e2e: { type: 'number' }, error: { type: 'string' } },
    },
  }
);
if (!sheetExport.ok) {
  return { pass: false, stopped: 'TC 시나리오 시트(.xlsx) 산출 실패', stage: 'tc', error: sheetExport.error };
}

// ── 완료 ──────────────────────────────────────────────────────────────────────
return {
  status: 'done',
  feature,
  stages_run: validStarts.slice(validStarts.indexOf(startAt)),
  artifacts: {
    prd:  startAt === 'prd' ? [`prd/prd.contract.json`, `prd/PRD_${feature}.md`]  : '(skipped)',
    plan: startAt !== 'tc'  ? [`plan/plan.contract.json`, `plan/PLAN_${feature}.md`] : '(skipped)',
    tc:   ['tc/tests/', 'tc/TC.md', `tc/sheet_${feature}.xlsx`, 'tc/tc.lock.json'],
  },
  user_gate: 'AWAITING_SPEC_APPROVAL',
  message: 'Human Gate 2: Main은 계약(prd/plan)과 RED 락 요약을 사용자에게 보고하고 승인을 받은 뒤에만 impl-workflow로 진행한다. 승인 후 구현~테스트는 완전 자동 구간.',
  next: `Workflow('impl-workflow', {base:'${base}', feature:'${feature}'}) — 구현(ECRC) 진행.`,
};
