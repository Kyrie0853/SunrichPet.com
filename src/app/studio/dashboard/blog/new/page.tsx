"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewBlogPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "", slug: "", content: "", excerpt: "",
    cover_image: "", tags: "", published_at: "",
  });

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.slug || !form.content) {
      setError("请填写标题、Slug 和正文"); return;
    }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/studio/blog", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title, slug: form.slug, content: form.content,
          excerpt: form.excerpt || form.content.slice(0, 160),
          cover_image: form.cover_image || null,
          tags: form.tags ? form.tags.split(",").map((t: string) => t.trim()).filter(Boolean) : [],
          published_at: form.published_at || null,
        }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error || "创建失败"); setLoading(false); return; }
      router.push("/studio/dashboard/blog"); router.refresh();
    } catch { setError("网络错误"); setLoading(false); }
  }

  return (
    <div>
      <h1 className="text-lg md:text-xl font-semibold text-[#1f2937] mb-6">写新笔记</h1>
      <form onSubmit={handleSubmit} className="max-w-2xl bg-white rounded-xl border border-[#f3f4f6] p-6 space-y-4">
        {error && <div className="rounded-lg bg-red-50 p-3 text-[13px] text-red-600">{error}</div>}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-[13px] font-medium text-[#4b5563] mb-1">标题 *</label>
            <input value={form.title} onChange={e => update("title", e.target.value)}
              placeholder="文章标题" className="w-full h-11 rounded-lg border px-3 text-[16px] outline-none focus:border-[#1a7f5a]" />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-[#4b5563] mb-1">Slug *</label>
            <input value={form.slug} onChange={e => update("slug", e.target.value)}
              placeholder="my-first-post" className="w-full h-11 rounded-lg border px-3 text-[16px] outline-none focus:border-[#1a7f5a]" />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-[#4b5563] mb-1">封面图 URL</label>
            <input value={form.cover_image} onChange={e => update("cover_image", e.target.value)}
              placeholder="https://..." className="w-full h-11 rounded-lg border px-3 text-[16px] outline-none focus:border-[#1a7f5a]" />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-[#4b5563] mb-1">标签（逗号分隔）</label>
            <input value={form.tags} onChange={e => update("tags", e.target.value)}
              placeholder="繁育,守宫,日常" className="w-full h-11 rounded-lg border px-3 text-[16px] outline-none focus:border-[#1a7f5a]" />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-[#4b5563] mb-1">发布时间（留空为草稿）</label>
            <input type="datetime-local" value={form.published_at} onChange={e => update("published_at", e.target.value)}
              className="w-full h-11 rounded-lg border px-3 text-[16px] outline-none focus:border-[#1a7f5a]" />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-[#4b5563] mb-1">摘要</label>
            <input value={form.excerpt} onChange={e => update("excerpt", e.target.value)}
              placeholder="留空则自动取正文前160字" className="w-full h-11 rounded-lg border px-3 text-[16px] outline-none focus:border-[#1a7f5a]" />
          </div>
        </div>

        <div>
          <label className="block text-[13px] font-medium text-[#4b5563] mb-1">正文 *（Markdown 格式）</label>
          <textarea value={form.content} onChange={e => update("content", e.target.value)}
            rows={16} placeholder="支持 Markdown 格式..."
            className="w-full rounded-lg border px-3 py-3 text-[14px] font-mono outline-none focus:border-[#1a7f5a] resize-y" />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => router.back()}
            className="flex-1 rounded-full border py-3 text-[14px] text-[#6b7280] hover:bg-[#f9fafb] min-h-[48px]">取消</button>
          <button type="submit" disabled={loading}
            className="flex-1 rounded-full bg-[#1a7f5a] py-3 text-[14px] font-semibold text-white hover:bg-[#166b4b] disabled:opacity-50 min-h-[48px]">
            {loading ? "保存中..." : "发布笔记"}
          </button>
        </div>
      </form>
    </div>
  );
}
