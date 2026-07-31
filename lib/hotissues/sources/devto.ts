import {
  DEV_TO_ARTICLES_URL,
  HOT_ISSUE_SOURCES,
  HOT_ISSUES_SOURCE_FETCH_TIMEOUT_MS,
} from "../constants";
import { fetchWithTimeout } from "../fetch_with_timeout";
import type { RawHotIssue } from "../types";

interface DevToArticleRaw {
  title?: unknown;
  url?: unknown;
  description?: unknown;
}

function isValidArticle(
  item: unknown
): item is { title: string; url: string; description?: string } {
  if (typeof item !== "object" || item === null) return false;
  const candidate = item as DevToArticleRaw;
  return typeof candidate.title === "string" && typeof candidate.url === "string";
}

/**
 * Dev.to 공식 공개 API에서 신규 아티클을 조회한다.
 */
export async function fetchDevToIssues(): Promise<RawHotIssue[]> {
  const res = await fetchWithTimeout(DEV_TO_ARTICLES_URL, HOT_ISSUES_SOURCE_FETCH_TIMEOUT_MS);
  if (!res.ok) {
    throw new Error(`Dev.to articles 조회 실패 (status ${res.status})`);
  }
  const body = (await res.json()) as unknown;
  if (!Array.isArray(body)) {
    throw new Error("Dev.to articles 응답 형식이 올바르지 않음");
  }
  const issues: RawHotIssue[] = [];
  for (const item of body) {
    if (!isValidArticle(item)) continue;
    issues.push({
      title: item.title,
      source: HOT_ISSUE_SOURCES.DEV_TO,
      originalUrl: item.url,
      excerpt: item.description ?? item.title,
    });
  }
  return issues;
}
