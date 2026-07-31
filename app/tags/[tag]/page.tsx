import Link from "next/link";
import { getTagsList, getPostsByTag } from "@/lib/posts";
import PostItem from "@/components/PostItem";
import "../tags.css";

interface Props {
  params: Promise<{ tag: string }>;
}

export async function generateStaticParams() {
  return getTagsList().map((t) => ({ tag: t.slug }));
}

function decodeTagParam(tag: string): string {
  try {
    return decodeURIComponent(tag);
  } catch {
    return tag;
  }
}

export async function generateMetadata({ params }: Props) {
  const { tag } = await params;
  const decoded = decodeTagParam(tag);
  const found = getTagsList().find((t) => t.slug === decoded);
  const name = found?.name ?? decoded;
  return { title: `${name} — SLOG` };
}

export default async function TagDetailPage({ params }: Props) {
  const { tag } = await params;
  const decoded = decodeTagParam(tag);
  const found = getTagsList().find((t) => t.slug === decoded);
  const name = found?.name ?? decoded;
  const posts = getPostsByTag(decoded);

  return (
    <main className="col tags-page">
      <div className="tag-detail-header">
        <Link href="/tags" className="back-link mono">← 태그 목록</Link>
        <h1 className="tag-detail-title">{name}</h1>
        <p className="tag-detail-count mono">{posts.length}편</p>
      </div>

      <div data-testid="tag-posts-list" className="post-list">
        {posts.map((post) => (
          <PostItem key={post.slug} post={post} />
        ))}
        {posts.length === 0 && (
          <p className="no-posts mono">이 태그에 글이 없습니다.</p>
        )}
      </div>
    </main>
  );
}
