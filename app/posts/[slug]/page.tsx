import { notFound } from "next/navigation";
import Link from "next/link";
import { getPost, adjacent, stars, fmtDate, logNum, getAllPosts, tagSlug } from "@/lib/posts";
import "./post.css";

// ── 파싱 유틸 (lib 수정 금지 — 페이지 내 함수) ──────────────────────

/** 본문에서 `> **TL;DR** — ...` blockquote를 추출하고 제거 */
function extractTldr(html: string): { tldr: string; body: string } {
  // rehype 파이프라인 결과물: <blockquote>\n<p><strong>TL;DR</strong> — ...</p>\n</blockquote>
  const re = /<blockquote>\s*<p><strong>TL;DR<\/strong>([\s\S]*?)<\/p>\s*<\/blockquote>/i;
  const m = html.match(re);
  if (!m) return { tldr: "", body: html };
  const inner = m[1].trim().replace(/^[—–-]\s*/, "");
  const body = html.replace(m[0], "").trim();
  return { tldr: inner, body };
}

/** 키워드 칩 라인 (`1️⃣ X  2️⃣ Y`) 추출 — <p> 태그에서 찾아 제거 */
function extractKeywords(html: string): { keywords: string[]; body: string } {
  // 숫자 이모지로 시작하는 <p> 태그 (예: <p>1️⃣ <code>FormData</code> 2️⃣ ...)
  const re = /<p>((?:(?:[\d]️⃣|[0-9️⃣]+)\s+.+?\s*)+)<\/p>/;
  const m = html.match(re);
  if (!m) return { keywords: [], body: html };
  // 칩 분리: 이모지 토큰으로 split
  const rawText = m[1];
  const chips = rawText
    .split(/(?=\d️⃣)/)
    .map((s) => s.replace(/<[^>]+>/g, "").trim())
    .filter(Boolean);
  const body = html.replace(m[0], "").trim();
  return { keywords: chips, body };
}

/** 난이도 라인 (`<p>난이도 : ★★★☆☆</p>`) 제거 — 헤더에서 표시하므로 */
function removeDifficultyLine(html: string): string {
  return html.replace(/<p>난이도\s*:\s*[★☆]+<\/p>\s*/g, "").trim();
}

// ── generateStaticParams ──────────────────────────────────────────────

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

// ── Page ─────────────────────────────────────────────────────────────

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const { prev, next } = adjacent(slug);

  // 본문 분리 파싱
  const { tldr, body: body1 } = extractTldr(post.html);
  const { keywords, body: body2 } = extractKeywords(body1);
  const bodyHtml = removeDifficultyLine(body2);

  const starsStr = stars(post.difficulty);
  const dateStr = fmtDate(post.date);
  const logStr = logNum(post.log);
  const category = post.categories[0] ?? "";

  return (
    <div className="post-wrap">
      {/* ── 포스트 헤더 ── */}
      <header className="post-head">
        <span
          className="lognum"
          data-testid="B-03-text-post-meta"
        >
          {logStr} · <span className="cat">{category}</span> · {dateStr} ·{" "}
          <span className="stars">난이도 {starsStr}</span>
        </span>

        <h1 data-testid="B-03-text-post-title">{post.title}</h1>

        {tldr && (
          <div className="tldr" data-testid="B-03-text-tldr">
            <span className="label">TL;DR</span>
            <span dangerouslySetInnerHTML={{ __html: tldr }} />
          </div>
        )}

        {keywords.length > 0 && (
          <div className="kw" data-testid="B-03-list-keywords">
            {keywords.map((kw, i) => (
              <span key={i}>{kw}</span>
            ))}
          </div>
        )}
      </header>

      {/* ── 본문 ── */}
      <article
        className="post-body"
        data-testid="B-03-text-body"
        dangerouslySetInnerHTML={{ __html: bodyHtml }}
      />

      {/* ── 태그 ── */}
      {post.tags.length > 0 && (
        <div data-testid="post-tags" className="post-tags">
          {post.tags.map((t) => (
            <Link key={t} href={`/tags/${tagSlug(t)}`} className="post-tag-chip">
              #{t}
            </Link>
          ))}
        </div>
      )}

      {/* ── 참고한 링크 래퍼 ── */}
      <div data-testid="B-03-list-refs" className="refs">
        <span className="label">참고한 링크</span>
        {post.source && (
          <ul>
            <li>
              <a href={post.source} target="_blank" rel="noopener noreferrer">
                원문 출처 (티스토리)
              </a>
            </li>
          </ul>
        )}
      </div>

      {/* ── 시리즈 내비 ── */}
      <nav className="series-nav" data-testid="B-03-nav-series" aria-label="글 내비게이션">
        {prev ? (
          <Link href={`/posts/${prev.slug}`} className="prev">
            <span className="dir">← 이전</span>
            <span className="t">{prev.title}</span>
          </Link>
        ) : (
          <span className="inactive">(이전 기록 없음)</span>
        )}
        {next ? (
          <Link href={`/posts/${next.slug}`} className="next">
            <span className="dir">다음 →</span>
            <span className="t">{next.title}</span>
          </Link>
        ) : (
          <span className="inactive">(다음 기록을 준비 중)</span>
        )}
      </nav>

      {/* ── giscus 자리표시 ── */}
      <div className="comments-placeholder">
        💬 댓글 기능은 준비 중입니다.
      </div>
    </div>
  );
}
