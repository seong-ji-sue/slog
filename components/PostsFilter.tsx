"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PostMeta, ScopeTaxonomyEntry } from "@/lib/format";
import PostItem from "@/components/PostItem";

interface Props {
  posts: PostMeta[];
  scopes: ScopeTaxonomyEntry[];
  viewCounts: Record<string, number>;
}

type SortOrder = "latest" | "views";
type ViewMode = "list" | "card";

const PAGE_SIZE = 20;
const PAGE_WINDOW_SIZE = 5;
const WHITESPACE_RE = /\s+/g;
const VIEW_MODE_STORAGE_KEY = "slog-posts-view-mode";

function normalize(value: string): string {
  return value.toLowerCase().replace(WHITESPACE_RE, "");
}

function matchesQuery(post: PostMeta, query: string): boolean {
  const normalizedQuery = normalize(query);
  if (normalizedQuery === "") return true;

  const inTitle = normalize(post.title).includes(normalizedQuery);
  const inDescription = normalize(post.description).includes(normalizedQuery);
  const inTags = post.tags.some((tag) => normalize(tag).includes(normalizedQuery));

  return inTitle || inDescription || inTags;
}

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

export default function PostsFilter({ posts, scopes, viewCounts }: Props) {
  const searchParams = useSearchParams();
  const scopeFromUrl = searchParams.get("scope");
  const initialScope =
    scopeFromUrl && scopes.some((s) => s.value === scopeFromUrl) ? scopeFromUrl : "전체";
  const [activeScope, setActiveScope] = useState<string>(initialScope);
  const [query, setQuery] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [sortOrder, setSortOrder] = useState<SortOrder>("latest");
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  useEffect(() => {
    const saved = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
    if (saved === "card" || saved === "list") setViewMode(saved);
  }, []);

  function changeViewMode(next: ViewMode) {
    setViewMode(next);
    localStorage.setItem(VIEW_MODE_STORAGE_KEY, next);
  }

  const filterKey = JSON.stringify([activeScope, query, sortOrder]);
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setPage(1);
  }

  const filtered = useMemo(() => {
    const byScope =
      activeScope === "전체" ? posts : posts.filter((p) => p.scope === activeScope);
    const byQuery = byScope.filter((p) => matchesQuery(p, query));

    if (sortOrder === "views") {
      return [...byQuery].sort(
        (a, b) => (viewCounts[b.slug] ?? 0) - (viewCounts[a.slug] ?? 0)
      );
    }
    return byQuery;
  }, [activeScope, posts, query, sortOrder, viewCounts]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const paged = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const pageNumbers = getPageNumbers(page, totalPages);

  return (
    <>
      <input
        type="search"
        className="search-input"
        data-testid="B-02-input-search"
        placeholder="제목·태그로 검색"
        aria-label="글 검색"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {scopes.length > 0 && (
        <div
          className="tab-filter"
          data-testid="B-02-tab-filter"
          role="group"
          aria-label="분류 필터"
        >
          {[{ value: "전체", label: "전체" }, ...scopes].map((s) => {
            const isActive = activeScope === s.value;
            return (
              <button
                key={s.value}
                onClick={() => setActiveScope(s.value)}
                aria-selected={isActive}
                data-active={isActive ? "true" : undefined}
                className={`filter-btn${isActive ? " active" : ""}`}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      )}

      <div className="list-toolbar">
        <div
          className="tab-filter"
          data-testid="B-02-tab-filter-sort"
          role="group"
          aria-label="정렬 기준"
        >
          {[
            { value: "latest" as const, label: "최신순" },
            { value: "views" as const, label: "조회수순" },
          ].map((s) => {
            const isActive = sortOrder === s.value;
            return (
              <button
                key={s.value}
                onClick={() => setSortOrder(s.value)}
                aria-selected={isActive}
                data-active={isActive ? "true" : undefined}
                className={`filter-btn${isActive ? " active" : ""}`}
              >
                {s.label}
              </button>
            );
          })}
        </div>

        <div
          className="view-toggle"
          data-testid="B-02-toggle-view"
          role="group"
          aria-label="보기 형식"
        >
          {[
            { value: "list" as const, label: "목록" },
            { value: "card" as const, label: "카드" },
          ].map((v) => {
            const isActive = viewMode === v.value;
            return (
              <button
                key={v.value}
                onClick={() => changeViewMode(v.value)}
                aria-pressed={isActive}
                data-active={isActive ? "true" : undefined}
                className={`filter-btn${isActive ? " active" : ""}`}
              >
                {v.label}
              </button>
            );
          })}
        </div>
      </div>

      <div
        className="post-list"
        data-view={viewMode}
        data-testid="B-02-list-posts"
      >
        {paged.map((post) => (
          <PostItem key={post.slug} post={post} viewCount={viewCounts[post.slug] ?? 0} />
        ))}
        {filtered.length === 0 && (
          <p className="no-posts">검색 결과가 없습니다.</p>
        )}
      </div>

      {totalPages > 1 && (
        <nav
          className="pagination"
          data-testid="B-02-pagination"
          aria-label="페이지 네비게이션"
        >
          <button
            type="button"
            className="page-btn page-btn-nav"
            onClick={() => setPage((prev) => Math.max(1, prev - PAGE_WINDOW_SIZE))}
            disabled={page === 1}
            aria-label="이전 5페이지"
          >
            이전
          </button>

          {pageNumbers.map((n) => (
            <button
              key={n}
              type="button"
              className={`page-btn${n === page ? " active" : ""}`}
              onClick={() => setPage(n)}
              aria-current={n === page ? "page" : undefined}
              aria-label={`${n}페이지`}
            >
              {n}
            </button>
          ))}

          <button
            type="button"
            className="page-btn page-btn-nav"
            onClick={() => setPage((prev) => Math.min(totalPages, prev + PAGE_WINDOW_SIZE))}
            disabled={page === totalPages}
            aria-label="다음 5페이지"
          >
            다음
          </button>
        </nav>
      )}
    </>
  );
}
