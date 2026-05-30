import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import PostCard from "@/components/community/PostCard";
import BarActions from "./BarActions";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: bar } = await supabase.from("bars").select("name").eq("slug", slug).single();
  if (!bar) return { title: "吧未找到" };
  return { title: bar.name + "吧 — 顺瑞益宠" };
}

export default async function BarPage({ params, searchParams }: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string }>;
}) {
  const { slug } = await params;
  const { sort = "latest" } = await searchParams;
  const supabase = await createClient();

  const { data: bar } = await supabase.from("bars").select("*").eq("slug", slug).single();
  if (!bar) notFound();

  const { data: { user } } = await supabase.auth.getUser();
  let isMember = false;
  if (user) {
    const { data: m } = await supabase.from("bar_members").select("id").eq("bar_id", bar.id).eq("user_id", user.id).maybeSingle();
    isMember = !!m;
  }

  // 帖子查询
  let query = supabase.from("community_posts").select("*", { count: "estimated" }).eq("bar_id", bar.id);
  if (sort === "latest") query = query.order("is_pinned", { ascending: false }).order("created_at", { ascending: false });
  else if (sort === "hot") query = query.order("is_pinned", { ascending: false }).order("view_count", { ascending: false });
  query = query.range(0, 11);
  const { data: posts, count } = await query;

  // 批量获取作者
  let enriched: any[] = [];
  if (posts?.length) {
    const aIds = [...new Set(posts.map(p => p.author_id))];
    const { data: authors } = await supabase.from("profiles").select("id,display_name,avatar_url").in("id", aIds);
    const aMap = new Map((authors || []).map(a => [a.id, a]));
    enriched = await Promise.all(posts.map(async p => {
      const [lk, cm] = await Promise.all([
        supabase.from("community_likes").select("*", { count: "exact", head: true }).eq("post_id", p.id),
        supabase.from("community_comments").select("*", { count: "exact", head: true }).eq("post_id", p.id),
      ]);
      return { ...p, author: aMap.get(p.author_id) || null, like_count: (lk as any).count || 0, comment_count: (cm as any).count || 0 };
    }));
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link href="/b" className="mb-6 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-emerald-700">
        &larr; 全部吧
      </Link>

      {/* 吧头部 */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-4xl">
            {bar.icon || "🐾"}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{bar.name}吧</h1>
            <p className="mt-1 text-gray-500">{bar.description || "暂无简介"}</p>
            <div className="mt-3 flex items-center gap-4 text-sm text-gray-400">
              <span>👥 {bar.member_count || 0} 成员</span>
              <span>📝 {bar.post_count || 0} 帖子</span>
            </div>
          </div>
          <BarActions barId={bar.id} initialMember={isMember} userId={user?.id} />
        </div>
      </div>

      {/* 排序 + 发帖 */}
      <div className="mt-6 flex items-center justify-between">
        <div className="flex gap-2">
          {(["latest", "hot"] as const).map(s => (
            <Link
              key={s}
              href={`/b/${slug}?sort=${s}`}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                sort === s ? "bg-emerald-100 text-emerald-700" : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              {s === "latest" ? "最新" : "热门"}
            </Link>
          ))}
        </div>
        {isMember && (
          <Link
            href={`/community/new?bar=${bar.id}`}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            发布帖子
          </Link>
        )}
      </div>

      {/* 帖子列表 */}
      <div className="mt-4 space-y-3">
        {enriched.length === 0 && (
          <div className="py-16 text-center text-gray-400">
            <p className="text-4xl mb-3">📭</p>
            <p>该吧暂无帖子</p>
            {isMember && (
              <Link href={`/community/new?bar=${bar.id}`} className="mt-3 inline-block text-emerald-600 hover:underline">
                来发布第一个帖子吧
              </Link>
            )}
          </div>
        )}
        {enriched.map((post: any) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}
