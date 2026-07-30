import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import rehypeHighlight from "rehype-highlight";
import rehypeStringify from "rehype-stringify";

const POSTS_DIR = path.join(process.cwd(), "content", "posts");
const DRAFTS_DIR = path.join(process.cwd(), "content", "drafts");

export type { PostMeta, TagGraph, TagGraphNode, TagGraphEdge } from "./format";
export { stars, fmtDate, logNum, tagSlug, projectLabel, PROJECT_TAXONOMY } from "./format";
import { tagSlug } from "./format";
import type { PostMeta, TagGraph, TagGraphNode, TagGraphEdge } from "./format";

export interface Post extends PostMeta {
  html: string;
}

function toIso(v: unknown): string {
  if (v instanceof Date) return v.toISOString();
  return String(v ?? "");
}

function listFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith(".md"));
}

function parseFile(dir: string, file: string, draftDir: boolean): { meta: PostMeta; content: string } {
  const raw = fs.readFileSync(path.join(dir, file), "utf-8");
  const { data, content } = matter(raw);
  const body = content.trim();
  const meta: PostMeta = {
    slug: (data.slug as string) || file.replace(/\.md$/, ""),
    title: String(data.title ?? file),
    date: toIso(data.date),
    description: String(data.description ?? ""),
    categories: (data.categories as string[]) ?? [],
    tags: (data.tags as string[]) ?? [],
    difficulty: Number(data.difficulty ?? 0),
    log: Number(data.log ?? 0),
    series: data.series ? String(data.series) : undefined,
    source: data.source ? String(data.source) : undefined,
    project: data.project ? String(data.project) : undefined,
    draft: draftDir || Boolean(data.draft),
    readingMin: Math.max(1, Math.round(body.replace(/```[\s\S]*?```/g, "").length / 650)),
  };
  return { meta, content: body };
}

function collect(): { meta: PostMeta; content: string }[] {
  const includeDrafts = process.env.NODE_ENV !== "production";
  const entries = listFiles(POSTS_DIR).map((f) => parseFile(POSTS_DIR, f, false));
  if (includeDrafts) {
    entries.push(...listFiles(DRAFTS_DIR).map((f) => parseFile(DRAFTS_DIR, f, true)));
  }
  return entries
    .filter((e) => includeDrafts || !e.meta.draft)
    .sort((a, b) => (a.meta.date < b.meta.date ? 1 : -1));
}

export function getAllPosts(): PostMeta[] {
  return collect().map((e) => e.meta);
}

export async function getPost(slug: string): Promise<Post | null> {
  const entry = collect().find((e) => e.meta.slug === slug);
  if (!entry) return null;
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeSlug)
    .use(rehypeHighlight, { detect: false })
    .use(rehypeStringify)
    .process(entry.content);
  return { ...entry.meta, html: String(file) };
}

export function adjacent(slug: string): { prev: PostMeta | null; next: PostMeta | null } {
  const all = getAllPosts(); // date desc
  const i = all.findIndex((p) => p.slug === slug);
  if (i === -1) return { prev: null, next: null };
  return { prev: all[i + 1] ?? null, next: all[i - 1] ?? null };
}




export function maxLog(): number {
  const all = getAllPosts();
  if (all.length === 0) return 0;
  return Math.max(...all.map((p) => p.log));
}

export function getSeriesList(): { name: string; count: number; lastDate: string }[] {
  const all = getAllPosts();
  const map = new Map<string, { count: number; lastDate: string }>();
  for (const p of all) {
    if (!p.series) continue;
    const existing = map.get(p.series);
    if (!existing) {
      map.set(p.series, { count: 1, lastDate: p.date });
    } else {
      existing.count += 1;
      if (p.date > existing.lastDate) existing.lastDate = p.date;
    }
  }
  return Array.from(map.entries())
    .map(([name, v]) => ({ name, count: v.count, lastDate: v.lastDate }))
    .sort((a, b) => (a.lastDate < b.lastDate ? 1 : -1));
}

