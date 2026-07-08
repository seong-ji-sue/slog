import Link from "next/link";
import { getSeriesList, fmtDate } from "@/lib/posts";
import "./series.css";

export const metadata = { title: "시리즈 — SLOG" };

export default function SeriesPage() {
  const series = getSeriesList();

  return (
    <main className="col series-page">
      <h1 className="page-title mono">시리즈</h1>

      <div data-testid="B-04-list-series" className="series-grid">
        {series.map((s) => (
          <Link
            key={s.name}
            href={`/series/${encodeURIComponent(s.name)}`}
            className="series-card"
          >
            <span className="series-name">{s.name}</span>
            <div className="series-meta mono">
              <span className="series-count">{s.count}편</span>
              <span className="series-sep">·</span>
              <span className="series-date">최근 {fmtDate(s.lastDate)}</span>
            </div>
          </Link>
        ))}
        {series.length === 0 && (
          <p className="no-series mono">시리즈가 없습니다.</p>
        )}
      </div>
    </main>
  );
}
