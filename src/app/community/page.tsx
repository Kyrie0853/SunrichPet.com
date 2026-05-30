import { getPosts } from "@/lib/supabase/community";
import PostList from "@/components/community/PostList";
import Link from "next/link";

export const metadata = {
  title: "宠物玩家社区 — Sunrich Pet",
  description: "宠物爱好者交流社区，分享饲养经验、晒宠展示、问答求助",
};

export default async function CommunityPage() {
  const { posts } = await getPosts({ sort: "latest" });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      {/* 头部 */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            宠物玩家社区
          </h1>
          <p className="mt-2 text-gray-500">
            分享饲养心得，展示爱宠日常，与全国宠友交流互动
          </p>
        </div>
        <Link
          href="/community/new"
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          发布帖子
        </Link>
      </div>

      <PostList initialPosts={posts} />
    </div>
  );
}