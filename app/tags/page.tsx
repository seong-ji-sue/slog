import { getTagsList, getTagGraph } from "@/lib/posts";
import TagsView from "@/components/TagsView";
import "./tags.css";

export const metadata = { title: "태그 — SLOG" };

export default function TagsPage() {
  const tags = getTagsList();
  const graph = getTagGraph();

  return (
    <main className="col tags-page">
      <h1 className="page-title mono">태그</h1>
      <TagsView tags={tags} graph={graph} />
    </main>
  );
}
