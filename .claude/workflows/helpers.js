// helpers.js — TC 공용 헬퍼. 진입·셀렉터는 prd.contract.json 계약만 사용한다.
//
// 소비 계약: prd/prd.contract.json (CONTRACT.md §0 — TC portability)
//   진입:    screens[].entry 또는 app_route (프리셋 주입)
//   셀렉터:  screens[].components[].key → getByTestId("{screen_id}-{key}") (웹 기본)
//
// 스택 어댑터 (CONTRACT.md §4):
//   웹(기본): ui() → page.getByTestId("{screen_id}-{key}")
//   그 외 스택: 이 파일의 resolveLocator 만 교체하면 됨.
//
// mock 관련 로직 없음 — RED는 코드 부재 실앱 단일 실행 (CONTRACT.md §5).

'use strict';

const fs = require('fs');
const path = require('path');

// 설치 위치: .claude/specs/tc/tests/helpers.js → SPECS = .claude/specs (../..)
const SPECS = process.env.SPECS_BASE || path.resolve(__dirname, '..', '..');

// prd.contract.json 단일 로드 (TC portability — plan.contract.json 미참조)
function loadPrdContract() {
  const p = path.join(SPECS, 'prd', 'prd.contract.json');
  if (fs.existsSync(p)) {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  }
  return { screens: [], acs: [] };
}

const prdContract = loadPrdContract();

// screens 인덱스: screen_id → screen 객체
const screensIndex = {};
for (const s of prdContract.screens || []) {
  if (s.screen_id) screensIndex[s.screen_id] = s;
}

/**
 * screenOf(screenId) — 계약에서 화면 객체 반환.
 * 존재하지 않으면 에러(계약 외 screen_id 사용 = ghost).
 */
function screenOf(screenId) {
  const s = screensIndex[screenId];
  if (!s) throw new Error(`계약에 없는 screen_id: ${screenId}`);
  return s;
}

/**
 * componentOf(screenId, key) — prd.contract.json.screens[screen_id].components에서 조회.
 * 존재하지 않으면 에러(ghost 셀렉터).
 */
function componentOf(screenId, key) {
  const s = screenOf(screenId);
  const c = (s.components || []).find((x) => x.key === key);
  if (!c) throw new Error(`계약에 없는 컴포넌트: ${screenId}/${key}`);
  return c;
}

/**
 * gotoScreen(page, screenId) — 화면 진입.
 * 웹 기본: 프리셋 환경변수(PRESET_SPEC_APP_ROUTE_*) 주입, 폴백 '/{screen_id}'.
 * CONTRACT.md §4: 스택 종속 진입 경로는 프리셋이 주입한다.
 * (계약 screens[].entry는 사용자 경로 '서술'이라 라우팅에 쓰지 않는다 — 스키마에 라우트 필드 없음.)
 */
async function gotoScreen(page, screenId) {
  screenOf(screenId); // 계약에 없는 화면이면 즉시 에러 (오타 조기 검출)
  // 환경변수 우선: PRESET_SPEC_APP_ROUTE_A18 형태 (- → _ 변환)
  const envKey = 'PRESET_SPEC_APP_ROUTE_' + screenId.replace(/-/g, '_');
  const route = process.env[envKey] || ('/' + screenId);
  await page.goto(route.startsWith('/') ? route : '/' + route);
}

/**
 * resolveLocator(page, screenId, key) — 스택 어댑터.
 * 웹 기본: getByTestId("{screenId}-{key}").
 * 다른 스택은 이 함수만 교체하면 됨 (CONTRACT.md §4).
 */
function resolveLocator(page, screenId, key) {
  return page.getByTestId(`${screenId}-${key}`);
}

/**
 * ui(page, screenId, key) — TC에서 사용하는 유일한 셀렉터 진입점.
 * componentOf()로 계약 실재 검증 후 resolveLocator 위임.
 * 계약에 없는 key → 즉시 에러 (ghost FAIL).
 */
function ui(page, screenId, key) {
  componentOf(screenId, key); // 계약 실재 검증
  return resolveLocator(page, screenId, key);
}

module.exports = { gotoScreen, ui, screenOf, componentOf, resolveLocator };
