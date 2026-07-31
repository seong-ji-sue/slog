import { getSql } from "@/lib/db";
import { fetchHackerNewsIssues } from "./sources/hackernews";
import { fetchGeekNewsIssues } from "./sources/geeknews";
import { fetchDevToIssues } from "./sources/devto";
import { summarizeInKorean } from "./summarize";
import type { HotIssueSourceRunResult, RawHotIssue } from "./types";
import type { HotIssueSourceName } from "./constants";

const SOURCE_FETCHERS: { source: HotIssueSourceName; fetch: () => Promise<RawHotIssue[]> }[] = [
  { source: "Hacker News", fetch: fetchHackerNewsIssues },
  { source: "GeekNews", fetch: fetchGeekNewsIssues },
  { source: "Dev.to", fetch: fetchDevToIssues },
];

interface ExistingUrlRow {
  original_url: string;
}

async function findExistingUrls(urls: string[]): Promise<Set<string>> {
  if (urls.length === 0) return new Set();
  const sql = getSql();
  const rows = (await sql`
    SELECT original_url FROM hot_issues WHERE original_url = ANY(${urls})
  `) as ExistingUrlRow[];
  return new Set(rows.map((r) => r.original_url));
}

async function insertIssue(issue: RawHotIssue, summary: string | null): Promise<void> {
  const sql = getSql();
  // TASK-BE-5 steps 2: original_url UNIQUE 제약이 최종 방어선 — 동시 실행에도 중복 저장되지 않음.
  await sql`
    INSERT INTO hot_issues (title, source, original_url, summary)
    VALUES (${issue.title}, ${issue.source}, ${issue.originalUrl}, ${summary})
    ON CONFLICT (original_url) DO NOTHING
  `;
}

// 요약 생성(AI 호출)은 건별 왕복 지연이 있어 순차 처리 시 함수 실행 시간 상한에 걸릴 수 있다 —
// 출처당 소수 동시 처리로 지연을 줄인다(외부 API 동시 요청 폭주 방지 목적의 상한이기도 함).
const SUMMARIZE_CONCURRENCY = 4;

async function summarizeAndInsertAll(issues: RawHotIssue[]): Promise<number> {
  let cursor = 0;
  let inserted = 0;

  async function worker() {
    while (cursor < issues.length) {
      const issue = issues[cursor];
      cursor += 1;
      // TASK-BE-5 steps 3: 수집 시점 1회만 요약 생성 — 실패해도 나머지 필드는 정상 저장.
      const summary = await summarizeInKorean(issue.title, issue.excerpt);
      await insertIssue(issue, summary);
      inserted += 1;
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(SUMMARIZE_CONCURRENCY, issues.length) }, worker)
  );
  return inserted;
}

async function collectFromSource(
  source: HotIssueSourceName,
  fetch: () => Promise<RawHotIssue[]>
): Promise<HotIssueSourceRunResult> {
  let rawIssues: RawHotIssue[];
  try {
    rawIssues = await fetch();
  } catch (e) {
    return {
      source,
      fetched: 0,
      inserted: 0,
      skippedDuplicate: 0,
      failed: true,
      error: e instanceof Error ? e.message : String(e),
    };
  }

  try {
    const existingUrls = await findExistingUrls(rawIssues.map((r) => r.originalUrl));
    const newIssues = rawIssues.filter((r) => !existingUrls.has(r.originalUrl));
    const inserted = await summarizeAndInsertAll(newIssues);

    return {
      source,
      fetched: rawIssues.length,
      inserted,
      skippedDuplicate: rawIssues.length - newIssues.length,
      failed: false,
    };
  } catch (e) {
    return {
      source,
      fetched: rawIssues.length,
      inserted: 0,
      skippedDuplicate: 0,
      failed: true,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

// TASK-BE-5: 고정 출처(HN·GeekNews·Dev.to)를 출처별로 격리 수집 — 한 출처 실패·지연이 나머지를 막지 않는다.
// 출처 전체를 병렬 처리해 요약 생성(건별 AI 왕복)이 배치 실행 시간을 순차 누적시키지 않도록 한다.
export async function collectHotIssues(): Promise<HotIssueSourceRunResult[]> {
  return Promise.all(SOURCE_FETCHERS.map((s) => collectFromSource(s.source, s.fetch)));
}
