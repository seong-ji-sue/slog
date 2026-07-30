import Link from "next/link";
import { PostMeta, fmtDate, logNum, stars, projectLabel, scopeLabel } from "@/lib/format";

interface Props {
  post: PostMeta;
  /** 부모가 list-feed 등 testid를 감싸는 래퍼에 붙이는 경우 불필요하므로 선택 */
  testId?: string;
}

export default function PostItem({ post, testId }: Props) {
  const scope = scopeLabel(post.scope);
  const project = projectLabel(post.project);
  return (
    <div className="post-item" data-testid={testId}>
      <span className="lognum">
        {logNum(post.log)}&nbsp;&nbsp;
        {scope ? (
          <Link
            href={`/posts?scope=${encodeURIComponent(post.scope!)}`}
            className="cat"
            data-testid="post-scope-badge"
          >
            {scope}
          </Link>
        ) : (
          <span className="cat">{post.categories[0] ?? ""}</span>
        )}
        {project && (
          <>
            &nbsp;&nbsp;<span className="project-badge" data-testid="post-project-badge">{project}</span>
          </>
        )}
      </span>
      <Link href={`/posts/${post.slug}`} className="post-item-link">
        <h2>
          <mark>{post.title}</mark>
        </h2>
        {post.description && <p className="desc">{post.description}</p>}
        <div className="meta">
          {fmtDate(post.date)}&nbsp;&nbsp;·&nbsp;&nbsp;난이도&nbsp;{stars(post.difficulty)}&nbsp;&nbsp;·&nbsp;&nbsp;{post.readingMin}&nbsp;min
        </div>
      </Link>
    </div>
  );
}
