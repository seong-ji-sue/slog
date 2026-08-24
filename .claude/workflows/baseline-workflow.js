export const meta = {
  name: 'baseline-workflow',
  description: '기존 코드 역도출 파이프라인: SCAN→FACTS(Human Gate)→PRD→PLAN→TC(빈셸 RED 락)→MARK(마커 부착)→VERIFY(실앱 GREEN 실측 루프)→REPORT. 기존 게이트·러너 재사용.',
  whenToUse: '기존 코드베이스 도입(브라운필드) 시. 신규/수정 개발은 spec-workflow.',
  phases: [
    { title: 'SCAN',   detail: 'targetDir 코드 탐색(라우트·화면·컴포넌트·불확실 지점) → CODE_SCAN_{feature}.md' },
    { title: 'FACTS',  detail: '코드에서 확인된 사실만 기록 + 불확실 지점 질문지 — Human Gate' },
    { title: 'PRD',    detail: 'prd-writer → 현행 관측 동작만 계약화(창작 금지·누적 보존) + gate prd' },
    { title: 'PLAN',   detail: 'plan-writer → 현행 구현 매핑 tasks(feature 스탬프) + gate plan' },
    { title: 'TC',     detail: 'tc-writer → 빈셸 RED 실측·tc.lock.json 락 + gate tc + xlsx 하드게이트' },
    { title: 'MARK',   detail: 'ui_developer → 기존 코드에 계약 key 마커만 부착(동작·로직 무변경)' },
    { title: 'VERIFY', detail: 'red_run real → all_green 실측, marker/contract 진단 루프' },
    { title: 'REPORT', detail: '해시 재검증 → TC.md GREEN열·sheet result 실측 갱신' },
  ],
};

// ── 입력 파싱 ──────────────────────────────────────────────────────────────────
const A = (typeof args === 'string') ? JSON.parse(args) : (args || {});
const {
  base, feature, targetDir, baseUrl, brief, startAt = 'scan',
  skipFacts = false, factsApproved = false, factsAnswers,
  hints, maxRounds = 2, mark = true,
} = A;

// ── 에이전트 dispatch 래퍼 ─────────────────────────────────────────────────────
// det: 결정론 실행(게이트·bash 위임 전용) — general-purpose sonnet
const det = (p, o) => agent(p, { agentType: 'general-purpose', model: 'sonnet', ...o });
const ui = (p, o) => agent(p, { agentType: 'bosu:ui_developer', ...o });
const lead = (p, o) => agent(p, { agentType: 'bosu:test-lead', ...o });

