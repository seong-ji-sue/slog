"use client";

import { useState, useMemo } from "react";
import { PostMeta } from "@/lib/format";
import PostItem from "@/components/PostItem";

interface Props {
  posts: PostMeta[];
  categories: string[];
}

export default function PostsFilter({ posts, categories }: Props) {
  const [active, setActive] = useState<string>("전체");

  const filtered = useMemo(() => {
    if (active === "전체") return posts;
    return posts.filter((p) => p.categories.includes(active));
  }, [active, posts]);

  return (
    <>
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
        {filtered.map((post) => (
          <PostItem key={post.slug} post={post} />
        ))}
        {filtered.length === 0 && (
          <p className="no-posts">해당 카테고리에 글이 없습니다.</p>
        )}
      </div>
    </>
  );
}
