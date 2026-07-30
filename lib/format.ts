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
  project?: string;
  scope?: ScopeValue;
  draft: boolean;
  readingMin: number;
}

export type ScopeValue = "company" | "personal" | "reference" | "research";

export interface ScopeTaxonomyEntry {
  value: ScopeValue;
  label: string;
}

export const SCOPE_TAXONOMY: ScopeTaxonomyEntry[] = [
  { value: "company", label: "회사 프로젝트" },
  { value: "personal", label: "개인 프로젝트" },
  { value: "reference", label: "참고자료" },
  { value: "research", label: "기술조사" },
];

export function scopeLabel(scope?: ScopeValue): string | undefined {
  if (!scope) return undefined;
  return SCOPE_TAXONOMY.find((s) => s.value === scope)?.label;
}

export interface ProjectTaxonomyEntry {
  value: string;
  label: string;
}

export const PROJECT_TAXONOMY: ProjectTaxonomyEntry[] = [
  { value: "유튜브-자막-요약", label: "유튜브 자막·요약" },
  { value: "ai-스킬-오케스트레이션", label: "AI 스킬 오케스트레이션" },
  { value: "autoit-자동화", label: "AutoIt 자동화" },
  { value: "ssh-key-관리", label: "SSH Key 관리" },
  { value: "윈도우-설정", label: "윈도우 설정" },
  { value: "aws-관리", label: "AWS 관리" },
  { value: "ai-블로그-자동관리", label: "AI 블로그 자동관리" },
];

export function projectLabel(project?: string): string | undefined {
  if (!project) return undefined;
  return PROJECT_TAXONOMY.find((p) => p.value === project)?.label ?? project;
}

export interface TagGraphNode {
  slug: string;
  name: string;
  count: number;
  x: number;
  y: number;
}

export interface TagGraphEdge {
  source: string;
  target: string;
  weight: number;
}

export interface TagGraph {
  nodes: TagGraphNode[];
  edges: TagGraphEdge[];
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
