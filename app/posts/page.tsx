import { getAllPosts, SCOPE_TAXONOMY } from "@/lib/posts";
import PostsFilter from "@/components/PostsFilter";
import "./posts.css";

export const metadata = { title: "글 — SLOG" };

export default function PostsPage() {
  const posts = getAllPosts();

  // 실데이터에서 카테고리 도출 (중복 제거, 등장 순)
  const categories = Array.from(
    new Set(posts.flatMap((p) => p.categories))
  );

  // 실제 사용된 scope만, 분류 체계 순서대로
  const usedScopes = new Set(posts.map((p) => p.scope).filter(Boolean));
  const scopes = SCOPE_TAXONOMY.filter((s) => usedScopes.has(s.value));

  return (
    <main className="col posts-page">
      <h1 className="page-title mono">글</h1>
      <PostsFilter posts={posts} categories={categories} scopes={scopes} />
    </main>
  );
}
