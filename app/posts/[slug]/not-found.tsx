import Link from "next/link";

export default function PostNotFound() {
  return (
    <div
      style={{
        maxWidth: 680,
        margin: "0 auto",
        padding: "80px 20px",
        textAlign: "center",
      }}
    >
      <p
        style={{
          fontFamily: "JetBrains Mono, monospace",
          fontSize: 13,
          color: "var(--sub)",
          marginBottom: 16,
        }}
      >
        404 — NOT FOUND
      </p>
      <h1
        style={{
          fontFamily: "Noto Serif KR, serif",
          fontWeight: 900,
          fontSize: 28,
          marginBottom: 24,
        }}
      >
        존재하지 않는 기록입니다.
      </h1>
      <Link
        href="/posts"
        style={{ color: "var(--pen)", textDecoration: "underline" }}
      >
        전체 글 목록으로 →
      </Link>
    </div>
  );
}
