"use client";

import { useEffect } from "react";

interface Props {
  slug: string;
}

export default function ViewTracker({ slug }: Props) {
  useEffect(() => {
    fetch("/api/views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
    }).catch((e) => console.error("view tracking failed", { slug, e }));
  }, [slug]);

  return null;
}
