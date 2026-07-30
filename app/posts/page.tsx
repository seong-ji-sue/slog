import { getAllPosts, SCOPE_TAXONOMY } from "@/lib/posts";
import PostsFilter from "@/components/PostsFilter";
import "./posts.css";

export const metadata = { title: "글 — SLOG" };

export default function PostsPage() {
  const posts = getAllPosts();

  // 실제 사용된 scope만, 분류 체계 순서대로
  const usedScopes = new Set(posts.map((p) => p.scope).filter(Boolean));
  const scopes = SCOPE_TAXONOMY.filter((s) => usedScopes.has(s.value));

  return (
    <main className="col posts-page">
      <h1 className="page-title mono">글</h1>
      <PostsFilter posts={posts} scopes={scopes} />
    </main>
  );
}
