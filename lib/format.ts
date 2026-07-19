// 클라이언트에서도 쓰는 순수 헬퍼·타입 — node 모듈 import 금지 (lib/posts.ts는 서버 전용)

export interface PostMeta {
  slug: string;
  title: string;
  date: string; // ISO
  description: string;
  categories: string[];
  tags: string[];
  difficulty: number;
  log: number;
  series?: string;
  source?: string;
  draft: boolean;
  readingMin: number;
}

export function stars(d: number): string {
  const n = Math.min(5, Math.max(0, d));
  return "★".repeat(n) + "☆".repeat(5 - n);
}

export function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso.slice(0, 10).replace(/-/g, ".");
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

export function logNum(n: number): string {
  return `LOG_${String(n).padStart(3, "0")}`;
}

export function tagSlug(tag: string): string {
  return tag
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
