"use client";

import Link from "next/link";
import { useState } from "react";
import type { TagGraph } from "@/lib/format";
import TagGraphSvg from "@/components/TagGraph";

interface Props {
  tags: { slug: string; name: string; count: number }[];
  graph: TagGraph;
}

type ViewMode = "list" | "graph";

export default function TagsView({ tags, graph }: Props) {
  const [view, setView] = useState<ViewMode>("list");

  return (
    <>
      <div className="tags-view-toggle" data-testid="B-06-tab-view-toggle" role="group" aria-label="태그 뷰 전환">
        <button
          type="button"
          className={view === "list" ? "view-btn active" : "view-btn"}
          aria-pressed={view === "list"}
          data-testid="tags-view-list-btn"
          onClick={() => setView("list")}
        >
          목록 뷰
        </button>
        <button
          type="button"
          className={view === "graph" ? "view-btn active" : "view-btn"}
          aria-pressed={view === "graph"}
          data-testid="tags-view-graph-btn"
          onClick={() => setView("graph")}
        >
          그래프 뷰
        </button>
      </div>

      {view === "list" ? (
        <div data-testid="B-06-list-tags" className="tags-cloud">
          {tags.map((t) => (
            <Link key={t.slug} href={`/tags/${t.slug}`} className="tag-chip">
              <span className="tag-chip-name">{t.name}</span>
              <span className="tag-chip-count mono">({t.count})</span>
            </Link>
          ))}
          {tags.length === 0 && <p className="no-tags mono">태그가 없습니다.</p>}
        </div>
      ) : (
        <div data-testid="B-06-list-graph" className="tags-graph-wrap">
          <TagGraphSvg nodes={graph.nodes} edges={graph.edges} />
        </div>
      )}
    </>
  );
}
