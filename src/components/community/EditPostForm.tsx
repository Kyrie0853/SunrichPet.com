"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CommunityTag, PARENT_TABS, CommunityPost } from "@/lib/supabase/community-types";
import { createClient } from "@/lib/supabase/client";

export default function EditPostForm({ post }: { post: CommunityPost }) {
  const router = useRouter();
  const [title, setTitle] = useState(post.title);
  const [content, setContent] = useState(post.content);
  const [category, setCategory] = useState<string>(post.category||"");
  const [tags, setTags] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>(post.tags.map(t => t.id));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const supabase = createClient();

  useEffect(() => { supabase.from("community_tags").select("*").order("name").then(({ data }) => { if (data) setTags(data); }); }, [supabase]);

  const toggleTag = (id: string) => { setSelectedTags(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]); };

  async function handleSubmit(e: React.FormEvent) { e.preventDefault(); setError("");
    if (title.trim().length < 2) { setError("标题至少 2 个字"); return; }
    if (content.trim().length < 10) { setError("内容至少 10 个字"); return; }
    setSubmitting(true);
    const { error: updateErr } = await supabase.from("community_posts").update({ title: title.trim(), content: content.trim(), category }).eq("id", post.id);
    if (updateErr) { setError("保存失败: " + updateErr.message); setSubmitting(false); return; }
    // 更新标签：先删后插
    await supabase.from("community_post_tags").delete().eq("post_id", post.id);
    if (selectedTags.length > 0) { await supabase.from("community_post_tags").insert(selectedTags.map(tagId => ({ post_id: post.id, tag_id: tagId }))); }
    router.push("/community/post/" + post.id);
  }

  return (<form onSubmit={handleSubmit} className="space-y-6">
    <div><label className="mb-2 block text-sm font-semibold text-gray-700">标题</label><input type="text" value={title} onChange={e=>setTitle(e.target.value)} maxLength={200} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 outline-none focus:border-emerald-500" /><p className="mt-1 text-xs text-gray-400">{title.length}/200</p></div>
    <div><label className="mb-2 block text-sm font-semibold text-gray-700">分类</label><select value={category} onChange={e=>setCategory(e.target.value as string)} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 outline-none focus:border-emerald-500">{(PARENT_TABS.filter(t=>t.key)).map((tab)=>(<option key={tab.key} value={tab.key}>{tab.label}</option>))}</select></div>
    <div><label className="mb-2 block text-sm font-semibold text-gray-700">内容</label><textarea value={content} onChange={e=>setContent(e.target.value)} rows={10} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 outline-none focus:border-emerald-500" /><p className="mt-1 text-xs text-gray-400">{content.length} 字</p></div>
    <div><label className="mb-2 block text-sm font-semibold text-gray-700">标签</label><div className="flex flex-wrap gap-2">{tags.map(tag=>(<button key={tag.id} type="button" onClick={()=>toggleTag(tag.id)} className={"rounded-full px-3 py-1 text-sm font-medium transition "+(selectedTags.includes(tag.id)?"bg-emerald-600 text-white":"bg-gray-100 text-gray-600 hover:bg-gray-200")}>{tag.name}</button>))}</div></div>
    {error && (<div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>)}
    <div className="flex gap-3"><button type="submit" disabled={submitting} className="rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50">{submitting?"保存中...":"保存修改"}</button><button type="button" onClick={()=>router.back()} className="rounded-xl border border-gray-200 px-6 py-3 font-medium text-gray-600 transition hover:bg-gray-50">取消</button></div>
  </form>);
}