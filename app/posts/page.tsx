import { Suspense } from "react";
import { getAllPosts, SCOPE_TAXONOMY } from "@/lib/posts";
import { getAllPostViewCounts } from "@/lib/db";
import PostsFilter from "@/components/PostsFilter";
import "./posts.css";

export const metadata = { title: "글 — SLOG" };

// 조회수는 계속 바뀌므로 주기적으로 다시 조회
export const revalidate = 60;

export default async function PostsPage() {
  const posts = getAllPosts();

  // 실제 사용된 scope만, 분류 체계 순서대로
  const usedScopes = new Set(posts.map((p) => p.scope).filter(Boolean));
  const scopes = SCOPE_TAXONOMY.filter((s) => usedScopes.has(s.value));

  let viewCounts: Record<string, number> = {};
  try {
    viewCounts = await getAllPostViewCounts();
  } catch (e) {
    console.error("failed to load post view counts", e);
  }

  return (
    <main className="col posts-page">
      <h1 className="page-title mono">글</h1>
      <Suspense fallback={null}>
        <PostsFilter posts={posts} scopes={scopes} viewCounts={viewCounts} />
      </Suspense>
    </main>
  );
}
