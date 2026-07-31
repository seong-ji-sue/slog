import { getHotIssuesList, HOT_ISSUE_SOURCES } from "@/lib/hotIssues";
import HotIssuesFilter from "@/components/HotIssuesFilter";
import "./hot-issues.css";

export const metadata = { title: "핫이슈 — SLOG" };

// 새 이슈는 매일 1회 배치로만 들어오므로 자주 재검증할 필요는 없다.
export const revalidate = 300;

interface Props {
  searchParams: Promise<{ q?: string; source?: string; page?: string }>;
}

export default async function HotIssuesPage({ searchParams }: Props) {
  const sp = await searchParams;
  const page = sp.page ? Number(sp.page) : 1;

  let result = null;
  let loadError = false;
  try {
    result = await getHotIssuesList({ search: sp.q, source: sp.source, page });
  } catch (e) {
    console.error("failed to load hot issues list", e);
    loadError = true;
  }

  return (
    <main className="col hot-issues-page">
      <h1 className="page-title mono">핫이슈</h1>
      <HotIssuesFilter
        result={result}
        loadError={loadError}
        sources={HOT_ISSUE_SOURCES}
        query={sp.q ?? ""}
        activeSource={sp.source ?? "전체"}
      />
    </main>
  );
}
