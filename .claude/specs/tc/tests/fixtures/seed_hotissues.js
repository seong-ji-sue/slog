// seed_hotissues.js — hot-issues TC 실측(GREEN)용 결정론적 픽스처 시더.
//
// [실측 TRIAGE 재작업] AC-H01-04/05/12/13/14(페이지네이션), AC-H02-01/02/05(상세·요약실패)는
// hot_issues 테이블에 결정론적 데이터가 있어야 실측 가능한데 시딩 로직이 없어 SPEC_MISMATCH로
// 분류됨. 기존 스키마(db/migrations/002_hot_issues.sql)의 hot_issues 테이블에만 upsert하고,
// 앱 코드(app/hot-issues/**, lib/hotIssues.ts)는 건드리지 않는다.
//
// 실행 시점: TC_TARGET==='real' (test-workflow 실측/GREEN)일 때만 동작.
//   - RED(코드 부재 빈 셸, TC_TARGET==='app')에서는 즉시 skip — UI가 없으므로 시딩해도 의미 없고,
//     RULES.md #3(목업 금지)·CONTRACT.md §5(RED는 코드 부재 실앱 단일 실행) 위반 소지를 차단.
// 의존성: @neondatabase/serverless — tc 하니스에 새 devDependency로 추가하지 않는다.
//   Node 모듈 해석이 상위 디렉터리(레포 루트 node_modules)의 앱 기존 의존성을 그대로 찾아 쓴다.
// 멱등성: original_url UNIQUE 제약을 이용한 ON CONFLICT UPSERT — 여러 번 실행해도 안전.

'use strict';

const FIXTURE_PREFIX = 'https://tc-fixture.local/hot-issues/';

// AC-H01-04/05/12/13/14: 20건 초과 페이지네이션 + 5페이지 창 초과(다음 창 이동 시 6페이지 존재)를
// 확보하기 위해 105건(⌈105/20⌉=6페이지) 생성. 모든 summary에 '개발' 포함(AC-H01-02 검색 시나리오가
// 0건으로 비어 STRUCT/AC 단언이 깨지지 않도록).
const LIST_FIXTURE_COUNT = 105;
const SOURCES = ['Hacker News', 'GeekNews', 'Dev.to'];

function buildListFixtureRows() {
  const rows = [];
  for (let i = 0; i < LIST_FIXTURE_COUNT; i += 1) {
    rows.push({
      key: `list-${i + 1}`,
      title: `TC 픽스처 이슈 ${i + 1}`,
      source: SOURCES[i % SOURCES.length],
      summary: `TC 픽스처 요약 ${i + 1} — 개발 관련 내용`,
      original_url: `${FIXTURE_PREFIX}list-${i + 1}`,
      collected_at_offset_min: i, // 값이 클수록 과거 — 최신순(offset 0이 최신) 정렬 검증 가능
    });
  }
  return rows;
}

// AC-H02-05: 요약 생성 실패(summary=NULL) 상세 페이지 전용 픽스처
const SUMMARY_NULL_ROW = {
  key: 'summary-null',
  title: 'TC 픽스처 요약누락 이슈',
  source: 'Hacker News',
  summary: null,
  original_url: `${FIXTURE_PREFIX}summary-null`,
  collected_at_offset_min: 0,
};

const FIXTURE_ROWS = [...buildListFixtureRows(), SUMMARY_NULL_ROW];

/**
 * seed() — TC_TARGET==='real'일 때만 hot_issues에 FIXTURE_ROWS를 upsert하고
 * { skipped, ids } 를 반환한다. ids[row.key] = 실제 insert된 id(H-02 상세 진입용).
 */
async function seed() {
  if (process.env.TC_TARGET !== 'real') {
    return { skipped: true, ids: {} };
  }
  if (!process.env.DATABASE_URL) {
    // 실측(real) 모드인데 DB 접속정보가 없으면 시딩 불가 — 호출부가 원인을 알 수 있도록 명시적으로 던짐.
    throw new Error('seed_hotissues: TC_TARGET=real 인데 DATABASE_URL 미설정');
  }

  const { neon } = require('@neondatabase/serverless');
  const sql = neon(process.env.DATABASE_URL);

  const ids = {};
  for (const row of FIXTURE_ROWS) {
    const collectedAt = new Date(
      Date.now() - row.collected_at_offset_min * 60000
    ).toISOString();
    const result = await sql`
      INSERT INTO hot_issues (title, source, original_url, summary, collected_at)
      VALUES (${row.title}, ${row.source}, ${row.original_url}, ${row.summary}, ${collectedAt})
      ON CONFLICT (original_url) DO UPDATE SET
        title = EXCLUDED.title,
        source = EXCLUDED.source,
        summary = EXCLUDED.summary,
        collected_at = EXCLUDED.collected_at
      RETURNING id
    `;
    ids[row.key] = result[0].id;
  }
  return { skipped: false, ids };
}

module.exports = { seed, FIXTURE_ROWS, FIXTURE_PREFIX, LIST_FIXTURE_COUNT };
