"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import StarRating from "./StarRating";
import { createReview, deleteReview } from "@/app/actions/reviews";

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "刚刚"; if (m < 60) return m + "分钟前";
  const h = Math.floor(m / 60); if (h < 24) return h + "小时前";
  return Math.floor(h / 24) + "天前";
}

export default function ProductReviewSection({ productId, initialReviews, initialAvg, initialCount }: {
  productId: string;
  initialReviews: any[];
  initialAvg: number;
  initialCount: number;
}) {
  const [reviews, setReviews] = useState(initialReviews);
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => { supabase.auth.getUser().then(({ data }) => setCurrentUser(data.user)); }, []);

  async function loadReviews(f: string) {
    setFilter(f);
    const { getProductReviews } = await import("@/app/actions/reviews");
    const { reviews: r } = await getProductReviews(productId, { filter: f });
    setReviews(r);
  }

  async function handleSubmit() {
    if (!currentUser) return;
    if (!content.trim()) { setError("请输入评价内容"); return; }
    setSubmitting(true); setError("");
    const result = await createReview({ productId, rating, content });
    if (result.success) {
      setShowForm(false); setContent(""); setRating(5);
      loadReviews(filter);
    } else {
      setError(result.message);
    }
    setSubmitting(false);
  }

  async function handleDelete(reviewId: string) {
    if (!confirm("删除这条评价？")) return;
    await deleteReview(reviewId, productId);
    loadReviews(filter);
  }

  const filteredReviews = filter === "all" ? reviews : reviews.filter((r: any) => {
    if (filter === "good") return r.rating >= 4;
    if (filter === "medium") return r.rating === 3;
    if (filter === "bad") return r.rating <= 2;
    return true;
  });

  return (
    <div className="mt-10 border-t pt-10">
      <h2 className="text-xl font-bold text-gray-900">商品评价 ({initialCount})</h2>

      {/* 评分概览 */}
      <div className="mt-4 flex items-center gap-4 rounded-xl bg-amber-50 p-4">
        <div className="text-center">
          <div className="text-4xl font-bold text-amber-600">{initialAvg > 0 ? initialAvg.toFixed(1) : "-"}</div>
          <StarRating rating={Math.round(initialAvg)} readonly size="sm" />
          <div className="mt-1 text-xs text-gray-400">{initialCount} 条评价</div>
        </div>
        <div className="flex-1 flex flex-wrap gap-2">
          {[
            { key: "all", label: `全部 (${initialCount})` },
            { key: "good", label: "好评" },
            { key: "medium", label: "中评" },
            { key: "bad", label: "差评" },
          ].map(f => (
            <button key={f.key} onClick={() => loadReviews(f.key)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                filter === f.key ? "bg-amber-200 text-amber-800" : "bg-white text-gray-500 hover:bg-amber-100"
              }`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* 写评价按钮 */}
      {currentUser && !showForm && (
        <button onClick={() => setShowForm(true)}
          className="mt-4 rounded-lg border border-emerald-200 px-4 py-2 text-sm font-medium text-emerald-600 hover:bg-emerald-50">
          写评价
        </button>
      )}

      {/* 评价表单 */}
      {showForm && (
        <div className="mt-4 rounded-xl border border-gray-100 bg-white p-4">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-sm text-gray-600">评分：</span>
            <StarRating rating={rating} onRate={setRating} />
          </div>
          <textarea value={content} onChange={e => setContent(e.target.value)}
            placeholder="分享你的使用体验..." rows={3} maxLength={2000}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-emerald-500" />
          {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
          <div className="mt-2 flex gap-2 justify-end">
            <button onClick={() => { setShowForm(false); setError(""); }}
              className="rounded-lg px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100">取消</button>
            <button onClick={handleSubmit} disabled={submitting}
              className="rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
              {submitting ? "提交中..." : "提交评价"}
            </button>
          </div>
        </div>
      )}

      {/* 评价列表 */}
      <div className="mt-6 space-y-4">
        {filteredReviews.length === 0 && (
          <p className="py-8 text-center text-sm text-gray-400">暂无评价</p>
        )}
        {filteredReviews.map((review: any) => (
          <div key={review.id} className="rounded-xl border border-gray-100 bg-white p-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center text-xs font-bold text-amber-600">
                {(review.profile?.display_name || "U").charAt(0)}
              </div>
              <div>
                <span className="text-sm font-semibold text-gray-900">{review.profile?.display_name || "匿名"}</span>
                <StarRating rating={review.rating} readonly size="sm" />
              </div>
              <span className="ml-auto text-xs text-gray-400">{timeAgo(review.created_at)}</span>
            </div>
            {review.content && (
              <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">{review.content}</p>
            )}
            {review.images?.length > 0 && (
              <div className="mt-2 flex gap-2">
                {review.images.map((img: string, i: number) => (
                  <img key={i} src={img} alt="" className="h-16 w-16 rounded-lg object-cover" loading="lazy" />
                ))}
              </div>
            )}
            {currentUser?.id === review.user_id && (
              <button onClick={() => handleDelete(review.id)}
                className="mt-2 text-xs text-gray-400 hover:text-red-500">删除</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
