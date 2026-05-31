import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import ReviewSection from "@/components/ReviewSection";

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
        <Link href="/shop" className="inline-block rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700">
          返回商城
        </Link>
      </div>
    );
  }

  const { data: products } = await supabase.from("products").select("id,name,price,image_url,slug").eq("seller_id", id).eq("status", "active").limit(12);

  const { data: reviews } = await supabase.from("seller_reviews").select("*").eq("seller_id", id).order("created_at", { ascending: false });
  if(reviews&&reviews.length>0){const bIds=[...new Set(reviews.map((r:any)=>r.buyer_id))];const{data:buyers}=await supabase.from("profiles").select("id,display_name,avatar_url").in("id",bIds);const bMap=new Map((buyers||[]).map(b=>[b.id,b]));reviews.forEach((r:any)=>r.buyer=bMap.get(r.buyer_id)||null);}

  const { data: { user } } = await supabase.auth.getUser();
  let hasReviewed = false;
  if (user) {
    const { data: existing } = await supabase.from("seller_reviews").select("id").eq("seller_id", id).eq("buyer_id", user.id).single();
    hasReviewed = !!existing;
  }

  const avgRating = reviews && reviews.length > 0
    ? (reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "0.0";

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      {/* 商家信息 */}
      <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center text-2xl font-bold text-emerald-600">
            {(seller.display_name || "U").charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{seller.display_name || "商家"}</h1>
            {seller.bio && <p className="mt-1 text-sm text-gray-500">{seller.bio}</p>}
            <div className="mt-2 flex items-center gap-2">
              <span className="text-lg font-bold text-amber-500">⭐ {avgRating}</span>
              <span className="text-sm text-gray-400">({reviews?.length || 0} 条评价)</span>
            </div>
          </div>
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
