export default function HotIssueDetailLoading() {
  return (
    <main className="col hot-issues-page">
      <article className="hotissue-detail" data-testid="H-02-detail-skeleton" aria-hidden="true">
        <span className="skeleton-line skeleton-source" style={{ marginBottom: 16 }} />
        <span className="skeleton-line skeleton-title" style={{ height: 24, marginBottom: 16 }} />
        <span className="skeleton-line skeleton-snippet" style={{ height: 20, marginBottom: 8 }} />
        <span className="skeleton-line skeleton-snippet" style={{ height: 20, marginBottom: 8 }} />
        <span className="skeleton-line skeleton-snippet" style={{ width: "60%", height: 20 }} />
      </article>
    </main>
  );
}
