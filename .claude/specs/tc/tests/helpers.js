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
//
// [실측 TRIAGE 재작업] 라우트 폴백('/{screen_id}')이 실제 앱 라우트와 어긋나
// SPEC_MISMATCH가 발생함(test-workflow 실측). 아래를 추가:
//   - ROUTE_DEFAULTS: 계약 screen_id → 실제 앱 라우트(동적 :id/{id} 세그먼트 포함) 폴백 맵.
//     PRESET_SPEC_APP_ROUTE_* 환경변수가 최우선이며, 이 맵은 그 다음 폴백일 뿐이다.
//   - gotoScreen(page, screenId, params) — params.id로 동적 세그먼트 치환.
//   - screenRoutePattern(screenId) — toHaveURL 단언에 쓸 정규식(하드코딩 '/H-02' 금지).
//   - expectActive(locator) — 클릭 직후 active 상태 단언의 레이스 컨디션 제거
//     (고정 시간 대기(wait-timeout류) API 대신 expect().toPass() 폴링 재시도 사용).
//   - throttleNextRequest(page, urlPattern, delayMs) — 로딩 스켈레톤 등 전환 상태를
//     안정적으로 관측하기 위해 실제 네트워크 응답 자체를 지연시킴(목업 아님 — 실제 API
//     응답을 그대로 반환하되 타이밍만 지연. 고정 시간 대기(wait-timeout류) API 미사용).

'use strict';

const fs = require('fs');
const path = require('path');
const { expect } = require('@playwright/test');

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

// 화면별 실제 앱 라우트 폴백(계약에 라우트 필드가 없어 이 파일이 유일한 소스).
// PRESET_SPEC_APP_ROUTE_{screen_id의 '-'→'_'} 환경변수가 있으면 그것이 always 우선.
// 동적 세그먼트는 '{id}' 또는 ':id' 토큰으로 표기 — fillRoute()가 params.id로 치환.
const ROUTE_DEFAULTS = {
  'B-01': '/',
  'B-02': '/posts',
  'B-03': '/posts/{id}',
  'B-05': '/about',
  'B-06': '/tags',
  'B-07': '/tags/{id}',
  'H-01': '/hot-issues',
  'H-02': '/hot-issues/{id}',
};

// params.id 미지정 시 사용하는 폴백 식별자(RED/구조 확인용 — 실제 값은 seed 스크립트가 반환하는 id 사용 권장).
const DEFAULT_SEED_ID = process.env.PRESET_SPEC_SEED_ID || '1';

// 화면별 동적 세그먼트 폴백 식별자 — content/posts에 실재하는 slug·tag를 고정 시드로 사용.
// (H-02는 DB 시딩 스크립트가 실제 id를 주므로 DEFAULT_SEED_ID 폴백으로 충분)
const SEED_DEFAULTS = {
  'B-03': '2021-05-08-blockchain-concept',
  'B-07': '블록체인',
};

/**
 * resolveRouteTemplate(screenId) — 프리셋 → ROUTE_DEFAULTS → '/{screen_id}' 순으로 라우트 템플릿 해석.
 */
function resolveRouteTemplate(screenId) {
  const envKey = 'PRESET_SPEC_APP_ROUTE_' + screenId.replace(/-/g, '_');
  return process.env[envKey] || ROUTE_DEFAULTS[screenId] || '/' + screenId;
}

/**
 * fillRoute(screenId, template, params) — '{id}'/':id' 동적 세그먼트를
 * params.id(또는 화면별 SEED_DEFAULTS, 그다음 DEFAULT_SEED_ID)로 치환. URL 세그먼트이므로 인코딩한다.
 */
function fillRoute(screenId, template, params) {
  const raw =
    params && params.id != null ? String(params.id) : SEED_DEFAULTS[screenId] || DEFAULT_SEED_ID;
  return template.replace(/\{id\}|:id\b/g, encodeURIComponent(raw));
}

