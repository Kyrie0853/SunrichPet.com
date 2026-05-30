import { getHotPosts } from "@/lib/supabase/community";
import Link from "next/link";
import PostCard from "@/components/community/PostCard";
import Avatar from "@/components/Avatar";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "顺瑞益宠 — 热门宠物社区",
  description: "全国宠友交流聚集地，热门饲养心得、晒宠展示、问答求助一站式浏览",
};

export default async function HomePage() {
  const { posts } = await getHotPosts({ pageSize: 15 });

  return (
    <div className="mx-auto max-w-5xl px-3 md:px-4 py-10">
      {/* 头部 Hero */}
      <div className="mb-8 rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 p-8 text-white">
        <h1 className="text-3xl font-bold tracking-tight">🔥 热门广场</h1>
        <p className="mt-2 text-emerald-100">全国宠友都在看的热门内容，发现精彩帖子</p>
        <div className="mt-4 flex items-center gap-3">
          <Link href="/community/new" className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            发布帖子
          </Link>
          <Link href="/b" className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-white/10">
            🏘️ 探索宠物吧
          </Link>
        </div>
      </div>

      {/* 帖子流 */}
      <div className="space-y-4">
        {posts.length === 0 && (
          <div className="py-16 text-center text-gray-400">
            <p className="text-4xl mb-3">📭</p>
            <p>还没有帖子，快来发布第一条吧</p>
          </div>
        )}

        {posts.map((post: any) => (
          <article key={post.id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:shadow-md">
            {/* 吧标签 */}
            {post.bar && (
              <Link href={"/b/" + post.bar.slug} className="mb-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 transition">
                {post.bar.icon} {post.bar.name}吧
              </Link>
            )}

            {/* 标题 + 内容 */}
            <Link href={"/community/post/" + post.id} className="block group">
              <h2 className="text-lg font-bold text-gray-900 line-clamp-1 group-hover:text-emerald-700 transition">
                {post.is_pinned && "📌 "}{post.is_featured && "⭐ "}{post.title}
              </h2>
              <p className="mt-1.5 text-sm text-gray-500 line-clamp-2">
                {post.content.replace(/<[^>]*>/g, "").substring(0, 200)}
              </p>
            </Link>

            {/* 底栏：作者 + 互动数据 + 热度 */}
            <div className="mt-4 flex items-center gap-3 text-xs text-gray-400">
              <Link href={"/community/user/" + post.author_id} className="flex items-center gap-1.5 hover:text-gray-700 transition shrink-0">
                <Avatar userId={post.author_id} avatarUrl={post.author?.avatar_url} displayName={post.author?.display_name} size={24} />
                <span>{post.author?.display_name || "匿名"}</span>
              </Link>
              <span>·</span>
              <span>{(() => { const d = (Date.now() - new Date(post.created_at).getTime()) / 60000; return d < 1 ? "刚刚" : d < 60 ? Math.floor(d) + "分钟前" : d < 1440 ? Math.floor(d / 60) + "小时前" : Math.floor(d / 1440) + "天前"; })()}</span>
              <span className="ml-auto flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                  {post.like_count}
                </span>
                <span className="flex items-center gap-1">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                  {post.comment_count}
                </span>
                {post.hot_score > 0 && (
                  <span className="flex items-center gap-1 text-amber-500 font-medium">
                    🔥 {post.hot_score}
                  </span>
                )}
              </span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}