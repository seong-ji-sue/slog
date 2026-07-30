"use client";

import { useMemo, useState } from "react";
import { PostMeta } from "@/lib/format";
import PostItem from "@/components/PostItem";

interface Props {
  posts: PostMeta[];
  categories: string[];
}

const PAGE_SIZE = 20;
const PAGE_WINDOW_SIZE = 5;
const WHITESPACE_RE = /\s+/g;

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

export default function PostsFilter({ posts, categories }: Props) {
  const [active, setActive] = useState<string>("전체");
  const [query, setQuery] = useState<string>("");
  const [page, setPage] = useState<number>(1);

  const filterKey = JSON.stringify([active, query]);
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setPage(1);
  }

  const filtered = useMemo(() => {
    const byCategory =
      active === "전체" ? posts : posts.filter((p) => p.categories.includes(active));
    return byCategory.filter((p) => matchesQuery(p, query));
  }, [active, posts, query]);

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

      <div
        className="tab-filter"
        data-testid="B-02-tab-filter"
        role="group"
        aria-label="카테고리 필터"
      >
        {["전체", ...categories].map((cat) => {
          const isActive = active === cat;
          return (
            <button
              key={cat}
              onClick={() => setActive(cat)}
              aria-selected={isActive}
              data-active={isActive ? "true" : undefined}
              className={`filter-btn${isActive ? " active" : ""}`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      <div
        className="post-list"
        data-testid="B-02-list-posts"
      >
        {paged.map((post) => (
          <PostItem key={post.slug} post={post} />
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
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page === 1}
            aria-label="이전 페이지"
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
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={page === totalPages}
            aria-label="다음 페이지"
          >
            다음
          </button>
        </nav>
      )}
    </>
  );
}
