import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import ReviewSection from "@/components/ReviewSection";
import SellerFollowButton from "./SellerFollowButton";

export default async function SellerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: seller } = await supabase.from("profiles").select("*").eq("id", id).single();
  if (!seller) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <p className="text-5xl mb-4">🏪</p>
        <h1 className="text-xl font-bold text-gray-700 mb-2">商家不存在</h1>
        <p className="text-sm text-gray-400 mb-6">该商家可能已注销或暂停经营</p>
        <Link href="/shop" className="inline-block rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700">返回商城</Link>
      </div>
    );
  }

  const [productsRes, reviewsRes, ordersCountRes, scoreRes] = await Promise.all([
    supabase.from("products").select("id,name,price,image_url,slug").eq("seller_id", id).eq("status", "active").limit(12),
    supabase.from("seller_reviews").select("*").eq("seller_id", id).order("created_at", { ascending: false }),
    supabase.from("orders").select("id").eq("seller_id", id).eq("status", "completed"),
    supabase.from("seller_scores").select("score").eq("seller_id", id).maybeSingle(),
  ]);

  const products = productsRes.data || [];
  const reviews = reviewsRes.data || [];
  const soldCount = ordersCountRes.data?.length || 0;
  const sellerScore = scoreRes.data?.score ?? 100;

  if (reviews.length > 0) {
    const bIds = [...new Set(reviews.map((r: any) => r.buyer_id))];
    const { data: buyers } = await supabase.from("profiles").select("id,display_name,avatar_url").in("id", bIds);
    const bMap = new Map((buyers || []).map(b => [b.id, b]));
    reviews.forEach((r: any) => r.buyer = bMap.get(r.buyer_id) || null);
  }

  const { data: { user } } = await supabase.auth.getUser();
  let hasReviewed = false, isFollowing = false;
  if (user) {
    const [revRes, followRes] = await Promise.all([
      supabase.from("seller_reviews").select("id").eq("seller_id", id).eq("buyer_id", user.id).maybeSingle(),
      supabase.from("user_follows").select("id").eq("follower_id", user.id).eq("following_id", id).maybeSingle(),
    ]);
    hasReviewed = !!revRes.data;
    isFollowing = !!followRes.data;
  }

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "0.0";

  // 开店时长
  const daysSince = seller.created_at ? Math.floor((Date.now() - new Date(seller.created_at).getTime()) / 86400000) : 0;
  const storeAge = daysSince > 365 ? Math.floor(daysSince / 365) + '年' : daysSince > 30 ? Math.floor(daysSince / 30) + '个月' : daysSince + '天';

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      {/* 商家信息 */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 md:p-8 shadow-sm">
        {seller.shop_notice && (
          <div className="mb-4 bg-[#fef3c7] rounded-lg px-4 py-2 text-[13px] text-[#92400e]">{seller.shop_notice}</div>
        )}
        <div className="flex items-start gap-4">
          <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center text-2xl font-bold text-emerald-600 overflow-hidden shrink-0">
            {seller.avatar_url ? <img src={seller.avatar_url} className="w-full h-full object-cover" /> : (seller.display_name || "U").charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">{seller.display_name || "商家"}</h1>
              <span className={'rounded-full px-2 py-0.5 text-[11px] font-medium ' + (sellerScore >= 80 ? 'bg-emerald-50 text-emerald-700' : sellerScore >= 60 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700')}>
                {sellerScore >= 80 ? '🟢 优秀' : sellerScore >= 60 ? '🟡 良好' : '🔴 警告'}
              </span>
            </div>
            {seller.bio && <p className="mt-1 text-sm text-gray-500">{seller.bio}</p>}
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-[#6b7280]">
              <span>⭐ {avgRating} 分</span>
              <span>📦 已售 {soldCount} 单</span>
              <span>📅 已入驻 {storeAge}</span>
            </div>
          </div>
          <SellerFollowButton sellerId={id} initialFollowing={isFollowing} userId={user?.id} />
        </div>
      </div>

      {/* 商品列表 */}
      {products && products.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-4 text-lg font-bold text-gray-900">在售商品</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((p: any) => (
              <Link key={p.id} href={"/products/" + p.slug} className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm transition hover:shadow-md">
                {p.image_url ? <img src={p.image_url} alt="" className="mb-2 h-32 w-full rounded-lg object-cover" loading="lazy" /> : <div className="mb-2 h-32 w-full rounded-lg bg-gray-100 flex items-center justify-center text-gray-300">无图</div>}
                <p className="text-sm font-semibold text-gray-900 truncate">{p.name}</p>
                <p className="text-sm font-bold text-emerald-700">¥{p.price}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 评价区域 */}
      <div className="mt-10">
        <h2 className="mb-6 text-lg font-bold text-gray-900">用户评价 ({reviews?.length || 0})</h2>
        <ReviewSection sellerId={id} reviews={reviews || []} currentUserId={user?.id || null} hasReviewed={hasReviewed} />
      </div>
    </div>
  );
}
