import Link from "next/link";
import { getHotIssueById } from "@/lib/hotIssues";
import "../hot-issues.css";

interface Props {
  params: Promise<{ id: string }>;
}

function fmtCollectedDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

export default async function HotIssueDetailPage({ params }: Props) {
  const { id } = await params;

  let issue = null;
  try {
    issue = await getHotIssueById(id);
  } catch (e) {
    console.error("failed to load hot issue detail", { id, e });
    return (
      <main className="col hot-issues-page">
        <div className="hotissue-not-found">
          <p>이슈를 불러오지 못했습니다.</p>
          <Link href="/hot-issues">← 핫이슈 목록으로 돌아가기</Link>
        </div>
      </main>
    );
  }

  if (!issue) {
    return (
      <main className="col hot-issues-page">
        <div className="hotissue-not-found">
          <p data-testid="H-02-text-not-found">이슈를 찾을 수 없습니다.</p>
          <Link href="/hot-issues" data-testid="H-02-link-back-to-list">
            ← 핫이슈 목록으로 돌아가기
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="col hot-issues-page">
      <article className="hotissue-detail">
        <div className="hotissue-detail-meta">
          <span data-testid="H-02-text-source">{issue.source}</span>
          {" · "}
          <span data-testid="H-02-text-collected-date">{fmtCollectedDate(issue.collectedAt)}</span>
        </div>

        <h1 className="hotissue-detail-title" data-testid="H-02-text-title">
          {issue.title}
        </h1>

        {issue.summary ? (
          <p className="hotissue-detail-summary" data-testid="H-02-text-summary">
            {issue.summary}
          </p>
        ) : (
          <p className="hotissue-detail-summary-error" data-testid="H-02-text-summary-error">
            요약을 생성하지 못했습니다. 원문에서 확인해 주세요.
          </p>
        )}

        <a
          href={issue.originalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="hotissue-detail-link"
          data-testid="H-02-link-original"
        >
          원문 보기 →
        </a>
      </article>
    </main>
  );
}
