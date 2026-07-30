"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { TagGraphEdge, TagGraphNode } from "@/lib/format";

interface Props {
  nodes: TagGraphNode[];
  edges: TagGraphEdge[];
}

const VIEWBOX = 1000;
// 라벨 상시 노출 기준 — count/maxCount 비율이 이 값 이상인 노드만 기본 라벨을 그린다.
// 나머지는 hover(active/neighbor)일 때만 라벨이 나타나 겹침을 줄인다.
const IMPORTANT_TAG_RATIO = 0.4;

export default function TagGraph({ nodes, edges }: Props) {
  const router = useRouter();
  const [active, setActive] = useState<string | null>(null);

  const neighbors = useMemo(() => {
    if (!active) return null;
    const set = new Set<string>([active]);
    for (const e of edges) {
      if (e.source === active) set.add(e.target);
      if (e.target === active) set.add(e.source);
    }
    return set;
  }, [active, edges]);

  const maxCount = Math.max(1, ...nodes.map((n) => n.count));

  function radiusOf(count: number): number {
    return 6 + (count / maxCount) * 14;
  }

  function goToTag(slug: string): void {
    router.push(`/tags/${slug}`);
  }

  return (
    <svg
      data-testid="tag-graph"
      className="tag-graph"
      viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
      role="img"
      aria-label="태그 관계 그래프"
    >
      <g className="tag-graph-edges">
        {edges.map((e) => {
          const a = nodes.find((n) => n.slug === e.source);
          const b = nodes.find((n) => n.slug === e.target);
          if (!a || !b) return null;
          const dimmed = neighbors ? !(neighbors.has(e.source) && neighbors.has(e.target)) : false;
          return (
            <line
              key={`${e.source}-${e.target}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              className={dimmed ? "tag-graph-edge dimmed" : "tag-graph-edge"}
              strokeWidth={Math.min(3, 0.5 + e.weight * 0.4)}
            />
          );
        })}
      </g>
      <g className="tag-graph-nodes">
        {nodes.map((n) => {
          const dimmed = neighbors ? !neighbors.has(n.slug) : false;
          const isImportant = n.count / maxCount >= IMPORTANT_TAG_RATIO;
          // hover 또는 키보드 포커스 중(neighbors 존재)이고 이 노드가 active/neighbor(dimmed===false)일 때만 추가로 라벨 노출
          const isFocusOrHoverActive = neighbors !== null && !dimmed;
          const showLabel = isImportant || isFocusOrHoverActive;
          return (
            <g
              key={n.slug}
              className={dimmed ? "tag-graph-node dimmed" : "tag-graph-node"}
              transform={`translate(${n.x} ${n.y})`}
              onMouseEnter={() => setActive(n.slug)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(n.slug)}
              onBlur={() => setActive(null)}
              onClick={() => goToTag(n.slug)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") goToTag(n.slug);
              }}
              tabIndex={0}
              role="link"
              aria-label={`${n.name} 태그 — 글 ${n.count}편`}
              data-testid="tag-graph-node"
            >
              <circle r={radiusOf(n.count)} />
              {showLabel && <text y={radiusOf(n.count) + 14}>{n.name}</text>}
            </g>
          );
        })}
      </g>
    </svg>
  );
}
