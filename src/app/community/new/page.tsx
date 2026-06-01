"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import PostingRulesModal from "@/components/PostingRulesModal";
import { useKeywordFilter } from "@/hooks/useKeywordFilter";

const LAST_BAR_KEY = 'last_selected_bar_id';

export default function NewPostPage() {
  const router = useRouter();
  const [showEditor, setShowEditor] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [barId, setBarId] = useState<string>("");
  const [images, setImages] = useState<File[]>([]);
  const [bars, setBars] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const supabase = createClient();
  const { filter: kwFilter, checkContent } = useKeywordFilter();
  const imagePreviews = images.map((f) => URL.createObjectURL(f));

  useEffect(() => {
    supabase.from("bars").select("id,name,slug,icon").eq("is_active", true).order("name").then(({ data }) => {
      if (data && data.length > 0) {
        setBars(data);
        // 默认选中上次使用的社区
        const lastId = localStorage.getItem(LAST_BAR_KEY);
        if (lastId && data.find((b: any) => b.id === lastId)) {
          setBarId(lastId);
        }
      }
    });
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // 社区必选
    if (!barId) { setError("请选择发布到的社区"); return; }

    // 标题、内容、图片至少填一项
    const hasTitle = title.trim().length > 0;
    const hasContent = content.trim().length > 0;
    const hasImages = images.length > 0;
    if (!hasTitle && !hasContent && !hasImages) {
      setError("请输入标题、内容或上传图片（至少一项）");
      return;
    }

    // 自动生成标题
    let finalTitle = title.trim();
    if (!finalTitle && hasContent) {
      finalTitle = content.trim().replace(/<[^>]*>/g, "").substring(0, 20);
    }
    if (!finalTitle && hasImages) {
      finalTitle = "📷 分享图片";
    }

    // 关键词检查
    const combined = finalTitle + " " + content;
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
      .insert({
        author_id: user.id,
        title: finalTitle,
        content: content.trim(),
        bar_id: barId,
        images: imageUrls,
      })
      .select("id")
      .single();

    if (createErr) {
      setError("发帖失败: " + createErr.message);
      setSubmitting(false);
      return;
    }

    // 记住选择的社区
    localStorage.setItem(LAST_BAR_KEY, barId);

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
        <div className="mx-auto max-w-3xl px-4 py-6 md:py-10">
          <h1 className="mb-6 text-2xl md:text-3xl font-bold text-gray-900">发布帖子</h1>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 选择社区 — 必选，放在最顶部 */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                发布到社区 <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {bars.map((bar: any) => (
                  <button
                    key={bar.id}
                    type="button"
                    onClick={() => setBarId(bar.id)}
                    className={'flex items-center gap-2 rounded-xl border px-4 py-3 text-[14px] font-medium transition-all ' +
                      (barId === bar.id
                        ? 'border-[#1a7f5a] bg-[#e8f5ef] text-[#1a7f5a]'
                        : 'border-gray-200 text-[#6b7280] hover:border-[#1a7f5a]')}
                  >
                    <span className="text-lg">{bar.icon || '🐾'}</span>
                    <span className="truncate">{bar.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 标题 — 选填 */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">标题（选填）</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="给你的帖子起个标题..." maxLength={200}
                className={'w-full rounded-xl border px-4 py-3 text-gray-900 outline-none transition ' +
                  (kwFilter.error ? 'keyword-violation' : 'border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100')} />
              {kwFilter.error && <p className="violation-hint">⚠️ {kwFilter.error}</p>}
            </div>

            {/* 内容 — 选填 */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">内容（选填）</label>
              <textarea value={content} onChange={(e) => setContent(e.target.value)}
                placeholder="分享你的养宠心得、经验、故事..." rows={8}
                className={'w-full rounded-xl border px-4 py-3 text-gray-900 outline-none transition resize-none ' +
                  (kwFilter.error ? 'keyword-violation' : 'border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100')} />
            </div>

            {/* 图片 — 选填 */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">图片（选填，最多5张）</label>
              <input type="file" accept="image/*" multiple
                onChange={(e) => { setImages(Array.from(e.target.files || []).slice(0, 5)); }}
                className="w-full text-[13px] text-gray-500 file:mr-4 file:rounded-full file:border-0 file:bg-[#e8f5ef] file:px-4 file:py-2 file:text-[13px] file:font-medium file:text-[#1a7f5a]" />
              {imagePreviews.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {imagePreviews.map((url, i) => (
                    <img key={i} src={url} alt="preview" className="h-20 w-20 rounded-lg object-cover" />
                  ))}
                </div>
              )}
            </div>

            {/* 底部提示 */}
            <p className="text-[12px] text-[#9ca3af] text-center">💡 标题、内容、图片至少填一项即可发布</p>

            {error && (<div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>)}

            <div className="flex gap-3">
              <button type="submit" disabled={submitting}
                className="flex-1 rounded-full bg-[#1a7f5a] py-3 text-[15px] font-semibold text-white transition hover:bg-[#166b4b] disabled:opacity-50 min-h-[44px]">
                {submitting ? "发布中..." : "发布帖子"}
              </button>
              <button type="button" onClick={() => router.back()}
                className="rounded-full border border-gray-200 px-6 py-3 text-[15px] font-medium text-gray-600 transition hover:bg-gray-50 min-h-[44px]">
                取消
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
