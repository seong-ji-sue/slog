import {
  GEEKNEWS_RSS_URL,
  HOT_ISSUE_SOURCES,
  HOT_ISSUES_FETCH_LIMIT,
  HOT_ISSUES_SOURCE_FETCH_TIMEOUT_MS,
} from "../constants";
import { fetchWithTimeout } from "../fetch_with_timeout";
import type { RawHotIssue } from "../types";

const RSS_ITEM_RE = /<item>([\s\S]*?)<\/item>/g;
const RSS_TITLE_RE = /<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/;
const RSS_LINK_RE = /<link>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/link>/;
const RSS_DESCRIPTION_RE = /<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/;

function decodeXmlEntities(raw: string): string {
  return raw
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function parseRssItems(xml: string): RawHotIssue[] {
  const issues: RawHotIssue[] = [];
  const itemMatches = xml.matchAll(RSS_ITEM_RE);
  for (const match of itemMatches) {
    const block = match[1];
    const titleMatch = RSS_TITLE_RE.exec(block);
    const linkMatch = RSS_LINK_RE.exec(block);
    if (!titleMatch || !linkMatch) continue;
    const title = decodeXmlEntities(titleMatch[1]);
    const originalUrl = decodeXmlEntities(linkMatch[1]);
    if (!title || !originalUrl) continue;
    const descriptionMatch = RSS_DESCRIPTION_RE.exec(block);
    const excerpt = descriptionMatch ? decodeXmlEntities(descriptionMatch[1]) : title;
    issues.push({ title, source: HOT_ISSUE_SOURCES.GEEKNEWS, originalUrl, excerpt });
  }
  return issues.slice(0, HOT_ISSUES_FETCH_LIMIT);
}

/**
 * GeekNews(news.hada.io) RSS 피드에서 신규 이슈를 조회한다.
 * 원문 링크가 없는 항목은 파싱 단계에서 자연히 제외된다.
 */
export async function fetchGeekNewsIssues(): Promise<RawHotIssue[]> {
  const res = await fetchWithTimeout(GEEKNEWS_RSS_URL, HOT_ISSUES_SOURCE_FETCH_TIMEOUT_MS);
  if (!res.ok) {
    throw new Error(`GeekNews RSS 조회 실패 (status ${res.status})`);
  }
  const xml = await res.text();
  return parseRssItems(xml);
}
