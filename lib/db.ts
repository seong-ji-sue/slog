import { neon } from "@neondatabase/serverless";

function createSql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return neon(url);
}

let _sql: ReturnType<typeof createSql> | null = null;

export function getSql() {
  if (!_sql) _sql = createSql();
  return _sql;
}

export async function incrementPostView(slug: string): Promise<void> {
  const sql = getSql();
  await sql`
    INSERT INTO post_views (slug, count) VALUES (${slug}, 1)
    ON CONFLICT (slug) DO UPDATE SET count = post_views.count + 1
  `;
}

export async function getAllPostViewCounts(): Promise<Record<string, number>> {
  const sql = getSql();
  const rows = (await sql`SELECT slug, count FROM post_views`) as {
    slug: string;
    count: number;
  }[];
  return Object.fromEntries(rows.map((r) => [r.slug, r.count]));
}
