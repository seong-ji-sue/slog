import { NextRequest, NextResponse } from "next/server";
import { collectHotIssues } from "@/lib/hotissues/collect";

// 출처별 요약 생성까지 포함한 배치 전체가 끝날 시간을 충분히 확보한다.
export const maxDuration = 300;

// Vercel Cron이 매일 1회 호출하는 배치 트리거 (TASK-BE-5).
// Vercel Cron이 요청에 붙이는 Authorization 헤더로 호출 주체를 검증한다.
// CRON_SECRET 미설정 시에도 항상 비교해 fail-closed로 동작한다(환경변수 누락이 곧 무방비 공개 엔드포인트가 되지 않도록).
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const results = await collectHotIssues();
    return NextResponse.json({ ok: true, results }, { status: 200 });
  } catch (e) {
    console.error("hot issues collect batch failed", e);
    return NextResponse.json({ error: "collect failed" }, { status: 500 });
  }
}
