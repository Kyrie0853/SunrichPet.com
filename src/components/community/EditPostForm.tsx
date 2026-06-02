"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { CommunityTag, PARENT_TABS, CommunityPost } from "@/lib/supabase/community-types";
import { createClient } from "@/lib/supabase/client";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export default function EditPostForm({ post }: { post: CommunityPost }) {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(post.title);
  const [content, setContent] = useState(post.content);
  const [category, setCategory] = useState<string>(post.category||"");
  const [tags, setTags] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>(post.tags.map(t => t.id));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Image state: existing URLs + new File objects with previews
  const [existingImages, setExistingImages] = useState<string[]>(post.images || []);
  const [deletedImages, setDeletedImages] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<{ file: File; preview: string }[]>([]);

  useEffect(() => { supabase.from("community_tags").select("*").order("name").then(({ data }) => { if (data) setTags(data); }); }, [supabase]);

  const toggleTag = (id: string) => { setSelectedTags(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]); };

  // Remove an existing image (mark for deletion)
  function removeExisting(url: string) {
    setDeletedImages(prev => [...prev, url]);
    setExistingImages(prev => prev.filter(u => u !== url));
  }

  // Remove a new (not-yet-uploaded) image
  function removeNewFile(index: number) {
    setNewFiles(prev => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  }

  // Handle file selection for new images
  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    const valid: { file: File; preview: string }[] = [];
    for (const f of files) {
      if (!ALLOWED_TYPES.includes(f.type)) { setError("仅支持 JPG、PNG、GIF、WebP 格式"); continue; }
      if (f.size > MAX_FILE_SIZE) { setError("单张图片最大 10MB"); continue; }
      valid.push({ file: f, preview: URL.createObjectURL(f) });
    }
    if (valid.length > 0) {
      setError("");
      setNewFiles(prev => [...prev, ...valid]);
    }
    // Reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // Upload a file to Supabase Storage
  async function uploadFile(file: File, userId: string): Promise<string | null> {
    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("community-images")
      .upload(fileName, file, { contentType: file.type });
    if (upErr) return null;
    const { data: urlData } = supabase.storage.from("community-images").getPublicUrl(fileName);
    return urlData.publicUrl;
  }

  // Extract path from Storage URL for deletion
  function storagePathFromUrl(url: string): string | null {
    try {
      const u = new URL(url);
      const parts = u.pathname.split("/");
      const bucketIdx = parts.indexOf("community-images");
      if (bucketIdx === -1) return null;
      return parts.slice(bucketIdx + 1).join("/");
    } catch { return null; }
  }

  async function handleSubmit(e: React.FormEvent) { e.preventDefault(); setError("");
    const hasTitle = title.trim().length > 0;
    const hasContent = content.trim().length > 0;
    const hasImages = existingImages.length > 0 || newFiles.length > 0;
    if (!hasTitle && !hasContent && !hasImages) { setError("请至少填写标题、内容或上传图片"); return; }
    if (hasTitle && title.trim().length < 2 && !hasContent && !hasImages) { setError("标题至少 2 个字"); return; }

    setSubmitting(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("请先登录"); setSubmitting(false); return; }

    // Delete removed images from Storage
    for (const url of deletedImages) {
      const path = storagePathFromUrl(url);
      if (path) { await supabase.storage.from("community-images").remove([path]); }
    }

    // Upload new images
    const newUrls: string[] = [];
    for (const nf of newFiles) {
      const url = await uploadFile(nf.file, user.id);
      if (url) newUrls.push(url);
    }
    if (newFiles.length > 0 && newUrls.length === 0) {
      setError("图片上传失败，请重试"); setSubmitting(false); return;
    }

    // Final images array
    const finalImages = [...existingImages, ...newUrls];

    // Update post
    const { error: updateErr } = await supabase.from("community_posts").update({
      title: title.trim(),
      content: content.trim(),
      category,
      images: finalImages,
    }).eq("id", post.id);

    if (updateErr) { setError("保存失败: " + updateErr.message); setSubmitting(false); return; }

    // Update tags
    await supabase.from("community_post_tags").delete().eq("post_id", post.id);
    if (selectedTags.length > 0) {
      await supabase.from("community_post_tags").insert(selectedTags.map(tagId => ({ post_id: post.id, tag_id: tagId })));
    }

    router.push("/community/post/" + post.id);
  }

  const totalImages = existingImages.length + newFiles.length;

  return (<form onSubmit={handleSubmit} className="space-y-6">
    <div>
      <label className="mb-2 block text-sm font-semibold text-gray-700">标题</label>
      <input type="text" value={title} onChange={e=>setTitle(e.target.value)} maxLength={200}
        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 outline-none focus:border-emerald-500" />
      <p className="mt-1 text-xs text-gray-400">{title.length}/200</p>
    </div>

    <div>
      <label className="mb-2 block text-sm font-semibold text-gray-700">分类</label>
      <select value={category} onChange={e=>setCategory(e.target.value as string)}
        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 outline-none focus:border-emerald-500">
        {PARENT_TABS.filter(t=>t.key).map((tab)=>(<option key={tab.key} value={tab.key}>{tab.label}</option>))}
      </select>
    </div>

    <div>
      <label className="mb-2 block text-sm font-semibold text-gray-700">内容</label>
      <textarea value={content} onChange={e=>setContent(e.target.value)} rows={10}
        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 outline-none focus:border-emerald-500 resize-y min-h-[120px]" />
      <p className="mt-1 text-xs text-gray-400">{content.length} 字（标题、内容、图片至少填一项）</p>
    </div>

    {/* Image management */}
    <div>
      <label className="mb-2 block text-sm font-semibold text-gray-700">
        图片 <span className="text-gray-400 font-normal text-xs">({totalImages} 张)</span>
      </label>

      {/* Image grid */}
      {totalImages > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
          {/* Existing images */}
          {existingImages.map((url, i) => (
            <div key={"e"+i} className="group relative aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-100">
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeExisting(url)}
                className="absolute top-1.5 right-1.5 w-8 h-8 flex items-center justify-center rounded-full bg-black/60 text-white hover:bg-red-500 transition-colors"
                aria-label="删除图片"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
          {/* New files (not yet uploaded) */}
          {newFiles.map((nf, i) => (
            <div key={"n"+i} className="group relative aspect-square rounded-xl overflow-hidden border-2 border-emerald-400 bg-gray-100">
              <img src={nf.preview} alt="" className="w-full h-full object-cover" />
              <span className="absolute top-1.5 left-1.5 rounded-full bg-emerald-500 text-white text-[10px] px-1.5 py-0.5 font-medium">新</span>
              <button
                type="button"
                onClick={() => removeNewFile(i)}
                className="absolute top-1.5 right-1.5 w-8 h-8 flex items-center justify-center rounded-full bg-black/60 text-white hover:bg-red-500 transition-colors"
                aria-label="移除图片"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add image button */}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="flex items-center gap-2 rounded-xl border-2 border-dashed border-gray-300 px-4 py-3 text-sm text-gray-500 hover:border-emerald-400 hover:text-emerald-600 transition-colors w-full justify-center min-h-[44px]"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        添加图片
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        multiple
        onChange={handleFiles}
        className="hidden"
      />
      <p className="mt-1 text-xs text-gray-400">JPG/PNG/GIF/WebP · 单张最大 10MB</p>
    </div>

    <div>
      <label className="mb-2 block text-sm font-semibold text-gray-700">标签</label>
      <div className="flex flex-wrap gap-2">{tags.map(tag=>(
        <button key={tag.id} type="button" onClick={()=>toggleTag(tag.id)}
          className={"rounded-full px-3 py-1 text-sm font-medium transition min-h-[32px] "+(selectedTags.includes(tag.id)?"bg-emerald-600 text-white":"bg-gray-100 text-gray-600 hover:bg-gray-200")}>
          {tag.name}
        </button>
      ))}</div>
    </div>

    {error && (<div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>)}

    <div className="flex gap-3 pt-2">
      <button type="submit" disabled={submitting}
        className="flex-1 rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50 min-h-[44px]">
        {submitting ? "保存中..." : "保存修改"}
      </button>
      <button type="button" onClick={()=>router.back()}
        className="rounded-xl border border-gray-200 px-6 py-3 font-medium text-gray-600 transition hover:bg-gray-50 min-h-[44px]">
        取消
      </button>
    </div>
  </form>);
}