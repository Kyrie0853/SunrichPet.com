import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AddToCartButton } from "@/components/AddToCartButton";
import { getProductReviews, getProductRating } from "@/app/actions/reviews";
import ProductReviewSection from "@/components/ProductReviewSection";
import ProductFavoriteButton from "@/components/ProductFavoriteButton";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: product, error } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .eq("status", "active")
    .single();

  if (error || !product) {
    notFound();
  }

  // 商家评分
  let sellerRating = { avg: 0, count: 0 };
  if (product.seller_id) {
    const { data: sellerReviews } = await supabase.from("seller_reviews").select("rating").eq("seller_id", product.seller_id);
    if (sellerReviews && sellerReviews.length > 0) {
      sellerRating.avg = +(sellerReviews.reduce((s: number, r: any) => s + r.rating, 0) / sellerReviews.length).toFixed(1);
      sellerRating.count = sellerReviews.length;
    }
    const { data: seller } = await supabase.from("profiles").select("display_name").eq("id", product.seller_id).single();
    product._seller = seller;
  }

  // 商品收藏状态
  let isFav = false;
  let currentUserId: string | null = null;
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    currentUserId = user.id;
    const { data: fav } = await supabase.from("product_favorites").select("id").eq("user_id", user.id).eq("product_id", product.id).maybeSingle();
    isFav = !!fav;
  }

  // 加载评价
  const { reviews: prodReviews } = await getProductReviews(product.id, { filter: "all" });
  const { avg, count: reviewCount } = await getProductRating(product.id);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="grid gap-4 md:gap-8 md:grid-cols-2">
        {/* 图片区域 */}
        <div className="overflow-hidden rounded-2xl bg-gray-100">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex aspect-square items-center justify-center text-6xl text-gray-300">
              {product.name.charAt(0)}
            </div>
          )}
        </div>

        {/* 详情区域 */}
        <div className="flex flex-col">
          <div className="flex items-start gap-3">
            <h1 className="text-2xl font-bold text-gray-800 flex-1">{product.name}</h1>
            <ProductFavoriteButton productId={product.id} initialFavorited={isFav} userId={currentUserId} />
          </div>
          <div className="mt-2 flex items-center gap-3">
            <p className="text-3xl font-bold text-emerald-600">
              ¥{product.price}
            </p>
            {(product.avg_rating && product.avg_rating > 0) && (
              <span className="text-sm text-amber-600">⭐ {product.avg_rating} ({product.review_count || reviewCount})</span>
            )}
          </div>

          {/* 库存状态 */}
          <div className="mt-4">
            {product.stock > 0 ? (
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-sm text-emerald-700">
                有货（库存 {product.stock}）
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-500">
                已售罄
              </span>
            )}
          </div>

          {/* 描述 */}
          <div className="mt-6 border-t pt-6">
            <h2 className="mb-3 text-sm font-semibold text-gray-500">商品描述</h2>
            <p className="whitespace-pre-wrap leading-relaxed text-gray-700">
              {product.description || "暂无描述"}
            </p>
          </div>

          {/* 商家信息 */}
          {product.seller_id && (
            <a href={"/shop/seller/" + product.seller_id} className="mt-8 flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3 transition hover:bg-gray-100">
              <div className="h-9 w-9 rounded-full bg-emerald-100 flex items-center justify-center text-sm font-bold text-emerald-600">
                {(product._seller?.display_name || "商").charAt(0)}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{product._seller?.display_name || "商家"}</p>
                {sellerRating.count > 0 && (
                  <p className="text-xs text-amber-600">⭐ {sellerRating.avg} · {sellerRating.count} 条评价</p>
                )}
              </div>
            </a>
          )}

          {/* 加入购物车 */}
          <div className="mt-auto pt-8">
            <AddToCartButton productId={product.id} stock={product.stock} />
          </div>
        </div>
      </div>

      {/* 商品评价 */}
      <ProductReviewSection productId={product.id} initialReviews={prodReviews} initialAvg={avg} initialCount={reviewCount} />
    </div>
  );
}
