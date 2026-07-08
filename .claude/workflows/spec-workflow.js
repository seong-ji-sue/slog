export const meta = {
  name: 'spec-workflow',
  description: 'FACTS(Human Gate) → PRD → PLAN → TC 순차 위임 오케스트레이터 (명세 범위: TC까지). impl/test 연쇄 없음.',
  whenToUse: 'FACTS·PRD·Plan·TC 명세를 도출할 때. startAt으로 특정 단계부터 실행 가능. 게이트 실패 시 root_cause_level로 상위 단계 복귀 신호.',
  phases: [
    { title: 'FACTS', detail: '화면별 confidence 자가평가 + 질문지 생성 — Human Gate' },
    { title: 'PRD',   detail: 'prd-writer → prd.contract.json + PRD_{feature}.md' },
    { title: 'PLAN',  detail: 'plan-writer → plan.contract.json + PLAN_{feature}.md' },
    { title: 'TC',    detail: 'tc-writer → tests/**/*.spec.* (RED) + 시나리오 시트(.xlsx) + tc.lock.json' },
  ],
};

// ── 입력 파싱 ──────────────────────────────────────────────────────────────────
const A = (typeof args === 'string') ? JSON.parse(args) : (args || {});
const {
  base, feature, brief, startAt = 'facts',
  skipFacts = false, factsApproved = false, factsAnswers,
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

// ── runGate: gate_check.py 실행 → {pass, fails} ────────────────────────────────
async function runGate(stage) {
  return det(
    `bash 실행: cd ${base}/.. && python3 workflows/_tools/gate_check.py ${stage} --feature ${feature}\n` +
    `종료코드와 stdout을 읽어 {pass: boolean, fails: string[]} 로 반환. 산출물 수정 금지.`,
    { label: `gate:${stage}`, schema: GATE_SCHEMA, phase: stage.toUpperCase() }
  );
}

// ── diagnoseAndEscalate: same-stage 재시도도 실패 시 spec-lead 진단 → 역행 신호 ─
async function diagnoseAndEscalate(stageName, fails) {
  const diag = await agent(
    `[역행 진단] stage=${stageName} fails=${JSON.stringify(fails)}\n` +
    `CONTRACT.md 추적체인(facts→prd→plan→tc) 기준 root_cause_level 판정 — 이 실패가 실제로는 더 상위 단계 산출물 문제인가?`,
    {
      agentType: 'bosu:spec-lead', label: `diag:${stageName}`, phase: stageName.toUpperCase(),
      schema: {
        type: 'object', required: ['root_cause_level'],
        properties: {
          root_cause_level: { enum: ['facts', 'prd', 'plan', 'tc', null] },
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
  };
}

// ── runStage: writer 위임 → 게이트 → 1회 재게이트 → 실패 시 역행 진단 ─────────
async function runStage(stageName, agentType, prompt, stageHints) {
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

  await det(
    `bash: cd ${base}/.. && python3 workflows/_tools/spec_retry.py reset --feature ${feature} --stage ${stageName}`,
    { label: `retry:reset:${stageName}`, phase: stageName.toUpperCase() }
  );
  return { pass: true };
}

// ── DISCOVER: 입력값 검증 ──────────────────────────────────────────────────────
phase('DISCOVER');
log(`spec-workflow startAt=${startAt} feature=${feature} base=${base}`);

if (!base || !feature) {
  return { error: 'base·feature 필수' };
}

const validStarts = ['facts', 'prd', 'plan', 'tc'];
if (!validStarts.includes(startAt)) {
  return { error: `startAt은 'facts'|'prd'|'plan'|'tc' 중 하나. 받은 값: ${startAt}` };
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

// ── FACTS 단계 (Human Gate) ───────────────────────────────────────────────────
const FACTS_PATH = `${base}/_data/facts/FACTS_${feature}.json`;

async function loadFacts() {
  return det(
    `bash: test -f ${FACTS_PATH} && cat ${FACTS_PATH} || echo '{}'\n` +
    `JSON 파싱해 {exists: boolean, approved: boolean, overall_confidence: number, questions: array, screens: array} 형태로 반환. 파일 없거나 빈 객체면 exists:false.`,
    {
      label: 'facts:load',
      schema: {
        type: 'object', required: ['exists'],
        properties: {
          exists: { type: 'boolean' }, approved: { type: 'boolean' },
          overall_confidence: { type: 'number' }, questions: { type: 'array' }, screens: { type: 'array' },
        },
      },
      phase: 'FACTS',
    }
  );
}

if ((startAt === 'facts' || startAt === 'prd') && !skipFacts) {
  phase('FACTS');
  let facts = await loadFacts();

  if (!facts.exists && !brief) {
    return { error: 'FACTS 최초 생성에는 brief 필수. brief 없이 재확인만 하려면 startAt:"facts"로 재호출.' };
  }

  if (!facts.exists) {
    await agent(
      `[FACTS 생성] base=${base} feature=${feature}\n브리프: ${brief}\n` +
      `facts-spec §1 절차 준수 → _data/facts/FACTS_${feature}.json 저장(approved:false 고정).`,
      { agentType: 'bosu:facts-writer', label: 'facts:create', phase: 'FACTS' }
    );
    facts = await loadFacts();
  } else if ((factsAnswers && factsAnswers.length) || factsApproved) {
    await agent(
      `[FACTS 갱신] factsAnswers=${JSON.stringify(factsAnswers || [])}\n` +
      `기존 FACTS_${feature}.json 로드 → answers를 questions[index].answer에 기록 → 연결된 issues resolved=true·resolution 기록 → confidence 재산정.\n` +
      `${factsApproved ? '이번 호출에서 사용자 최종 승인 — 전 질문 답변 확인 후 approved:true·approved_at 기록.' : 'approved는 미승인 유지.'}`,
      { agentType: 'bosu:facts-writer', label: 'facts:finalize', phase: 'FACTS' }
    );
    facts = await loadFacts();
  }

  let factsGate = await runGate('facts');
  if (!factsGate.pass) {
    await agent(
      `[FACTS-FIX] gate 실패 항목: ${JSON.stringify(factsGate.fails)}\n` +
      `FACTS_${feature}.json만 최소 수정(approved 조작 금지 — 미답변 질문 남기고 승인 위조 불가).`,
      { agentType: 'bosu:facts-writer', label: 'facts:fix', phase: 'FACTS' }
    );
    factsGate = await runGate('facts');
    facts = await loadFacts();
  }
  if (startAt === 'facts' || !facts.approved || !factsGate.pass) {
    return {
      stage: 'facts', feature, user_gate: 'AWAITING_USER_APPROVAL',
      facts_file: FACTS_PATH, gate: factsGate,
      overall_confidence: facts.overall_confidence,
      low_confidence_screens: (facts.screens || []).filter((s) => s.confidence < 0.70).map((s) => s.screen_ref),
      questions: facts.questions || [],
      message: 'Main: questions를 AskUserQuestion으로 실제로 물어 답변 수집 → factsAnswers + factsApproved:true 로 spec-workflow(startAt="prd") 재호출. 질문 없이 진행하려면 skipFacts:true(비추천).',
    };
  }
}

// ── PRD 단계 ──────────────────────────────────────────────────────────────────
if (startAt === 'facts' || startAt === 'prd') {
  const prdResult = await runStage(
    'prd',
    'bosu:prd-writer',
    `[PRD] base=${base} feature=${feature}\n` +
    `brief: ${brief || '(없음 — prd.contract.json 이미 존재하는 경우 갱신)'}\n` +
    `${!skipFacts ? `승인된 FACTS: ${FACTS_PATH} — 브리프의 모호점에 대한 사용자 답변 반영.\n` : ''}` +
    `CONTRACT.md §1·§2 준수. 출력: prd/prd.contract.json (prd.contract.schema.json 준수) + prd/PRD_${feature}.md.\n` +
    `스택 무관. 셀렉터·파일경로·프레임워크명 금지.`,
    startAt === 'prd' ? hints : undefined
  );
  if (!prdResult.pass) return prdResult;
}

// ── PLAN 단계 ─────────────────────────────────────────────────────────────────
if (startAt === 'facts' || startAt === 'prd' || startAt === 'plan') {
  const planResult = await runStage(
    'plan',
    'bosu:plan-writer',
    `[PLAN] base=${base} feature=${feature}\n` +
    `prd/prd.contract.json의 acs + screens만 소비.\n` +
    `CONTRACT.md §3 준수. 출력: plan/plan.contract.json (plan.contract.schema.json 준수) + plan/PLAN_${feature}.md.\n` +
    `새 AC·식별자 창작 금지. 탈스택: 파일경로·프레임워크명·빌드명령 하드코딩 금지.`,
    startAt === 'plan' ? hints : undefined
  );
  if (!planResult.pass) return planResult;
}

// ── TC 단계 ──────────────────────────────────────────────────────────────────
const tcResult = await runStage(
  'tc',
  'bosu:tc-writer',
  `[TC] base=${base} feature=${feature}\n` +
  `prd/prd.contract.json의 acs + screens.components만 소비 (plan.contract.json 미참조 — TC portability 보장).\n` +
  `CONTRACT.md §5·§6 준수. 출력: tc/tests/{screen_id}.spec.js (코드부재 RED) + tc/TC.md + tc/sheet_${feature}.json + tc/tc.lock.json.\n` +
  `셀렉터=ui(key), 진입=gotoScreen(screen_id). 목업 생성 금지. valid RED 확정 후 tc.lock.json 락.`,
  startAt === 'tc' ? hints : undefined
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
    facts: !skipFacts ? [FACTS_PATH] : '(skipped)',
    prd:  (startAt === 'facts' || startAt === 'prd') ? [`prd/prd.contract.json`, `prd/PRD_${feature}.md`]  : '(skipped)',
    plan: startAt !== 'tc'  ? [`plan/plan.contract.json`, `plan/PLAN_${feature}.md`] : '(skipped)',
    tc:   ['tc/tests/', 'tc/TC.md', `tc/sheet_${feature}.xlsx`, 'tc/tc.lock.json'],
  },
};
