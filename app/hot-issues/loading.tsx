const SKELETON_COUNT = 4;

export default function HotIssuesLoading() {
  return (
    <main className="col hot-issues-page">
      <h1 className="page-title mono">핫이슈</h1>
      <div className="hotissue-list" data-testid="H-01-list-skeleton">
        {Array.from({ length: SKELETON_COUNT }, (_, i) => (
          <div key={i} className="hotissue-card hotissue-skeleton" aria-hidden="true">
            <span className="skeleton-line skeleton-source" />
            <span className="skeleton-line skeleton-title" />
            <span className="skeleton-line skeleton-snippet" />
          </div>
        ))}
      </div>
    </main>
  );
}
