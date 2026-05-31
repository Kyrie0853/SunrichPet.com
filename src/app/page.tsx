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
      <div className="mb-8 rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 p-6 md:p-8 text-white">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">🔥 热门广场</h1>
        <p className="mt-2 text-emerald-100/90 text-[15px]">全国宠友都在看的热门内容，发现精彩帖子</p>
        <div className="mt-4 flex items-center gap-3">
          <Link href="/community/new" className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-[13px] font-medium text-[#1a7f5a] transition-all duration-200 hover:bg-emerald-50 active:scale-[0.97]">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            发布帖子
          </Link>
          <Link href="/b" className="inline-flex items-center gap-2 rounded-full border border-white/30 px-5 py-2.5 text-[13px] font-medium text-white transition-all duration-200 hover:bg-white/10 active:scale-[0.97]">
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

        {posts.map((post: any, i: number) => (
          <article key={post.id} className={`card-interactive rounded-xl bg-white p-4 md:p-5 animate-fade-in-up stagger-${Math.min(i + 1, 5)}`}>
            {/* 吧标签 */}
            {post.bar && (
              <Link href={"/b/" + post.bar.slug} className="mb-2.5 inline-flex items-center gap-1 rounded-full bg-[#e8f5ef] px-2.5 py-0.5 text-[12px] font-medium text-[#1a7f5a] hover:bg-emerald-100 transition-colors duration-200">
                {post.bar.icon} {post.bar.name}吧
              </Link>
            )}

            {/* 标题 + 内容 */}
            <Link href={"/community/post/" + post.id} className="block group">
              <h2 className="text-[18px] font-semibold text-[#1f2937] line-clamp-1 group-hover:text-[#1a7f5a] transition-colors duration-200 leading-relaxed">
                {post.is_pinned && "📌 "}{post.is_featured && "⭐ "}{post.title}
              </h2>
              <p className="mt-1.5 text-[15px] text-[#6b7280] line-clamp-2 leading-relaxed">
                {post.content.replace(/<[^>]*>/g, "").substring(0, 200)}
              </p>
            </Link>

            {/* 底栏 */}
            <div className="mt-4 flex items-center gap-3 text-[13px] text-[#9ca3af]">
              <Link href={"/community/user/" + post.author_id} className="flex items-center gap-1.5 hover:text-[#1f2937] transition-colors duration-200 shrink-0">
                <Avatar userId={post.author_id} avatarUrl={post.author?.avatar_url} displayName={post.author?.display_name} size={24} />
                <span>{post.author?.display_name || "匿名"}</span>
              </Link>
              <span className="text-[#e5e7eb]">·</span>
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
                  <span className="flex items-center gap-1 text-[#f0a04b] font-medium">
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