import { NextRequest, NextResponse } from "next/server";
import { collectHotIssues } from "@/lib/hotissues/collect";

// Vercel Cron이 매일 1회 호출하는 배치 트리거 (TASK-BE-5).
// CRON_SECRET이 설정된 환경에서는 Vercel Cron이 붙이는 Authorization 헤더로 호출 주체를 검증한다.
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  try {
    const results = await collectHotIssues();
    return NextResponse.json({ ok: true, results }, { status: 200 });
  } catch (e) {
    console.error("hot issues collect batch failed", e);
    return NextResponse.json({ error: "collect failed" }, { status: 500 });
  }
}
