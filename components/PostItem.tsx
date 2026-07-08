import Link from "next/link";
import { PostMeta, fmtDate, logNum, stars } from "@/lib/format";

interface Props {
  post: PostMeta;
  /** 부모가 list-feed 등 testid를 감싸는 래퍼에 붙이는 경우 불필요하므로 선택 */
  testId?: string;
}

export default function PostItem({ post, testId }: Props) {
  const cat = post.categories[0] ?? "";
  return (
    <Link
      href={`/posts/${post.slug}`}
      className="post-item"
      data-testid={testId}
    >
      <span className="lognum">
        {logNum(post.log)}&nbsp;&nbsp;<span className="cat">{cat}</span>
      </span>
      <h2>
        <mark>{post.title}</mark>
      </h2>
      {post.description && <p className="desc">{post.description}</p>}
      <div className="meta">
        {fmtDate(post.date)}&nbsp;&nbsp;·&nbsp;&nbsp;난이도&nbsp;{stars(post.difficulty)}&nbsp;&nbsp;·&nbsp;&nbsp;{post.readingMin}&nbsp;min
      </div>
    </Link>
  );
}
