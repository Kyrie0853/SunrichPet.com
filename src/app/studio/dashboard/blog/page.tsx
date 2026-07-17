"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function StudioBlogPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("blog_posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    setPosts(data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  async function togglePublish(id: string, currentPublishedAt: string | null) {
    const newPublishedAt = currentPublishedAt ? null : new Date().toISOString();
    await fetch("/api/studio/blog/" + id, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published_at: newPublishedAt }),
    });
    load();
  }

  async function deletePost(id: string) {
    if (!confirm("确定删除这篇文章？")) return;
    await fetch("/api/studio/blog/" + id, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg md:text-xl font-semibold text-[#1f2937]">笔记管理</h1>
        <Link
          href="/studio/dashboard/blog/new"
          className="rounded-full bg-[#1a7f5a] px-4 py-2 text-[13px] font-medium text-white hover:bg-[#166b4b] min-h-[44px] flex items-center"
        >
          + 写新笔记
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-[#f3f4f6] overflow-hidden">
        {loading ? (
          <p className="py-12 text-center text-[#9ca3af]">加载中...</p>
        ) : posts.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-4xl mb-3">📝</p>
            <p className="text-[#9ca3af] text-[14px] mb-4">暂无笔记</p>
            <Link
              href="/studio/dashboard/blog/new"
              className="inline-block rounded-full bg-[#1a7f5a] px-5 py-2 text-[13px] font-medium text-white"
            >
              写第一篇笔记
            </Link>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-[#f3f4f6] bg-[#f9fafb]">
                  <th className="text-left px-3 md:px-4 py-3">标题</th>
                  <th className="text-left px-3 md:px-4 py-3 hidden sm:table-cell">标签</th>
                  <th className="text-left px-3 md:px-4 py-3">状态</th>
                  <th className="text-left px-3 md:px-4 py-3 hidden md:table-cell">时间</th>
                  <th className="text-right px-3 md:px-4 py-3">操作</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((p) => (
                  <tr key={p.id} className="border-b border-[#f3f4f6] hover:bg-[#f9fafb]">
                    <td className="px-3 md:px-4 py-3">
                      <div className="flex items-center gap-2">
                        {p.cover_image && (
                          <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0 hidden sm:block">
                            <img src={p.cover_image} className="w-full h-full object-cover" alt="" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium line-clamp-1">{p.title}</p>
                          <p className="text-[11px] text-[#9ca3af] line-clamp-1 hidden sm:block">{p.excerpt}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 md:px-4 py-3 hidden sm:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {(p.tags || []).slice(0, 3).map((tag: string) => (
                          <span key={tag} className="rounded-full bg-[#e8f5ef] px-2 py-0.5 text-[10px] text-[#1a7f5a]">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 md:px-4 py-3">
                      {p.published_at ? (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-600">
                          已发布
                        </span>
                      ) : (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-400">
                          草稿
                        </span>
                      )}
                    </td>
                    <td className="px-3 md:px-4 py-3 text-[#6b7280] hidden md:table-cell">
                      {new Date(p.created_at).toLocaleDateString("zh-CN")}
                    </td>
                    <td className="px-3 md:px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => togglePublish(p.id, p.published_at)}
                          className={`rounded-lg px-2 py-1.5 text-[11px] min-w-[44px] min-h-[44px] flex items-center justify-center ${
                            p.published_at
                              ? "text-[#f0a04b] hover:bg-orange-50"
                              : "text-[#1a7f5a] hover:bg-[#e8f5ef]"
                          }`}
                        >
                          {p.published_at ? "下架" : "发布"}
                        </button>
                        <Link
                          href={"/studio/dashboard/blog/" + p.id}
                          className="rounded-lg px-2 py-1.5 text-[11px] text-[#1a7f5a] hover:bg-[#e8f5ef] min-w-[44px] min-h-[44px] flex items-center justify-center"
                        >
                          编辑
                        </Link>
                        <button
                          onClick={() => deletePost(p.id)}
                          className="rounded-lg px-2 py-1.5 text-[11px] text-red-500 hover:bg-red-50 min-w-[44px] min-h-[44px]"
                        >
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
