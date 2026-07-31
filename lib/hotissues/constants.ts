// TASK-BE-5: 핫이슈 자동 수집 배치 — 고정 출처·수집 파라미터 상수
// 매직 넘버/문자열 금지 규칙(.claude/rules/code_style_ts.md)에 따라 이 파일에 모아 관리한다.

export const HOT_ISSUE_SOURCES = {
  HACKER_NEWS: "Hacker News",
  GEEKNEWS: "GeekNews",
  DEV_TO: "Dev.to",
} as const;

export type HotIssueSourceName = (typeof HOT_ISSUE_SOURCES)[keyof typeof HOT_ISSUE_SOURCES];

// 매일 1회 지정 시각 수집 — 배치 스케줄 프리셋값 (00:00 UTC = 09:00 KST)
// vercel.json의 crons[].schedule 값과 반드시 동일하게 유지한다.
export const HOT_ISSUES_COLLECT_CRON_SCHEDULE = "0 0 * * *";

// 출처별 1회 수집 시 조회할 최대 신규 후보 개수
export const HOT_ISSUES_FETCH_LIMIT = 20;

export const HACKER_NEWS_TOP_STORIES_URL =
  "https://hacker-news.firebaseio.com/v0/topstories.json";
export const HACKER_NEWS_ITEM_URL_PREFIX = "https://hacker-news.firebaseio.com/v0/item/";
export const HACKER_NEWS_ITEM_URL_SUFFIX = ".json";

export const GEEKNEWS_RSS_URL = "https://feeds.feedburner.com/geeknews-feed";

export const DEV_TO_ARTICLES_URL = "https://dev.to/api/articles?per_page=20&top=1";

// 외부 fetch 공통 타임아웃(ms) — 출처 하나가 느려도 나머지 출처 수집을 막지 않도록 상한을 둔다.
export const HOT_ISSUES_SOURCE_FETCH_TIMEOUT_MS = 10_000;

// 한국어 요약 생성 호출 타임아웃(ms)
export const HOT_ISSUES_SUMMARY_FETCH_TIMEOUT_MS = 15_000;
