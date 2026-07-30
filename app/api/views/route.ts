import { NextRequest, NextResponse } from "next/server";
import { isKnownSlug } from "@/lib/posts";
import { incrementPostView } from "@/lib/db";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const slug = (body as { slug?: unknown } | null)?.slug;
  if (typeof slug !== "string" || slug === "") {
    return NextResponse.json({ error: "invalid slug" }, { status: 400 });
  }

  if (!isKnownSlug(slug)) {
    return NextResponse.json({ error: "unknown slug" }, { status: 404 });
  }

  try {
    await incrementPostView(slug);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    console.error("view increment failed", { slug, e });
    return NextResponse.json({ error: "failed to record view" }, { status: 500 });
  }
}