/**
 * gotoScreen(page, screenId, params) — 화면 진입.
 * 웹 기본: 프리셋 환경변수(PRESET_SPEC_APP_ROUTE_*) → ROUTE_DEFAULTS → '/{screen_id}' 순 폴백.
 * params.id가 있으면 라우트 템플릿의 동적 세그먼트({id}/:id)를 치환한다(예: H-02 상세 진입).
 * CONTRACT.md §4: 스택 종속 진입 경로는 프리셋이 주입한다.
 * (계약 screens[].entry는 사용자 경로 '서술'이라 라우팅에 쓰지 않는다 — 스키마에 라우트 필드 없음.)
 */
async function gotoScreen(page, screenId, params = {}) {
  screenOf(screenId); // 계약에 없는 화면이면 즉시 에러 (오타 조기 검출)
  const route = fillRoute(screenId, resolveRouteTemplate(screenId), params);
  await page.goto(route.startsWith('/') ? route : '/' + route);
}

/**
 * screenRoutePattern(screenId) — gotoScreen과 동일한 라우트 소스(프리셋/ROUTE_DEFAULTS/폴백)로부터
 * toHaveURL 단언용 정규식을 만든다. 동적 세그먼트는 '[^/]+' 로 치환.
 * spec에서 '/H-02' 같은 하드코딩 문자열 대신 이 함수를 사용해 실제 라우트와의 불일치를 방지한다.
 */
function screenRoutePattern(screenId) {
  const template = resolveRouteTemplate(screenId);
  const SENTINEL = '@@ID@@';
  const withSentinel = template.replace(/\{id\}|:id\b/g, SENTINEL);
  const escaped = withSentinel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = escaped.split(SENTINEL).join('[^/]+');
  return new RegExp(pattern + '(?:[/?#]|$)');
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

/**
 * expectActive(locator) — 탭/페이지 버튼 등 클릭 직후 active 상태 단언.
 * aria-selected / data-active / class 'active' 중 하나라도 참이면 통과.
 * 고정 시간 대기(wait-timeout류) API 없이 expect().toPass()의 내장 폴링 재시도로 클릭 직후 상태 반영 레이스를 제거한다.
 */
async function expectActive(locator) {
  await expect(async () => {
    const active = await locator.evaluate(
      (el) =>
        el.getAttribute('aria-selected') === 'true' ||
        el.getAttribute('data-active') === 'true' ||
        el.classList.contains('active')
    );
    expect(active).toBe(true);
  }).toPass();
}

/**
 * throttleNetwork(page, opts) — CDP(Network.emulateNetworkConditions)로 실제 네트워크 대역폭·지연을
 * 낮춰 스트리밍 응답 자체의 전송 속도를 늦춘다(목업 아님 — 실제 응답 바이트를 그대로 전달하되
 * 전송 속도만 늦춤). 로딩 스켈레톤처럼 정상 환경에서 순간적으로 지나가는 전환 상태를 안정적으로
 * 관측하기 위한 용도. 반드시 gotoScreen 이전(네비게이션 시작 전)에 호출해야 전체 스트리밍 구간에
 * 적용된다. 고정 시간 대기(wait-timeout류) API 미사용 — 이후 단언은 expect().toBeVisible()의
 * 내장 폴링 재시도가 담당.
 */
async function throttleNetwork(page, opts = {}) {
  const { downloadThroughput = 4000, uploadThroughput = 4000, latency = 200 } = opts;
  const client = await page.context().newCDPSession(page);
  await client.send('Network.enable');
  await client.send('Network.emulateNetworkConditions', {
    offline: false,
    downloadThroughput,
    uploadThroughput,
    latency,
  });
}

module.exports = {
  gotoScreen,
  ui,
  screenOf,
  componentOf,
  resolveLocator,
  screenRoutePattern,
  expectActive,
  throttleNetwork,
};
