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
          const imgs = post.images || [];
          const hasImage = imgs.length > 0;
          const showImgs = imgs.slice(0, 3);
          const remaining = Math.max(0, imgs.length - 3);
          return (
          <Link key={post.id} href={"/community/post/" + post.id} className={`card-interactive block rounded-xl bg-white overflow-hidden animate-fade-in-up stagger-${Math.min(i + 1, 5)}`}>
            {/* Image grid — same layout as PostCard */}
            {hasImage && (
              <div className="w-full overflow-hidden rounded-t-xl bg-gray-100">
                {imgs.length === 1 && (
                  <div className="relative w-full aspect-[4/3] md:aspect-[16/9]">
                    <img src={showImgs[0]} alt={post.title} loading="lazy" className="w-full h-full object-cover" />
                  </div>
                )}
                {imgs.length === 2 && (
                  <div className="flex gap-0.5 h-[160px] md:h-[200px]">
                    {showImgs.map((url: string, j: number) => (
                      <div key={j} className="relative flex-1 overflow-hidden">
                        <img src={url} alt={post.title} loading="lazy" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
                {imgs.length >= 3 && (
                  <div className="flex gap-0.5 h-[180px] md:h-[220px]">
                    <div className="relative flex-[2] overflow-hidden">
                      <img src={showImgs[0]} alt={post.title} loading="lazy" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-[1] flex flex-col gap-0.5">
                      <div className="relative flex-1 overflow-hidden">
                        <img src={showImgs[1]} alt={post.title} loading="lazy" className="w-full h-full object-cover" />
                      </div>
                      <div className="relative flex-1 overflow-hidden">
                        <img src={showImgs[2]} alt={post.title} loading="lazy" className="w-full h-full object-cover" />
                        {remaining > 0 && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <span className="text-white font-bold text-xl">+{remaining}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className={hasImage ? "p-4" : "p-4 md:p-5"}>
              {post.bar && (
                <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-[#e8f5ef] px-2 py-0.5 text-[11px] md:text-[12px] font-medium text-[#1a7f5a]">
                  {post.bar.icon} {post.bar.name}
                </span>
              )}
              <h2 className="text-[15px] md:text-[18px] font-semibold text-[#1f2937] line-clamp-1 md:line-clamp-1 group-hover:text-[#1a7f5a] transition-colors">
                {post.is_pinned && "📌 "}{post.is_featured && "⭐ "}{post.title}
              </h2>
              {!hasImage && post.content && (
                <p className="mt-1 text-[13px] md:text-[15px] text-[#6b7280] line-clamp-2">{post.content.replace(/<[^>]*>/g, "").substring(0, 100)}</p>
              )}
              <div className="mt-3 flex items-center gap-2 md:gap-3 text-[12px] md:text-[13px] text-[#9ca3af]">
                <div className="flex items-center gap-1 md:gap-1.5">
                  <Avatar userId={post.author_id} avatarUrl={post.author?.avatar_url} displayName={post.author?.display_name} size={20} />
                  <span>{post.author?.display_name || "匿名"}</span>
                </div>
                <span className="text-[#e5e7eb]">·</span>
                <span>{(() => { const d = (Date.now() - new Date(post.created_at).getTime()) / 60000; return d < 1 ? "刚刚" : d < 60 ? Math.floor(d) + "分钟前" : d < 1440 ? Math.floor(d / 60) + "小时前" : Math.floor(d / 1440) + "天前"; })()}</span>
                <span className="ml-auto flex items-center gap-2 md:gap-3">
                  <span className="flex items-center gap-0.5"><svg className="h-3 w-3 md:h-3.5 md:w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>{post.like_count}</span>
                  <span className="flex items-center gap-0.5"><svg className="h-3 w-3 md:h-3.5 md:w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>{post.comment_count}</span>
                  <ReportButton targetType="post" targetId={post.id} />
                </span>
              </div>
            </div>
          </Link>
        );})}
      </div>
    </div>
  );
}