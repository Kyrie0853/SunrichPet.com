"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function timeAgo(d: string) { const diff = Date.now() - new Date(d).getTime(); const m = Math.floor(diff / 60000); if (m < 1) return "刚刚"; if (m < 60) return m + "分钟前"; const h = Math.floor(m / 60); if (h < 24) return h + "小时前"; return Math.floor(h / 24) + "天前"; }

function Stars({ rating, editable, onChange }: { rating: number; editable?: boolean; onChange?: (r: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <button key={i} type="button" disabled={!editable}
          onClick={() => onChange?.(i)}
          className={"text-lg transition " + (editable ? "cursor-pointer hover:scale-110" : "")}>
          {i <= rating ? "★" : "☆"}
        </button>
      ))}
    </div>
  );
}

export default function ReviewSection({ sellerId, reviews, currentUserId, hasReviewed }: { sellerId: string; reviews: any[]; currentUserId: string | null; hasReviewed: boolean }) {
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  async function submitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) { setError("请输入评价内容"); return; }
    setSubmitting(true);
    const { error: insErr } = await supabase.from("seller_reviews").insert({
      seller_id: sellerId, buyer_id: currentUserId, rating, content: content.trim()
    });
    if (insErr) { setError(insErr.message.includes("duplicate") ? "您已经评价过该商家" : "提交失败"); setSubmitting(false); return; }
    router.refresh();
  }

  return (
    <div>
      {currentUserId && currentUserId !== sellerId && !hasReviewed && (
        <div className="mb-6">
          {!showForm ? (
            <button onClick={() => setShowForm(true)} className="rounded-xl border border-dashed border-gray-300 px-5 py-3 text-sm text-gray-500 transition hover:border-emerald-400 hover:text-emerald-600">
              ✍️ 写评价
            </button>
          ) : (
            <form onSubmit={submitReview} className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-sm text-gray-600">评分：</span>
                <Stars rating={rating} editable onChange={setRating} />
              </div>
              <textarea value={content} onChange={e => setContent(e.target.value)}
                placeholder="分享你的交易体验..." maxLength={500} rows={3}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-400" />
              {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
              <div className="mt-3 flex gap-2">
                <button type="submit" disabled={submitting} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
                  {submitting ? "提交中..." : "提交评价"}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-500 hover:bg-gray-50">取消</button>
              </div>
            </form>
          )}
        </div>
      )}
      {reviews.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400">暂无评价</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((r: any) => (
            <div key={r.id} className="rounded-xl border border-gray-100 bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-emerald-100 flex items-center justify-center text-sm font-bold text-emerald-600">
                  {r.buyer?.display_name?.charAt(0) || "U"}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">{r.buyer?.display_name || "匿名"}</p>
                  <div className="flex items-center gap-2">
                    <Stars rating={r.rating} />
                    <span className="text-xs text-gray-400">{timeAgo(r.created_at)}</span>
                  </div>
                </div>
              </div>
              <p className="mt-2 text-sm text-gray-700">{r.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
