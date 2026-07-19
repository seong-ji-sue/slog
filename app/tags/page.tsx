import Link from "next/link";
import { getTagsList } from "@/lib/posts";
import "./tags.css";

export const metadata = { title: "태그 — SLOG" };

export default function TagsPage() {
  const tags = getTagsList();

  return (
    <main className="col tags-page">
      <h1 className="page-title mono">태그</h1>

      <div data-testid="tags-list" className="tags-cloud">
        {tags.map((t) => (
          <Link key={t.slug} href={`/tags/${t.slug}`} className="tag-chip">
            <span className="tag-chip-name">{t.name}</span>
            <span className="tag-chip-count mono">({t.count})</span>
          </Link>
        ))}
        {tags.length === 0 && <p className="no-tags mono">태그가 없습니다.</p>}
      </div>
    </main>
  );
}
