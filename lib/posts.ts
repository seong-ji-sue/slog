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

export type { PostMeta } from "./format";
export { stars, fmtDate, logNum } from "./format";
import type { PostMeta } from "./format";

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
