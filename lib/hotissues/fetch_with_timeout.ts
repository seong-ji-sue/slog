// 출처별 fetch가 무한정 대기하지 않도록 하는 공통 타임아웃 래퍼.
// 출처 실패 격리(TASK-BE-5 steps 4)의 기반 유틸 — 타임아웃도 "실패"로 취급되어 상위에서 격리된다.
export async function fetchWithTimeout(
  url: string,
  timeoutMs: number,
  init?: RequestInit
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}
