import Link from "next/link";
import { getSeriesList, getSeriesPosts, fmtDate, stars, logNum } from "@/lib/posts";
import "../series.css";

interface Props {
  params: Promise<{ name: string }>;
}

export async function generateStaticParams() {
  return getSeriesList().map((s) => ({
    name: encodeURIComponent(s.name),
  }));
}

export async function generateMetadata({ params }: Props) {
  const { name } = await params;
  const decoded = decodeURIComponent(name);
  return { title: `${decoded} — SLOG` };
}

export default async function SeriesDetailPage({ params }: Props) {
  const { name } = await params;
  const decoded = decodeURIComponent(name);
  const posts = getSeriesPosts(decoded);

  return (
    <main className="col series-page">
      <div className="series-detail-header">
        <Link href="/series" className="back-link mono">← 시리즈 목록</Link>
        <h1 className="series-detail-title">{decoded}</h1>
        <p className="series-detail-count mono">{posts.length}편</p>
      </div>

      <ol
        data-testid="B-04-list-series-posts"
        className="series-posts-list"
      >
        {posts.map((post, idx) => (
          <li key={post.slug} className="series-post-item">
            <Link href={`/posts/${post.slug}`} className="series-post-link">
              <span className="series-post-order mono">{idx + 1}</span>
              <div className="series-post-body">
                <span className="series-post-lognum mono">
                  {logNum(post.log)}&nbsp;&nbsp;
                  <span className="cat">{post.categories[0] ?? ""}</span>
                </span>
                <span className="series-post-title">{post.title}</span>
                <span className="series-post-meta mono">
                  {fmtDate(post.date)}&nbsp;&nbsp;·&nbsp;&nbsp;난이도&nbsp;{stars(post.difficulty)}
                </span>
              </div>
            </Link>
          </li>
        ))}
        {posts.length === 0 && (
          <li className="no-posts mono">이 시리즈에 글이 없습니다.</li>
        )}
      </ol>
    </main>
  );
}
