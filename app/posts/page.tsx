import { getAllPosts } from "@/lib/posts";
import PostsFilter from "@/components/PostsFilter";
import "./posts.css";

export const metadata = { title: "글 — SLOG" };

export default function PostsPage() {
  const posts = getAllPosts();

  // 실데이터에서 카테고리 도출 (중복 제거, 등장 순)
  const categories = Array.from(
    new Set(posts.flatMap((p) => p.categories))
  );

  return (
    <main className="col posts-page">
      <h1 className="page-title mono">글</h1>
      <PostsFilter posts={posts} categories={categories} />
    </main>
  );
}
