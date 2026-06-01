"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CommunityTag, PARENT_TABS } from "@/lib/supabase/community-types";
import { createClient } from "@/lib/supabase/client";
import PostingRulesModal from "@/components/PostingRulesModal";
import { useKeywordFilter } from "@/hooks/useKeywordFilter";

export default function NewPostPage() {
  const router = useRouter();
  const [showEditor, setShowEditor] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<string>("");
  const [images, setImages] = useState<File[]>([]);
  const [bars, setBars] = useState<any[]>([]);
  const [tags, setTags] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const supabase = createClient();
  const { filter: kwFilter, checkContent } = useKeywordFilter();
  const imagePreviews = images.map((f) => URL.createObjectURL(f));

  useEffect(() => {
    supabase.from("community_tags").select("*").order("name").then(({ data }) => {
      if (data) setTags(data);
    });
  }, [supabase]);


  const toggleTag = (id: string) => {
    setSelectedTags(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
  };


  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (title.trim().length < 2) { setError("标题至少 2 个字"); return; }
    if (content.trim().length < 10) { setError("内容至少 10 个字"); return; }

    // 关键词检查
    const combined = title + " " + content;
    const passed = await checkContent(combined);
    if (!passed) {
      setError(kwFilter.error);
      return;
    }
    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("请先登录"); setSubmitting(false); return; }
    const imageUrls: string[] = [];
    for (const file of images.slice(0, 5)) {
      if (file.size > 5 * 1024 * 1024) { setError("单张图片最大 5MB"); setSubmitting(false); return; }
      const ext = file.name.split(".").pop() || "jpg";
      const fileName = user.id + "/" + Date.now() + "-" + Math.random().toString(36).slice(2, 8) + "." + ext;
      const { error: upErr } = await supabase.storage.from("community-images").upload(fileName, file, { contentType: file.type });
      if (upErr) { setError("图片上传失败"); setSubmitting(false); return; }
      const { data: urlData } = supabase.storage.from("community-images").getPublicUrl(fileName);
      imageUrls.push(urlData.publicUrl);
    }
    const { data: inserted, error: createErr } = await supabase
      .from("community_posts")
      .insert({ author_id: user.id, title: title.trim(), content: content.trim(), category, images: imageUrls })
      .select("id")
      .single();

    if (createErr) {
      console.error("发帖 insert 失败:", createErr);
      setError("发帖失败: " + createErr.message);
      setSubmitting(false);
      return;
    }

    if (!inserted || !inserted.id) {
      console.error("发帖成功但未返回 id:", inserted);
      setError("发帖异常，请重试");
      setSubmitting(false);
      return;
    }

    if (selectedTags.length > 0) {
      await supabase.from("community_post_tags").insert(selectedTags.map(tagId => ({ post_id: inserted.id, tag_id: tagId })));
    }

    router.push("/community/post/" + inserted.id);
  }
  return (
    <>
      <PostingRulesModal onAccept={() => setShowEditor(true)} />

      {!showEditor ? (
        <div className="mx-auto max-w-3xl px-4 py-20 text-center">
          <p className="text-4xl mb-4">📝</p>
          <p className="text-[#9ca3af]">请先阅读并同意发帖规则</p>
        </div>
      ) : (
        <div className="mx-auto max-w-3xl px-4 py-10">
          <h1 className="mb-8 text-3xl font-bold text-gray-900">发布帖子</h1>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">标题</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="给你的帖子起个吸引人的标题..." maxLength={200}
                className={'w-full rounded-xl border px-4 py-3 text-gray-900 outline-none transition ' + (kwFilter.error ? 'keyword-violation' : 'border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100')} />
              {kwFilter.error && <p className="violation-hint">⚠️ {kwFilter.error}</p>}
              <p className="mt-1 text-xs text-gray-400">{title.length}/200</p>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">分类</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 outline-none transition focus:border-emerald-500">
                <option value="">选择分类</option>
                {bars.map((bar: any) => (
                  <option key={bar.slug} value={bar.slug}>{bar.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">内容</label>
              <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="分享你的养宠心得、经验、故事..." rows={10}
                className={'w-full rounded-xl border px-4 py-3 text-gray-900 outline-none transition ' + (kwFilter.error ? 'keyword-violation' : 'border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100')} />
              {kwFilter.error && <p className="violation-hint">⚠️ {kwFilter.error}</p>}
              <p className="mt-1 text-xs text-gray-400">{content.length} 字（至少 10 字）</p>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">标签（可选）</label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <button key={tag.id} type="button" onClick={() => toggleTag(tag.id)} className={"rounded-full px-3 py-1 text-sm font-medium transition " + (selectedTags.includes(tag.id) ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}>{tag.name}</button>
                ))}
              </div>
            </div>

            <div><label>图片</label><input type="file" accept="image/*" multiple onChange={(e)=>{setImages(Array.from(e.target.files||[]).slice(0,5))}} /></div>
            {imagePreviews.length > 0 && (<div className="mt-3 flex flex-wrap gap-2">{imagePreviews.map((url,i)=>(<img key={i} src={url} alt="preview" className="h-20 w-20 rounded-lg object-cover" />))}</div>)}
            {error && (<div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>)}
            <div className="flex gap-3">
              <button type="submit" disabled={submitting} className="rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50">{submitting?"发布中...":"发布帖子"}</button>
              <button type="button" onClick={()=>router.back()} className="rounded-xl border border-gray-200 px-6 py-3 font-medium text-gray-600 transition hover:bg-gray-50">取消</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