export function getSeriesPosts(name: string): PostMeta[] {
  return getAllPosts()
    .filter((p) => p.series === name)
    .sort((a, b) => (a.date < b.date ? -1 : 1)); // date 오름차순 = 1부부터
}

/**
 * 태그 목록 조회 계약 (PRD backend: {tag, postCount} 목록).
 * PRD의 `tag` = 아래 반환값의 `slug`(URL 식별자로도 재사용됨), `postCount` = `count`.
 * `name`은 목록 뷰 표시용 원본 표기(대소문자 보존)이며 PRD 계약 필드는 아니다.
 */
export function getTagsList(): { name: string; slug: string; count: number }[] {
  const all = getAllPosts();
  const map = new Map<string, { name: string; count: number }>();
  for (const p of all) {
    for (const tag of p.tags) {
      const slug = tagSlug(tag);
      const existing = map.get(slug);
      if (!existing) {
        map.set(slug, { name: tag, count: 1 });
      } else {
        existing.count += 1;
      }
    }
  }
  return Array.from(map.entries())
    .map(([slug, v]) => ({ slug, name: v.name, count: v.count }))
    .sort((a, b) => b.count - a.count);
}

export function getPostsByTag(slug: string): PostMeta[] {
  return getAllPosts()
    .filter((p) => p.tags.some((t) => tagSlug(t) === slug))
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

const GRAPH_SIZE = 1000;
const GRAPH_ITERATIONS = 300;
// 그래프 뷰는 관계 시각화 보조 뷰 — 전체 태그 목록은 목록 뷰(TagsView)가 이미 담당.
// count 상위 N개만 그래프에 포함해 노드 밀도를 줄이고 라벨 겹침 · 고립 노드 뭉침을 방지.
const GRAPH_MAX_NODES = 60;
// 중심으로 끌어당기는 약한 인력(gravity) 계수 — 노드-중심 거리에 비례.
// 반발력(idealDist^2/dist 스케일)과 균형을 맞춰 고립 노드가 경계에 쌓이지 않고 안쪽에 모이도록 조정한 값.
const GRAPH_GRAVITY_STRENGTH = 0.06;

/**
 * 태그 co-occurrence 그래프 — 노드=태그, 엣지=같은 글에 함께 쓰인 태그 쌍.
 * 레이아웃은 빌드 타임에 1회 계산되는 결정론적 force-directed 시뮬레이션(외부 라이브러리 미사용).
 * 노드는 count 상위 GRAPH_MAX_NODES개로 제한하고, 그중 co-occurrence 엣지가 없는
 * 고립 태그는 명시적으로 제외한다 — 전체 태그 목록은 목록 뷰가 담당한다.
 */
export function getTagGraph(): TagGraph {
  const all = getAllPosts();
  const tags = getTagsList().slice(0, GRAPH_MAX_NODES);
  const includedSlugs = new Set(tags.map((t) => t.slug));

  const edgeMap = new Map<string, TagGraphEdge>();
  for (const p of all) {
    const slugs = Array.from(new Set(p.tags.map((t) => tagSlug(t))))
      .filter((s) => includedSlugs.has(s))
      .sort();
    for (let i = 0; i < slugs.length; i++) {
      for (let j = i + 1; j < slugs.length; j++) {
        const key = `${slugs[i]}::${slugs[j]}`;
        const existing = edgeMap.get(key);
        if (existing) {
          existing.weight += 1;
        } else {
          edgeMap.set(key, { source: slugs[i], target: slugs[j], weight: 1 });
        }
      }
    }
  }

  // 고립 태그(co-occurrence 엣지가 없는 태그) 명시적 제외 — count 상위 컷과 별개로,
  // edgeMap에 한 번도 등장하지 않은 slug는 최종 그래프 노드에서 제외한다.
  const connectedSlugs = new Set<string>();
  for (const e of edgeMap.values()) {
    connectedSlugs.add(e.source);
    connectedSlugs.add(e.target);
  }
  const connectedTags = tags.filter((t) => connectedSlugs.has(t.slug));

  const nodes = layoutNodes(connectedTags, Array.from(edgeMap.values()));
  return { nodes, edges: Array.from(edgeMap.values()) };
}

function layoutNodes(
  tags: { slug: string; name: string; count: number }[],
  edges: TagGraphEdge[]
): TagGraphNode[] {
  const n = tags.length;
  const center = GRAPH_SIZE / 2;
  const radius = GRAPH_SIZE * 0.4;

  // 초기 배치: 원형(결정론적 — 빌드마다 동일 레이아웃)
  const pos = new Map<string, { x: number; y: number; vx: number; vy: number }>();
  tags.forEach((t, i) => {
    const angle = (2 * Math.PI * i) / n;
    pos.set(t.slug, {
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
      vx: 0,
      vy: 0,
    });
  });

  const idealDist = Math.sqrt((GRAPH_SIZE * GRAPH_SIZE) / Math.max(1, n));
  const indexOf = new Map(tags.map((t, i) => [t.slug, i]));

  for (let iter = 0; iter < GRAPH_ITERATIONS; iter++) {
    const temperature = GRAPH_SIZE * 0.05 * (1 - iter / GRAPH_ITERATIONS);
    const disp = tags.map(() => ({ dx: 0, dy: 0 }));

    // 반발력 (모든 쌍)
    for (let i = 0; i < n; i++) {
      const a = pos.get(tags[i].slug)!;
      for (let j = i + 1; j < n; j++) {
        const b = pos.get(tags[j].slug)!;
        let dx = a.x - b.x;
        let dy = a.y - b.y;
        let dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
        const force = (idealDist * idealDist) / dist;
        dx = (dx / dist) * force;
        dy = (dy / dist) * force;
        disp[i].dx += dx;
        disp[i].dy += dy;
        disp[j].dx -= dx;
        disp[j].dy -= dy;
      }
    }

    // 인력 (엣지 — 가중치가 클수록 더 가깝게)
    for (const e of edges) {
      const si = indexOf.get(e.source);
      const ti = indexOf.get(e.target);
      if (si === undefined || ti === undefined) continue;
      const a = pos.get(e.source)!;
      const b = pos.get(e.target)!;
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
      const force = (dist * dist) / idealDist / Math.sqrt(e.weight);
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      disp[si].dx -= fx;
      disp[si].dy -= fy;
      disp[ti].dx += fx;
      disp[ti].dy += fy;
    }

    // 중심 인력(gravity) — 반발력만 받는 고립 노드가 경계로 밀려나지 않도록 중심 쪽으로 약하게 당김
    tags.forEach((t, i) => {
      const p = pos.get(t.slug)!;
      disp[i].dx += (center - p.x) * GRAPH_GRAVITY_STRENGTH;
      disp[i].dy += (center - p.y) * GRAPH_GRAVITY_STRENGTH;
    });

    // 변위 적용 (temperature로 제한, 중심 근처로 clamp)
    tags.forEach((t, i) => {
      const p = pos.get(t.slug)!;
      const d = Math.sqrt(disp[i].dx * disp[i].dx + disp[i].dy * disp[i].dy) || 0.01;
      const limited = Math.min(d, temperature);
      p.x += (disp[i].dx / d) * limited;
      p.y += (disp[i].dy / d) * limited;
      p.x = Math.max(20, Math.min(GRAPH_SIZE - 20, p.x));
      p.y = Math.max(20, Math.min(GRAPH_SIZE - 20, p.y));
    });
  }

  return tags.map((t) => ({
    slug: t.slug,
    name: t.name,
    count: t.count,
    x: Math.round(pos.get(t.slug)!.x),
    y: Math.round(pos.get(t.slug)!.y),
  }));
}
