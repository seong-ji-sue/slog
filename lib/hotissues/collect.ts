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

// TASK-BE-5: 고정 출처(HN·GeekNews·Dev.to)를 출처별로 격리 수집 — 한 출처 실패가 나머지를 막지 않는다.
export async function collectHotIssues(): Promise<HotIssueSourceRunResult[]> {
  const settled = await Promise.allSettled(SOURCE_FETCHERS.map((s) => s.fetch()));

  const results: HotIssueSourceRunResult[] = [];
  for (let i = 0; i < SOURCE_FETCHERS.length; i++) {
    const { source } = SOURCE_FETCHERS[i];
    const outcome = settled[i];

    if (outcome.status === "rejected") {
      results.push({
        source,
        fetched: 0,
        inserted: 0,
        skippedDuplicate: 0,
        failed: true,
        error: outcome.reason instanceof Error ? outcome.reason.message : String(outcome.reason),
      });
      continue;
    }

    const rawIssues = outcome.value;
    try {
      const existingUrls = await findExistingUrls(rawIssues.map((r) => r.originalUrl));
      const newIssues = rawIssues.filter((r) => !existingUrls.has(r.originalUrl));

      let inserted = 0;
      for (const issue of newIssues) {
        // TASK-BE-5 steps 3: 수집 시점 1회만 요약 생성 — 실패해도 나머지 필드는 정상 저장.
        const summary = await summarizeInKorean(issue.title, issue.excerpt);
        await insertIssue(issue, summary);
        inserted += 1;
      }

      results.push({
        source,
        fetched: rawIssues.length,
        inserted,
        skippedDuplicate: rawIssues.length - newIssues.length,
        failed: false,
      });
    } catch (e) {
      results.push({
        source,
        fetched: rawIssues.length,
        inserted: 0,
        skippedDuplicate: 0,
        failed: true,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return results;
}
