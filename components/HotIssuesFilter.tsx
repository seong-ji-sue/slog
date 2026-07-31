"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import type { HotIssueListItem, HotIssueSource, HotIssuesListResult } from "@/lib/hotIssues";

interface Props {
  result: HotIssuesListResult | null;
  loadError: boolean;
  sources: readonly HotIssueSource[];
  query: string;
  activeSource: string;
}

const PAGE_WINDOW_SIZE = 5;
const SEARCH_DEBOUNCE_MS = 300;
const ALL_SOURCE = "전체";

function getPageNumbers(currentPage: number, totalPages: number): number[] {
  if (totalPages <= PAGE_WINDOW_SIZE) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const half = Math.floor(PAGE_WINDOW_SIZE / 2);
  let start = Math.max(1, currentPage - half);
  const end = Math.min(totalPages, start + PAGE_WINDOW_SIZE - 1);
  start = Math.max(1, end - PAGE_WINDOW_SIZE + 1);
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

function fmtCollectedDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function HotIssueCard({ issue }: { issue: HotIssueListItem }) {
  return (
    <Link
      href={`/hot-issues/${issue.id}`}
      className="hotissue-card"
      data-testid="H-01-list-hotissues-item"
    >
      <span className="hotissue-source">{issue.source}</span>
      <h3 className="hotissue-title">{issue.title}</h3>
      <p className="hotissue-snippet">{issue.summarySnippet ?? "요약 준비 중"}</p>
      <span className="hotissue-date">{fmtCollectedDate(issue.collectedAt)}</span>
    </Link>
  );
}

export default function HotIssuesFilter({ result, loadError, sources, query, activeSource }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [inputValue, setInputValue] = useState(query);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setInputValue(query), [query]);

  function pushParams(next: { q?: string; source?: string; page?: number }) {
    const params = new URLSearchParams(searchParams.toString());
    if (next.q !== undefined) {
      if (next.q) params.set("q", next.q);
      else params.delete("q");
    }
    if (next.source !== undefined) {
      if (next.source && next.source !== ALL_SOURCE) params.set("source", next.source);
      else params.delete("source");
    }
    if (next.page !== undefined) {
      if (next.page > 1) params.set("page", String(next.page));
      else params.delete("page");
    } else {
      params.delete("page"); // 검색어·출처가 바뀌면 1페이지로 재설정 (AC-H01-03/06)
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  function onSearchChange(value: string) {
    setInputValue(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => pushParams({ q: value }), SEARCH_DEBOUNCE_MS);
  }

  function resetFilters() {
    setInputValue("");
    router.push(pathname);
  }

  const hasActiveFilter = query !== "" || activeSource !== ALL_SOURCE;

  return (
    <>
      <input
        type="search"
        className="search-input"
        data-testid="H-01-search-hotissues"
        placeholder="제목·요약·출처로 검색"
        aria-label="핫이슈 검색"
        value={inputValue}
        onChange={(e) => onSearchChange(e.target.value)}
      />

      <div className="tab-filter" data-testid="H-01-tab-source" role="group" aria-label="출처 필터">
        {[ALL_SOURCE, ...sources].map((s) => {
          const isActive = activeSource === s;
          return (
            <button
              key={s}
              type="button"
              onClick={() => pushParams({ source: s })}
              aria-selected={isActive}
              data-active={isActive ? "true" : undefined}
              className={`filter-btn${isActive ? " active" : ""}`}
            >
              {s}
            </button>
          );
        })}
      </div>

      {loadError && (
        <div className="hotissue-state">
          <p data-testid="H-01-text-error-list">핫이슈 목록을 불러오지 못했습니다.</p>
          <button
            type="button"
            data-testid="H-01-button-retry-list"
            className="filter-btn"
            onClick={() => router.refresh()}
          >
            다시 시도
          </button>
        </div>
      )}

      {!loadError && result && result.totalCount === 0 && !hasActiveFilter && (
        <p className="hotissue-state" data-testid="H-01-text-empty-all">
          아직 수집된 이슈가 없습니다.
        </p>
      )}

      {!loadError && result && result.totalCount === 0 && hasActiveFilter && (
        <div className="hotissue-state">
          <p data-testid="H-01-text-empty-search">검색 결과가 없습니다.</p>
          <button
            type="button"
            data-testid="H-01-button-reset-filter"
            className="filter-btn"
            onClick={resetFilters}
          >
            필터 초기화
          </button>
        </div>
      )}

      {!loadError && result && result.totalCount > 0 && (
        <div className="hotissue-list" data-testid="H-01-list-hotissues">
          {result.items.map((issue) => (
            <HotIssueCard key={issue.id} issue={issue} />
          ))}
        </div>
      )}

      {!loadError && result && result.totalPages > 1 && (
        <nav className="pagination" data-testid="H-01-list-pagination" aria-label="페이지 네비게이션">
          <button
            type="button"
            className="page-btn page-btn-nav"
            onClick={() => pushParams({ page: Math.max(1, result.page - PAGE_WINDOW_SIZE) })}
            disabled={result.page === 1}
            aria-label="이전 5페이지"
          >
            이전
          </button>
          {getPageNumbers(result.page, result.totalPages).map((n) => (
            <button
              key={n}
              type="button"
              className={`page-btn${n === result.page ? " active" : ""}`}
              onClick={() => pushParams({ page: n })}
              aria-current={n === result.page ? "page" : undefined}
              aria-label={`${n}페이지`}
            >
              {n}
            </button>
          ))}
          <button
            type="button"
            className="page-btn page-btn-nav"
            onClick={() =>
              pushParams({ page: Math.min(result.totalPages, result.page + PAGE_WINDOW_SIZE) })
            }
            disabled={result.page === result.totalPages}
            aria-label="다음 5페이지"
          >
            다음
          </button>
        </nav>
      )}
    </>
  );
}
