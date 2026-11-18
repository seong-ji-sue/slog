export const meta = {
  name: 'brief-workflow',
  description: '기획 워크플로우(1/4): 아이디어·기존 기획서 → 표준 기획서(BRIEF: OVERVIEW·CORE FACTS·ASSUMPTIONS·EARS·SCREENS·OPEN QUESTIONS) → 디자인 토큰(design_system.json 누적) → FACTS(confidence·질문지) → Human Gate 1. 승인 후 spec-workflow(PRD) 연계.',
  whenToUse: '신규 기능·제품의 기획 시작 시 — 러프한 아이디어만으로 기동 가능. FACTS 승인 없이는 spec-workflow(PRD) 진입 불가. 기존 코드 도입은 baseline-workflow.',
  phases: [
    { title: 'BRIEF',  detail: 'brief-writer → _data/brief/BRIEF_{feature}.md (선제 가정 + EARS 요구사항) + gate brief' },
    { title: 'DESIGN', detail: 'designer → _data/design/design_system.json(앱 전역 토큰, 보존·확장) + DESIGN_{feature}.md + gate design' },
    { title: 'FACTS',  detail: 'facts-writer → FACTS_{feature}.json (confidence 자가평가·질문 최대 5) — Human Gate 1' },
  ],
};

// ── 입력 파싱 ──────────────────────────────────────────────────────────────────
const A = (typeof args === 'string') ? JSON.parse(args) : (args || {});
const {
  base, feature, idea, brief, startAt = 'brief',
  skipDesign = false, factsApproved = false, factsAnswers,
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

// ── failStage: 재게이트도 실패 — brief는 파이프라인 최상류라 역행 없음, 카운터만 ──
async function failStage(stageName, fails) {
  const rc = await det(
    `bash: cd ${base}/.. && python3 workflows/_tools/spec_retry.py bump --feature ${feature} --stage ${stageName}`,
    { label: `retry:${stageName}`, schema: { type: 'object', properties: { count: { type: 'number' } } }, phase: stageName.toUpperCase() }
  );
  return {
    pass: false, stopped: `${stageName.toUpperCase()} gate FAIL (재게이트 실패)`, stage: stageName, fails,
    human_gate_required: (rc.count || 0) >= 3,
    message: '기획 단계 재작업은 brief-workflow 재호출(hints로 재작업 지시). 반복 실패 원인은 대부분 입력(아이디어·기획 자료) 부족 — 사용자 보강 권장.',
  };
}

// ── runStage: writer 위임 → 게이트 → 1회 재게이트 → 실패 시 중단 신호 ──────────
async function runStage(stageName, agentType, prompt, stageHints) {
  phase(stageName.toUpperCase());

  await agent(stageHints ? `${prompt}\n[재작업 힌트] ${stageHints}` : prompt, { agentType, label: stageName, phase: stageName.toUpperCase() });

  let g = await runGate(stageName);
  if (!g.pass) {
    log(`[${stageName}] gate FAIL: ${JSON.stringify(g.fails)} — 최소 수정 후 재게이트`);
    await agent(
      `[${stageName.toUpperCase()}-FIX] gate 실패 항목: ${JSON.stringify(g.fails)}\n` +
      `해당 산출물만 최소 수정. 수정 완료 후 반환.`,
      { agentType, label: `${stageName}:fix`, phase: stageName.toUpperCase() }
    );
    g = await runGate(stageName);
    if (!g.pass) return failStage(stageName, g.fails);
  }

  await det(
    `bash: cd ${base}/.. && python3 workflows/_tools/spec_retry.py reset --feature ${feature} --stage ${stageName}`,
    { label: `retry:reset:${stageName}`, phase: stageName.toUpperCase() }
  );
  return { pass: true };
}

// ── DISCOVER: 입력값 검증 ──────────────────────────────────────────────────────
phase('BRIEF');
log(`brief-workflow startAt=${startAt} feature=${feature} base=${base}`);

if (!base || !feature) {
  return { error: 'base·feature 필수' };
}

const validStarts = ['brief', 'design', 'facts'];
if (!validStarts.includes(startAt)) {
  return { error: `startAt은 'brief'|'design'|'facts' 중 하나. 받은 값: ${startAt}` };
}

const BRIEF_PATH = `${base}/_data/brief/BRIEF_${feature}.md`;
const DESIGN_SYS = `${base}/_data/design/design_system.json`;
const DESIGN_DOC = `${base}/_data/design/DESIGN_${feature}.md`;
const FACTS_PATH = `${base}/_data/facts/FACTS_${feature}.json`;

// startAt이 design/facts면 표준 기획서 선행 전제 — det으로 확인
if (startAt !== 'brief') {
  const checkBrief = await det(
    `bash: ls ${BRIEF_PATH} 2>/dev/null && echo EXISTS || echo MISSING\n` +
    `결과를 { exists: boolean } 로 반환.`,
    {
      label: 'check:brief',
      schema: { type: 'object', required: ['exists'], properties: { exists: { type: 'boolean' } } },
      phase: 'BRIEF',
    }
  );
  if (!checkBrief.exists) {
    return { error: `startAt=${startAt} 이지만 표준 기획서(${BRIEF_PATH}) 없음. BRIEF 단계를 먼저 실행할 것.` };
  }
}

// ── BRIEF 단계: 아이디어/기존 자료 → 표준 기획서 ──────────────────────────────
if (startAt === 'brief') {
  const briefExists = await det(
    `bash: ls ${BRIEF_PATH} 2>/dev/null && echo EXISTS || echo MISSING\n결과를 { exists: boolean } 로 반환.`,
    { label: 'brief:exists', schema: { type: 'object', required: ['exists'], properties: { exists: { type: 'boolean' } } }, phase: 'BRIEF' }
  );
  if (!briefExists.exists && !idea && !brief) {
    return { error: '표준 기획서 최초 생성에는 idea(러프 아이디어) 또는 brief(기존 기획 자료 경로/텍스트) 중 하나 필수.' };
  }

  const briefResult = await runStage(
    'brief',
    'bosu:brief-writer',
    `[기획서 작성] base=${base} feature=${feature}\n` +
    `${idea ? `아이디어(러프): ${idea}\n` : ''}` +
    `${brief ? `기존 기획 자료: ${brief} — 로드해 표준 형식으로 정형화(내용 창작 금지, 재배치·정형화만)\n` : ''}` +
    `${briefExists.exists ? `기존 ${BRIEF_PATH} 존재 — 갱신 모드(기존 [F-xx]/[A-xx]/[REQ-xx]/[S-xx] ID 보존, 추가·수정만)\n` : ''}` +
    `brief-spec 스킬(BRIEF_SCHEMA.md 규격) 준수 → ${BRIEF_PATH} 저장.\n` +
    `Proactive Anchoring: 정보가 부족한 지점은 되묻지 말고 §2 ASSUMPTIONS에 [A-xx] 선제 가정으로 채운다. ` +
    `제품 방향을 가르는 결정만 §5 OPEN QUESTIONS 후보(최대 5개)로 남긴다.\n` +
    `§3 EARS REQUIREMENTS: [REQ-xx] "When/Given <조건·트리거> → Then <시스템 행동>" 정형 문장만. ` +
    `모호한 형용사(빠르게·직관적으로) 금지 — 계량 가능 표현으로. 스택·프레임워크·코드·파일경로 금지.`,
    hints
  );
  if (!briefResult.pass) return briefResult;
}

// ── DESIGN 단계: 디자인 토큰 + 피처 디자인 가이드 ─────────────────────────────
if ((startAt === 'brief' || startAt === 'design') && !skipDesign) {
  const designResult = await runStage(
    'design',
    'bosu:designer',
    `[디자인 토큰] base=${base} feature=${feature}\n` +
    `입력: ${BRIEF_PATH} (§0 OVERVIEW 제품 성격·§4 SCREENS 화면 후보).\n` +
    `출력 1: ${DESIGN_SYS} — 앱 전역 디자인 토큰(colors·typography·spacing·radius·components 프리셋). ` +
    `이미 존재하면 기존 토큰 보존·확장(전면 교체 금지 — 교체는 hints로 명시된 경우만).\n` +
    `출력 2: ${DESIGN_DOC} — 이번 피처 화면별 레이아웃 구조·상태(로딩/빈/에러)·사용자 흐름 가이드.\n` +
    `DESIGN_SCHEMA.md 규격 준수. 외부 디자인 도구 의존 금지 — 코드 기반 토큰만. ` +
    `구현 코드·컴포넌트 파일 생성 금지(토큰 JSON·가이드 md만).`,
    startAt === 'design' ? hints : undefined
  );
  if (!designResult.pass) return designResult;
}

// ── FACTS 단계 (Human Gate 1) ─────────────────────────────────────────────────
phase('FACTS');

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

let facts = await loadFacts();

if (!facts.exists) {
  await agent(
    `[FACTS 생성] base=${base} feature=${feature}\n` +
    `브리프: ${BRIEF_PATH} — 표준 기획서를 반드시 로드해 화면 단위로 분해.\n` +
    `facts-spec §1 절차 준수 → ${FACTS_PATH} 저장(approved:false 고정). source_brief에 "${BRIEF_PATH}" 기록.\n` +
    `질문 합성: §5 OPEN QUESTIONS 후보를 출발점으로, blocking issue 최우선. ` +
    `질문은 최대 5개(사용자 피로 한계) — 초과분은 질문을 병합하거나 §2 ASSUMPTIONS 확인형("이의 없으면 가정대로") 선택지로 전환. ` +
    `전 질문 객관식(options 2~4개, 각 옵션에 추천 이유 description).`,
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
} else if (startAt === 'facts' && hints) {
  await agent(
    `[FACTS 재작업] base=${base} feature=${feature}\n재작업 힌트: ${hints}\n` +
    `${BRIEF_PATH} 재로드 → FACTS_${feature}.json 갱신(답변된 질문·resolved issue 보존). 재작업으로 신규 blocking issue가 생기면 질문 추가(총 5개 이내 유지).`,
    { agentType: 'bosu:facts-writer', label: 'facts:rework', phase: 'FACTS' }
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
  if (!factsGate.pass) return failStage('facts', factsGate.fails);
}

if (!facts.approved) {
  return {
    stage: 'facts', feature, user_gate: 'AWAITING_USER_APPROVAL',
    brief_file: BRIEF_PATH,
    design_files: skipDesign ? '(skipped)' : [DESIGN_SYS, DESIGN_DOC],
    facts_file: FACTS_PATH, gate: factsGate,
    overall_confidence: facts.overall_confidence,
    low_confidence_screens: (facts.screens || []).filter((s) => s.confidence < 0.70).map((s) => s.screen_ref),
    questions: facts.questions || [],
    message: 'Human Gate 1: Main은 questions를 AskUserQuestion으로 실제로 물어 답변 수집 → brief-workflow({base, feature, factsAnswers, factsApproved:true, startAt:"facts"}) 재호출. 승인 완료 후 spec-workflow(startAt:"prd")로 명세 진행.',
  };
}

// ── 완료: 기획 확정 — 명세(spec-workflow) 진입 조건 충족 ──────────────────────
return {
  status: 'done',
  stage: 'brief-pipeline', feature,
  approved: true,
  overall_confidence: facts.overall_confidence,
  artifacts: {
    brief: BRIEF_PATH,
    design: skipDesign ? '(skipped)' : [DESIGN_SYS, DESIGN_DOC],
    facts: FACTS_PATH,
  },
  next: `Workflow('spec-workflow', {base:'${base}', feature:'${feature}', startAt:'prd'}) — 명세(PRD→PLAN→TC RED) 진행.`,
};
