import Link from "next/link";
import { maxLog } from "@/lib/posts";

export default function HomePage() {
  const max = maxLog();

  return (
    <div className="col">
      {/* 히어로 */}
      <section className="hero" data-testid="B-01-hero-title">
        <h1>
          무엇이 될지 모르는<br />
          <mark>평범한 개발자</mark>의 기록
        </h1>
        <p className="bio" data-testid="B-01-text-bio">
          실무에서 만난 문제를 파고들어 적습니다. 삽질의 과정까지가 기록입니다.<br />
          React · TypeScript · Next.js를 주로 다루는 프론트엔드 개발자, Zibu.
        </p>
        <div className="stat" data-testid="B-01-text-stat">
          2021.12 — ing&nbsp;&nbsp;·&nbsp;&nbsp;
          <b>NO_{String(max).padStart(3, "0")}</b>까지 기록됨&nbsp;&nbsp;·&nbsp;&nbsp;주간 1회 목표
        </div>
        <Link href="/posts" className="hero-cta" data-testid="B-01-link-posts">
          글 전체 보기 →
        </Link>
      </section>
    </div>
  );
}
