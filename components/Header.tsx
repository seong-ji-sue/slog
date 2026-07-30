"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function Header() {
  const [isDark, setIsDark] = useState(false);

  // 마운트 시 저장된 테마 복원
  useEffect(() => {
    const saved = localStorage.getItem("slog-theme");
    if (saved === "dark") {
      setIsDark(true);
    }
  }, []);

  function toggleDark() {
    const next = !isDark;
    setIsDark(next);
    const root = document.documentElement;
    if (next) {
      root.setAttribute("data-theme", "dark");
      localStorage.setItem("slog-theme", "dark");
    } else {
      root.removeAttribute("data-theme");
      localStorage.setItem("slog-theme", "light");
    }
  }

  return (
    <header className="site">
      <div className="col">
        <Link href="/" data-testid="B-01-logo-slog" className="logo" aria-label="SLOG 홈으로">
          SLOG<span className="cursor">_</span>
        </Link>
        <nav className="menu" data-testid="B-01-nav-main" aria-label="주 내비게이션">
          <Link href="/posts">글</Link>
          <Link href="/tags">태그</Link>
          <Link href="/about">소개</Link>
          <a href="#">RSS</a>
        </nav>
        <button
          className="darkmode-toggle"
          data-testid="B-01-button-darkmode"
          aria-pressed={isDark}
          aria-label={isDark ? "라이트 모드로 전환" : "다크 모드로 전환"}
          onClick={toggleDark}
        >
          {isDark ? "LIGHT" : "DARK"}
        </button>
      </div>
    </header>
  );
}