// ── 게이트 스키마 ──────────────────────────────────────────────────────────────
const GATE_SCHEMA = {
  type: 'object',
  required: ['pass'],
  properties: {
    pass:  { type: 'boolean' },
    fails: { type: 'array', items: { type: 'string' } },
  },
};
const VERIFY_SCHEMA = {
  type: 'object',
  required: ['all_green'],
  properties: {
    all_green: { type: 'boolean' },
    green_ratio: { type: 'string' },
    failing: { type: 'array', items: { type: 'string' } },
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
    reentry: `Workflow('baseline-workflow', {base, feature, targetDir, baseUrl, startAt:'${level}', hints}) — 브라운필드 역행은 baseline-workflow로 재진입(CONTRACT.md §8, spec/brief-workflow 아님)`,
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

// ── 입력값 검증 (meta.phases 첫 단계인 SCAN 그룹에 귀속) ──────────────────────
phase('SCAN');
log(`baseline-workflow startAt=${startAt} feature=${feature} base=${base} targetDir=${targetDir || '-'}`);

if (!base || !feature) {
  return { error: 'base·feature 필수' };
}

const ORDER = ['scan', 'facts', 'prd', 'plan', 'tc', 'mark', 'verify'];
if (!ORDER.includes(startAt)) {
  return { error: `startAt은 'scan'|'facts'|'prd'|'plan'|'tc'|'mark'|'verify' 중 하나. 받은 값: ${startAt}` };
}
// runs(s): startAt 기준으로 s 단계가 이번 실행 범위에 포함되는가
const runs = (s) => ORDER.indexOf(startAt) <= ORDER.indexOf(s);

if ((startAt === 'scan' || startAt === 'facts') && !targetDir) {
  return { error: `startAt=${startAt} 에는 targetDir(기존 코드 루트) 필수.` };
}
if ((startAt === 'mark' || startAt === 'verify') && !baseUrl) {
  return { error: `startAt=${startAt} 에는 baseUrl(구동 앱) 필수. 앱 기동 후 재호출.` };
}

// startAt 중간 진입 시 앞 단계 산출물 존재 전제 — det으로 확인
const PRECHECKS = [
  ['plan', `${base}/prd/prd.contract.json`,   'PRD 단계를 먼저 실행할 것'],
  ['tc',   `${base}/plan/plan.contract.json`, 'PLAN 단계를 먼저 실행할 것'],
  ['mark', `${base}/tc/tc.lock.json`,         'TC 단계(빈셸 RED 락)를 먼저 실행할 것'],
];
for (const [from, file, hint] of PRECHECKS) {
  if (ORDER.indexOf(startAt) < ORDER.indexOf(from)) continue;
  const chk = await det(
    `bash: ls ${file} 2>/dev/null && echo EXISTS || echo MISSING\n` +
    `결과를 { exists: boolean } 로 반환.`,
    {
      label: `check:${file.split('/').pop()}`,
      schema: { type: 'object', required: ['exists'], properties: { exists: { type: 'boolean' } } },
      phase: 'SCAN',
    }
  );
  if (!chk.exists) {
    return { error: `startAt=${startAt} 이지만 ${file.replace(`${base}/`, '')} 없음. ${hint}.` };
  }
}

const SCAN_PATH = `${base}/_data/facts/CODE_SCAN_${feature}.md`;
const FACTS_PATH = `${base}/_data/facts/FACTS_${feature}.json`;

// ── SCAN 단계: 기존 코드 탐색 → CODE_SCAN 역도출 근거 파일 ────────────────────
if (startAt === 'scan') {
  phase('SCAN');
  const scan = await agent(
    `[코드 스캔] targetDir=${targetDir} feature=${feature}\n` +
    `기존 코드 탐색 — 라우트/화면/컴포넌트의 역할·라벨·기존 data-testid·관측 가능한 동작·불확실 지점을 정리해 ${SCAN_PATH} 에 저장.\n` +
    `코드 수정 금지 — 읽기·기록만. 추측은 반드시 '불확실'로 표기.\n` +
    `{screens_found: number, uncertainties: string[]} 반환.`,
    {
      agentType: 'general-purpose', model: 'sonnet', label: 'scan', phase: 'SCAN',
      schema: {
        type: 'object', required: ['screens_found'],
        properties: { screens_found: { type: 'number' }, uncertainties: { type: 'array', items: { type: 'string' } } },
      },
    }
  );
  log(`[SCAN] screens_found=${scan.screens_found} uncertainties=${(scan.uncertainties || []).length}건`);
}

// ── FACTS 단계 (Human Gate) — spec-workflow와 동일 프로토콜, 역도출 모드 ───────
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

if (runs('prd') && !skipFacts) {
  phase('FACTS');
  let facts = await loadFacts();

  if (!facts.exists && startAt !== 'scan') {
    // 최초 생성 근거는 CODE_SCAN — SCAN 미실행 진입이면 존재 확인
    const checkScan = await det(
      `bash: ls ${SCAN_PATH} 2>/dev/null && echo EXISTS || echo MISSING\n` +
      `결과를 { exists: boolean } 로 반환.`,
      {
        label: 'check:code_scan',
        schema: { type: 'object', required: ['exists'], properties: { exists: { type: 'boolean' } } },
        phase: 'FACTS',
      }
    );
    if (!checkScan.exists) {
      return { error: `FACTS 최초 생성에는 CODE_SCAN_${feature}.md 필수. startAt:"scan"으로 먼저 실행할 것.` };
    }
  }

  if (!facts.exists) {
    await agent(
      `[FACTS 생성 — 기존 코드 역도출 모드] base=${base} feature=${feature}\n` +
      `브리프: ${SCAN_PATH} (코드 스캔 결과)${brief ? ` — 사용자 브리프 병기: ${brief}` : ''}\n` +
      `코드에서 확인된 사실만 기록 — 불확실 동작·의도는 창작하지 말고 질문으로 변환.\n` +
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
  } else if (startAt === 'facts' && hints) {
    // 역행 재작업: VERIFY/게이트 진단이 root_cause_level:'facts'로 되돌린 경우
    await agent(
      `[FACTS 재작업 — 역도출 재확인] base=${base} feature=${feature}\n재작업 힌트: ${hints}\n` +
      `${SCAN_PATH} 재로드 → FACTS_${feature}.json 갱신(답변된 질문·resolved issue 보존). 재작업으로 신규 blocking issue가 생기면 질문 추가(총 5개 이내 유지).`,
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
  }
  if (!facts.approved || !factsGate.pass) {
    return {
      stage: 'facts', feature, user_gate: 'AWAITING_USER_APPROVAL',
      facts_file: FACTS_PATH, gate: factsGate,
      overall_confidence: facts.overall_confidence,
      low_confidence_screens: (facts.screens || []).filter((s) => s.confidence < 0.70).map((s) => s.screen_ref),
      questions: facts.questions || [],
      message: 'Main: questions를 AskUserQuestion으로 실제로 물어 답변 수집 → factsAnswers + factsApproved:true, startAt:"facts"로 baseline-workflow 재호출(승인 기록 후 PRD부터 자동 진행). 질문 없이 진행하려면 skipFacts:true(비추천).',
    };
  }
}

// ── PRD 단계: 현행 관측 동작만 계약화 ─────────────────────────────────────────
if (runs('prd')) {
  const prdResult = await runStage(
    'prd',
    'bosu:prd-writer',
    `[PRD — 기존 코드 역도출] base=${base} feature=${feature}\n` +
    `근거: 코드 스캔 ${SCAN_PATH}${!skipFacts ? ` + 승인된 FACTS ${FACTS_PATH}(불확실 지점에 대한 사용자 답변 반영)` : ''}.\n` +
    `현행 코드가 실제로 하는 관측 가능한 동작만 계약화 — 희망 기능·미구현 동작 창작 금지.\n` +
    `CONTRACT.md §1·§2 준수. 출력: prd/prd.contract.json (prd.contract.schema.json 준수) + prd/PRD_${feature}.md.\n` +
    `[멀티피처 누적] prd/prd.contract.json이 이미 존재하면 타 피처의 screens/acs를 그대로 보존하고 이번 feature(${feature})의 항목만 추가·갱신. 타 피처 항목 삭제·수정 금지(gate_prd가 contract_registry.json으로 검증). 최상위 feature 필드는 이번 feature로 갱신.\n` +
    `스택 무관. 셀렉터·파일경로·프레임워크명 금지.`,
    startAt === 'prd' ? hints : undefined
  );
  if (!prdResult.pass) return prdResult;
}

// ── PLAN 단계: 현행 구현 매핑 ─────────────────────────────────────────────────
if (runs('plan')) {
  const planResult = await runStage(
    'plan',
    'bosu:plan-writer',
    `[PLAN — 현행 구현 매핑] base=${base} feature=${feature}\n` +
    `prd/prd.contract.json의 acs + screens만 소비.\n` +
    `신규 구현 계획이 아니라 기존 코드의 현행 구현을 매핑하는 tasks 작성 — 각 task에 feature 필드("${feature}") 스탬프. success_criteria는 "AC-* GREEN 유지" 형태.\n` +
    `CONTRACT.md §3 준수. 출력: plan/plan.contract.json (plan.contract.schema.json 준수) + plan/PLAN_${feature}.md.\n` +
    `새 AC·식별자 창작 금지. 탈스택: 파일경로·프레임워크명·빌드명령 하드코딩 금지.`,
    startAt === 'plan' ? hints : undefined
  );
  if (!planResult.pass) return planResult;
}

// ── TC 단계: 빈셸 RED 실측 → 락 ───────────────────────────────────────────────
if (runs('tc')) {
  const tcResult = await runStage(
    'tc',
    'bosu:tc-writer',
    `[TC] base=${base} feature=${feature}\n` +
    `prd/prd.contract.json의 acs + screens.components만 소비 (plan.contract.json 미참조 — TC portability 보장).\n` +
    `tc-spec 스킬 표준 절차 전부 수행: spec 작성 → TC.md → sheet_${feature}.json → gen_structure_spec.py → gen_test_sheet.py(xlsx) → red_run.sh 빈셸 RED 실측 → tc.lock.json 락.\n` +
    `빈 셸(shell_app) 대상 실측이므로 기존 코드가 있어도 valid RED 성립(브라운필드 무관).\n` +
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
}

// ── MARK 단계: 기존 코드에 계약 key 마커만 부착 ───────────────────────────────
if (runs('mark') && mark) {
  phase('MARK');
  await ui(
    `[MARK — 마커 부착 전용] base=${base} feature=${feature} targetDir=${targetDir || '(미지정 — 프로젝트 루트에서 대상 코드 탐색)'}\n` +
    `prd/prd.contract.json의 이번 피처(${feature}) screens[].components[].key마다 기존 코드에 스택 표준 마커만 부착 — 웹 기본 data-testid="{screen_id}-{key}", 타 스택은 프리셋 마커.\n` +
    `동작·로직·스타일 변경 금지 — 마커 속성 추가 외 어떤 코드 수정도 금지.\n` +
    `★ 테스트 파일(*.spec.js)·tc.lock.json 절대 수정 금지.`,
    { label: 'mark', phase: 'MARK' }
  );
}

// ── VERIFY 루프: 실앱 GREEN 실측 → marker/contract 진단 → 마커 재수정 ─────────
if (!baseUrl) {
  return { error: 'VERIFY에는 baseUrl(구동 앱) 필수. 앱 기동 후 startAt:"verify"로 재호출.' };
}

let round = 0, verify;
while (true) {
  round += 1;
  phase('VERIFY');
  verify = await det(
    `bash: cd ${base}/.. && workflows/_tools/red_run.sh real ${baseUrl}\n` +
    `${base}/_data/manifests/red_report_real.json 의 {all_green, green_ratio, failing[]} 반환. 실행만, 산출물 수정 금지.`,
    { label: `verify:${round}`, schema: VERIFY_SCHEMA, phase: 'VERIFY' }
  );
  if (verify.all_green || round >= maxRounds) break;

  const diag = await lead(
    `[베이스라인 실패 진단] round=${round} failing=${JSON.stringify(verify.failing)}\n` +
    `실패 원인 분류 — marker: 기존 코드 마커 미부착·오부착(계약과 현행 동작은 일치) / contract: 계약 자체가 현행 동작과 불일치(역도출 오류).\n` +
    `cause=marker면 marker_fixes[](화면/key/수정 지점), cause=contract면 root_cause_level(facts|prd|plan) 판정. 테스트·락 수정 금지.\n` +
    `{cause, marker_fixes[], root_cause_level, concerns[]} 반환.`,
    {
      label: `diag:${round}`, phase: 'VERIFY',
      schema: {
        type: 'object', required: ['cause'],
        properties: {
          cause: { enum: ['marker', 'contract'] },
          marker_fixes: { type: 'array' },
          root_cause_level: { enum: ['facts', 'prd', 'plan', null] },
          concerns: { type: 'array', items: { type: 'string' } },
        },
      },
    }
  );

  if (diag.cause === 'contract') {
    return {
      pass: false, stage: 'baseline-verify', rounds: round,
      root_cause_level: diag.root_cause_level || 'prd', concerns: diag.concerns || [],
      message: 'Main: 계약이 현행 동작과 불일치 — baseline-workflow(startAt=root_cause_level, hints=concerns 요약)로 재호출.',
    };
  }

  await ui(
    `[MARK-FIX] round=${round} marker_fixes=${JSON.stringify(diag.marker_fixes || [])}\n` +
    `지목된 화면/key의 마커만 수정·보강. 동작·로직·스타일 변경 금지.\n` +
    `★ 테스트 파일(*.spec.js)·tc.lock.json 절대 수정 금지.`,
    { label: `mark:fix:${round}`, phase: 'VERIFY' }
  );

  // 마커 수정 직후 락 해시 드리프트 감지 — 테스트 변조로 만든 GREEN 차단
  const drift = await det(
    `bash: cd ${base}/.. && python3 workflows/_tools/gate_check.py tc --feature ${feature}\n` +
    `{pass, fails[]} 반환. 산출물 수정 금지.`,
    { label: `gate:drift:${round}`, schema: GATE_SCHEMA, phase: 'VERIFY' }
  );
  if (!drift.pass && (drift.fails || []).some((f) => String(f).includes('드리프트'))) {
    return { pass: false, stage: 'baseline-verify', stopped: 'HUMAN GATE — 마커 수정 중 테스트 해시 드리프트 감지(테스트 변조)', fails: drift.fails, rounds: round };
  }
}

// ── REPORT: 해시 재검증 → 실측 갱신 → test-lead 인수 ──────────────────────────
phase('REPORT');
// GREEN 판정 직전 해시 락 재검증 — 테스트 변조로 만든 GREEN 차단 (하드 게이트)
const finalGate = await det(
  `bash: cd ${base}/.. && python3 workflows/_tools/gate_check.py tc --feature ${feature}\n` +
  `{pass, fails[]} 반환. 산출물 수정 금지.`,
  { label: 'gate:final', schema: GATE_SCHEMA, phase: 'REPORT' }
);
if (!finalGate.pass && (finalGate.fails || []).some((f) => String(f).includes('드리프트'))) {
  return { pass: false, stage: 'baseline', stopped: 'HUMAN GATE — GREEN 판정 직전 해시 드리프트 감지(테스트 변조)', fails: finalGate.fails, rounds: round };
}

const report = await lead(
  `[베이스라인 인수검수] base=${base} feature=${feature} rounds=${round} all_green(실측)=${!!verify.all_green}\n` +
  `red_report_real 실측 근거로 tc/TC.md GREEN열 · tc/sheet_${feature}.json result(P/F) 갱신. ` +
  `bash: cd ${base}/.. && python3 workflows/_tools/gen_test_sheet.py --feature ${feature} (엑셀 재export). ` +
  `all_green=false면 accepted:true 금지. rounds==${maxRounds}이고 all_green:false로 끝났으면(마지막 라운드 실패 포함) ` +
  `실패 원인이 계약/명세 결함인지 판단해 root_cause_level(facts|prd|plan|null) 포함 — Main이 §8 역행 재진입에 사용. ` +
  `{accepted, all_green, green_ratio, rounds, summary, baseline:true, root_cause_level} 반환.`,
  {
    label: 'lead:baseline', phase: 'REPORT',
    schema: {
      type: 'object', required: ['accepted', 'all_green'],
      properties: {
        accepted: { type: 'boolean' }, all_green: { type: 'boolean' }, green_ratio: { type: 'string' },
        rounds: { type: 'number' }, summary: { type: 'string' }, baseline: { type: 'boolean' },
        root_cause_level: { enum: ['facts', 'prd', 'plan', null] },
      },
    },
  }
);
return { stage: 'baseline', feature, rounds: round, ...report };
