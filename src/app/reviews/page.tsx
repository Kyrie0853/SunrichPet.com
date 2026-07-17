import { createClient } from "@/lib/supabase/server";
import StarRating from "@/components/StarRating";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "买家评价 — 给我爬",
  description: "查看所有买家对在售个体的真实评价。",
};

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "刚刚"; if (m < 60) return m + "分钟前";
  const h = Math.floor(m / 60); if (h < 24) return h + "小时前";
  return Math.floor(h / 24) + "天前";
}

export default async function ReviewsPage() {
  const supabase = await createClient();
  const { data: reviews, count } = await supabase
    .from("studio_product_reviews")
    .select("*, profiles:user_id(display_name, avatar_url)", { count: "estimated" })
    .order("created_at", { ascending: false })
    .limit(30);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:py-10">
      <h1 className="text-2xl md:text-3xl font-bold text-[#1f2937] mb-2">买家评价</h1>
      <p className="text-[14px] text-[#6b7280] mb-8">来自真实买家的评价，每一份信任都值得珍惜</p>

      {!reviews || reviews.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-5xl mb-4">⭐</p>
          <p className="text-[#9ca3af] text-[15px]">暂无评价，交易完成后即可评价</p>
        </div>
      ) : (
        <div className="space-y-4">
          {(reviews as any[]).map((review) => (
            <div key={review.id} className="bg-white rounded-xl border border-[#f3f4f6] p-4 md:p-5">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-amber-100 flex items-center justify-center text-[13px] font-bold text-amber-600">
                  {(review.profiles?.display_name || "匿").charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-[#1f2937]">
                    {Array.isArray(review.profiles) ? review.profiles[0]?.display_name : review.profiles?.display_name || "匿名用户"}
                  </p>
                  <div className="flex items-center gap-2">
                    <StarRating rating={review.rating} readonly size="sm" />
                    <span className="text-[12px] text-[#9ca3af]">{timeAgo(review.created_at)}</span>
                  </div>
                </div>
              </div>
              {review.content && (
                <p className="mt-3 text-[13px] text-[#4b5563] leading-relaxed whitespace-pre-wrap">
                  {review.content}
                </p>
              )}
              {review.images?.length > 0 && (
                <div className="mt-3 flex gap-2">
                  {review.images.map((img: string, i: number) => (
                    <img key={i} src={img} alt="" className="h-20 w-20 rounded-lg object-cover" loading="lazy" />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
