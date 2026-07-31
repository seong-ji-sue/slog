import { getSql } from "@/lib/db";

// TASK-BE-6/7: 핫이슈 목록·상세 조회 계약
// 고정 출처 목록(FACTS/PRD BR-HOT-12) — 관리 기능 없이 코드 상수로 고정
export const HOT_ISSUE_SOURCES = ["Hacker News", "GeekNews", "Dev.to"] as const;
export type HotIssueSource = (typeof HOT_ISSUE_SOURCES)[number];

export const HOT_ISSUES_PAGE_SIZE = 20;

export interface HotIssueListItem {
  id: number;
  title: string;
  source: string;
  summarySnippet: string | null;
  collectedAt: string; // ISO
}

export interface HotIssueDetail {
  id: number;
  title: string;
  source: string;
  summary: string | null;
  collectedAt: string; // ISO
  originalUrl: string;
}

export interface HotIssuesListResult {
  items: HotIssueListItem[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface HotIssuesListParams {
  search?: string;
  source?: string;
  page?: number;
}

interface HotIssueRow {
  id: number;
  title: string;
  source: string;
  summary: string | null;
  collected_at: Date | string;
}

interface HotIssueDetailRow extends HotIssueRow {
  original_url: string;
}

function toIsoString(v: Date | string): string {
  return v instanceof Date ? v.toISOString() : String(v);
}

/** 검색어 공백 무시 부분일치 비교를 위한 정규화 — 모든 공백 제거 + 대소문자 무시 */
function normalizeForSearch(v: string): string {
  return v.replace(/\s+/g, "").toLowerCase();
}

function isValidSource(source: string): source is HotIssueSource {
  return (HOT_ISSUE_SOURCES as readonly string[]).includes(source);
}

/**
 * 핫이슈 목록 조회 계약 (TASK-BE-6).
 * 검색어(제목·요약·출처명 공백 무시 부분일치)·출처·페이지 파라미터로 필터링하고
 * 페이지당 HOT_ISSUES_PAGE_SIZE건 단위로 분할해 수집 시각 최신순으로 반환한다.
 */
export async function getHotIssuesList(
  params: HotIssuesListParams
): Promise<HotIssuesListResult> {
  const sql = getSql();
  const rows = (await sql`
    SELECT id, title, source, summary, collected_at
    FROM hot_issues
    ORDER BY collected_at DESC, id DESC
  `) as HotIssueRow[];

  const sourceFilter =
    params.source && isValidSource(params.source) ? params.source : null;
  const normalizedSearch = params.search ? normalizeForSearch(params.search) : "";

  const filtered = rows.filter((row) => {
    if (sourceFilter && row.source !== sourceFilter) return false;
    if (!normalizedSearch) return true;
    const haystack = normalizeForSearch(
      `${row.title} ${row.summary ?? ""} ${row.source}`
    );
    return haystack.includes(normalizedSearch);
  });

  const pageSize = HOT_ISSUES_PAGE_SIZE;
  const totalCount = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const requestedPage = params.page && params.page > 0 ? params.page : 1;
  const page = Math.min(requestedPage, totalPages);
  const start = (page - 1) * pageSize;

  const items: HotIssueListItem[] = filtered.slice(start, start + pageSize).map((row) => ({
    id: row.id,
    title: row.title,
    source: row.source,
    summarySnippet: row.summary,
    collectedAt: toIsoString(row.collected_at),
  }));

  return { items, page, pageSize, totalCount, totalPages };
}

/**
 * 핫이슈 상세 조회 계약 (TASK-BE-7).
 * summary는 요약 생성 실패 시 비어있을 수 있는 nullable 필드.
 * 존재하지 않는 식별자는 null을 반환해 호출부(라우트)가 조회 실패 응답을 구분하도록 한다.
 */
export async function getHotIssueById(id: string): Promise<HotIssueDetail | null> {
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) return null;

  const sql = getSql();
  const rows = (await sql`
    SELECT id, title, source, summary, collected_at, original_url
    FROM hot_issues
    WHERE id = ${numericId}
  `) as HotIssueDetailRow[];

  const row = rows[0];
  if (!row) return null;

  return {
    id: row.id,
    title: row.title,
    source: row.source,
    summary: row.summary,
    collectedAt: toIsoString(row.collected_at),
    originalUrl: row.original_url,
  };
}
