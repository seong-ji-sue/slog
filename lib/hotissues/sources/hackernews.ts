import {
  HACKER_NEWS_ITEM_URL_PREFIX,
  HACKER_NEWS_ITEM_URL_SUFFIX,
  HACKER_NEWS_TOP_STORIES_URL,
  HOT_ISSUE_SOURCES,
  HOT_ISSUES_FETCH_LIMIT,
  HOT_ISSUES_SOURCE_FETCH_TIMEOUT_MS,
} from "../constants";
import { fetchWithTimeout } from "../fetch_with_timeout";
import type { RawHotIssue } from "../types";

interface HackerNewsRawItem {
  id?: unknown;
  title?: unknown;
  url?: unknown;
  text?: unknown;
  deleted?: unknown;
  dead?: unknown;
}

interface ValidHackerNewsStory {
  id: number;
  title: string;
  url: string;
  text?: string;
}

function isValidStoryItem(item: unknown): item is ValidHackerNewsStory {
  if (typeof item !== "object" || item === null) return false;
  const candidate = item as HackerNewsRawItem;
  return (
    typeof candidate.id === "number" &&
    typeof candidate.title === "string" &&
    typeof candidate.url === "string" &&
    candidate.deleted !== true &&
    candidate.dead !== true
  );
}

/**
 * Hacker News 공식 Firebase API에서 상위 스토리를 조회한다.
 * 원문 링크(url)가 없는 항목(Ask HN 등 자체 텍스트 글)은 "원문 접근 실패"로 간주해 제외한다.
 */
export async function fetchHackerNewsIssues(): Promise<RawHotIssue[]> {
  const idsRes = await fetchWithTimeout(
    HACKER_NEWS_TOP_STORIES_URL,
    HOT_ISSUES_SOURCE_FETCH_TIMEOUT_MS
  );
  if (!idsRes.ok) {
    throw new Error(`Hacker News top stories 조회 실패 (status ${idsRes.status})`);
  }
  const ids = (await idsRes.json()) as unknown;
  if (!Array.isArray(ids)) {
    throw new Error("Hacker News top stories 응답 형식이 올바르지 않음");
  }
  const targetIds = ids.slice(0, HOT_ISSUES_FETCH_LIMIT).filter((id): id is number => typeof id === "number");

  const settled = await Promise.allSettled(
    targetIds.map(async (id) => {
      const res = await fetchWithTimeout(
        `${HACKER_NEWS_ITEM_URL_PREFIX}${id}${HACKER_NEWS_ITEM_URL_SUFFIX}`,
        HOT_ISSUES_SOURCE_FETCH_TIMEOUT_MS
      );
      if (!res.ok) throw new Error(`item ${id} 조회 실패 (status ${res.status})`);
      return (await res.json()) as unknown;
    })
  );

  const issues: RawHotIssue[] = [];
  for (const result of settled) {
    if (result.status !== "fulfilled") continue;
    const item = result.value;
    if (!isValidStoryItem(item)) continue;
    issues.push({
      title: item.title,
      source: HOT_ISSUE_SOURCES.HACKER_NEWS,
      originalUrl: item.url,
      excerpt: item.text ?? item.title,
    });
  }
  return issues;
}
