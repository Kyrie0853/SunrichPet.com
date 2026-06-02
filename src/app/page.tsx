import { getHotPosts } from "@/lib/supabase/community";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Avatar from "@/components/Avatar";
import ReportButton from "@/components/ReportButton";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "顺瑞益宠 — 全国宠物玩家的聚集地",
  description: "加入你最爱的宠物社区，与同好交流分享养宠经验，发现你的宠物伙伴。",
};

export default async function HomePage() {
  const supabase = await createClient();
  const { posts } = await getHotPosts({ pageSize: 15 });

  // 动态拉取所有活跃社区用于标签云
  const { data: activeBars } = await supabase
    .from("bars")
    .select("slug, name, icon")
    .eq("is_active", true)
    .order("member_count", { ascending: false });

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
            🏘️ 探索社区
          </Link>
        </div>
      </div>

      {/* 平台担保标识 */}
      <div className="mb-4 rounded-xl border border-[#1a7f5a]/20 bg-[#e8f5ef] px-4 py-3 flex items-center gap-2.5 text-[13px] md:text-[14px]">
        <span className="text-lg shrink-0">🛡️</span>
        <span className="text-[#1a7f5a] font-medium">平台担保交易 · 收货验货后付款 · 保护动物禁止交易</span>
      </div>

      {/* 分类标签云 — 动态拉取活跃社区 */}
      <div className="mb-6 flex flex-wrap gap-2">
        <Link
          href="/"
          className="rounded-full px-4 py-1.5 text-[13px] font-medium transition-all duration-200 bg-[#1a7f5a] text-white"
        >
          全部
        </Link>
        {(activeBars || []).map((bar: any) => (
          <Link
            key={bar.slug}
            href={'/b/' + bar.slug}
            className="rounded-full px-4 py-1.5 text-[13px] font-medium transition-all duration-200 border border-[#d1d5db] text-[#6b7280] hover:border-[#1a7f5a] hover:text-[#1a7f5a]"
          >
            {bar.icon} {bar.name}
          </Link>
        ))}
      </div>

      {/* 帖子流 */}
      <div className="space-y-4">
        {posts.length === 0 && (
          <div className="py-16 text-center text-gray-400">
            <p className="text-4xl mb-3">📭</p>
            <p>还没有帖子，快来发布第一条吧</p>
          </div>
        )}

        {posts.map((post: any, i: number) => {
          const hasImage = post.images && post.images.length > 0;
          const firstImage = hasImage ? post.images[0] : null;
          const imgCount = post.images?.length || 0;
          return (
          <Link key={post.id} href={"/community/post/" + post.id} className={`card-interactive block rounded-xl bg-white animate-fade-in-up stagger-${Math.min(i + 1, 5)}`}>
            {/* Mobile: image on top */}
            {firstImage && (
              <div className="md:hidden w-full aspect-[16/9] overflow-hidden rounded-t-xl bg-gray-100">
                <img src={firstImage} alt={post.title} loading="lazy" className="w-full h-full object-cover" />
                {imgCount > 1 && <span className="absolute bottom-1.5 right-1.5 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">+{imgCount - 1}</span>}
              </div>
            )}

            {/* Desktop: left image + right content */}
            <div className="hidden md:flex">
              {firstImage && (
                <div className="relative w-[180px] shrink-0 overflow-hidden rounded-l-xl bg-gray-100">
                  <div className="aspect-square">
                    <img src={firstImage} alt={post.title} loading="lazy" className="w-full h-full object-cover" />
                    {imgCount > 1 && <span className="absolute bottom-1.5 right-1.5 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">+{imgCount - 1}</span>}
                  </div>
                </div>
              )}

              <div className={hasImage ? "p-5 flex-1 min-w-0" : "p-4 md:p-5"}>
                {/* 社区标签 */}
                {post.bar && (
                  <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-[#e8f5ef] px-2.5 py-0.5 text-[12px] font-medium text-[#1a7f5a]">
                    {post.bar.icon} {post.bar.name}
                  </span>
                )}

                <h2 className="text-[18px] font-semibold text-[#1f2937] line-clamp-1 group-hover:text-[#1a7f5a] transition-colors duration-200 leading-relaxed">
                  {post.is_pinned && "📌 "}{post.is_featured && "⭐ "}{post.title}
                </h2>
                {!hasImage && (
                  <p className="mt-1.5 text-[15px] text-[#6b7280] line-clamp-2 leading-relaxed">
                    {post.content ? post.content.replace(/<[^>]*>/g, "").substring(0, 100) : ''}
                  </p>
                )}

                {/* 底栏 */}
                <div className="mt-3 flex items-center gap-3 text-[13px] text-[#9ca3af]">
                  <div className="flex items-center gap-1.5">
                    <Avatar userId={post.author_id} avatarUrl={post.author?.avatar_url} displayName={post.author?.display_name} size={24} />
                    <span>{post.author?.display_name || "匿名"}</span>
                  </div>
                  <span className="text-[#e5e7eb]">·</span>
                  <span>{(() => { const d = (Date.now() - new Date(post.created_at).getTime()) / 60000; return d < 1 ? "刚刚" : d < 60 ? Math.floor(d) + "分钟前" : d < 1440 ? Math.floor(d / 60) + "小时前" : Math.floor(d / 1440) + "天前"; })()}</span>
                  <span className="ml-auto flex items-center gap-3">
                    <span className="flex items-center gap-1"><svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>{post.like_count}</span>
                    <span className="flex items-center gap-1"><svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>{post.comment_count}</span>
                    <ReportButton targetType="post" targetId={post.id} />
                  </span>
                </div>
              </div>
            </div>

            {/* Mobile: content below image */}
            <div className={"md:hidden " + (firstImage ? "p-3" : "p-4")}>
              {post.bar && (
                <span className="mb-1.5 inline-flex items-center gap-1 rounded-full bg-[#e8f5ef] px-2 py-0.5 text-[11px] font-medium text-[#1a7f5a]">
                  {post.bar.icon} {post.bar.name}
                </span>
              )}
              <h2 className="text-[15px] font-semibold text-[#1f2937] line-clamp-2 leading-snug">{post.is_pinned && "📌 "}{post.is_featured && "⭐ "}{post.title}</h2>
              <div className="mt-2 flex items-center gap-2 text-[12px] text-[#9ca3af]">
                <span>{post.author?.display_name || "匿名"}</span>
                <span>·</span>
                <span>{(() => { const d = (Date.now() - new Date(post.created_at).getTime()) / 60000; return d < 1 ? "刚刚" : d < 60 ? Math.floor(d) + "分钟前" : d < 1440 ? Math.floor(d / 60) + "小时前" : Math.floor(d / 1440) + "天前"; })()}</span>
                <span className="ml-auto flex items-center gap-2">
                  <span className="flex items-center gap-0.5"><svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>{post.like_count}</span>
                  <span className="flex items-center gap-0.5"><svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>{post.comment_count}</span>
                </span>
              </div>
            </div>
          </Link>
        );})}
      </div>
    </div>
  );
}