import type { HotIssueSourceName } from "./constants";

// 출처 fetcher가 반환하는, 아직 저장되지 않은 원시 수집 항목
export interface RawHotIssue {
  title: string;
  source: HotIssueSourceName;
  originalUrl: string;
  // 요약 생성 입력으로 쓰이는 짧은 본문 발췌 — 원문 전체 크롤링은 하지 않는다.
  excerpt: string;
}

// 배치 1회 실행에 대한 출처별 결과 요약 (관측/로그용 — DB 스키마와 무관)
export interface HotIssueSourceRunResult {
  source: HotIssueSourceName;
  fetched: number;
  inserted: number;
  skippedDuplicate: number;
  failed: boolean;
  error?: string;
}
