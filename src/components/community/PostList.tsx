"use client";

import { useState, useEffect } from "react";
import { CommunityPost, CATEGORY_LABELS, SortOption, SORT_OPTIONS, CommunityCategory } from "@/lib/supabase/community-types";
import PostCard from "@/components/community/PostCard";
import { createClient } from "@/lib/supabase/client";

export default function PostList({ initialPosts }: { initialPosts: CommunityPost[] }) {
  const [posts, setPosts] = useState<CommunityPost[]>(initialPosts);
  const [category, setCategory] = useState<CommunityCategory | "">("");
  const [sort, setSort] = useState<SortOption>("latest");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    if (category === "" && sort === "latest" && page === 1) {
      setPosts(initialPosts);
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      const selectQuery = [
        "*",
        "author:profiles!community_posts_author_id_fkey(id, display_name, avatar_url)",
        "tags:community_post_tags(tag:community_tags(id, name, slug, color))"
      ].join(", ");

      let query = supabase.from("community_posts").select(selectQuery);

      if (category) query = query.eq("category", category);

      if (sort === "latest") {
        query = query.order("is_pinned", { ascending: false }).order("created_at", { ascending: false });
      } else if (sort === "hot") {
        query = query.order("is_pinned", { ascending: false }).order("view_count", { ascending: false });
      } else if (sort === "trending") {
        const d = new Date(Date.now() - 7*24*60*60*1000).toISOString();
        query = query.gte("created_at", d).order("view_count", { ascending: false });
      }

      query = query.range((page-1)*12, page*12-1);
      const { data } = await query;
      if (!cancelled && data) {
        const enriched = await Promise.all(data.map(async (p: any) => {
          const [lk, cm] = await Promise.all([
            supabase.from("community_likes").select("*",{count:"exact",head:true}).eq("post_id",p.id),
            supabase.from("community_comments").select("*",{count:"exact",head:true}).eq("post_id",p.id),
          ]);
          return {...p, like_count: (lk as any).count||0, comment_count: (cm as any).count||0, tags:(p.tags||[]).map((t:any)=>t.tag).filter(Boolean)};
        }));
        setPosts(enriched as CommunityPost[]);
      }
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [category, sort, page, initialPosts, supabase]);

  return (
    <div>
      {/* 工具栏：分类 + 排序 */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        {/* 分类筛选 */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => { setCategory(""); setPage(1); }}
            className={"rounded-full px-3 py-1 text-sm font-medium transition " + (category === "" ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}
          >
            全部
          </button>
          {(Object.entries(CATEGORY_LABELS) as [CommunityCategory, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => { setCategory(key); setPage(1); }}
              className={"rounded-full px-3 py-1 text-sm font-medium transition " + (category === key ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}
            >
              {label}
            </button>
          ))}
        </div>

        {/* 排序 */}
        <div className="ml-auto flex gap-1.5">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { setSort(opt.value); setPage(1); }}
              className={"rounded-full px-3 py-1 text-sm font-medium transition " + (sort === opt.value ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 加载状态 */}
      {loading && (
        <div className="py-12 text-center text-gray-400">加载中...</div>
      )}

      {/* 空状态 */}
      {!loading && posts.length === 0 && (
        <div className="py-20 text-center">
          <p className="text-4xl text-gray-200">🐾</p>
          <p className="mt-4 text-gray-400">暂无帖子，来做第一个发帖的人吧</p>
        </div>
      )}

      {/* 帖子列表 */}
      {!loading && (
        <div className="grid gap-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}

      {/* 分页 */}
      {posts.length >= 12 && (
        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-40"
          >
            上一页
          </button>
          <span className="text-sm text-gray-400">第 {page} 页</span>
          <button
            onClick={() => setPage(page + 1)}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
}