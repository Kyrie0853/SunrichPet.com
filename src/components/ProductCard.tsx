import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ProductFavoriteButton from "./ProductFavoriteButton";

type Product = {
  id: string;
  slug: string;
  name: string;
  price: number;
  image_url: string | null;
  stock: number;
  avg_rating?: number;
  review_count?: number;
};

export async function ProductCard({ product, showFavorite = false }: { product: Product; showFavorite?: boolean }) {
  let userId: string | null = null;
  let favorited = false;
  if (showFavorite) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      userId = user.id;
      const { data: fav } = await supabase.from("product_favorites").select("id").eq("user_id", user.id).eq("product_id", product.id).maybeSingle();
      favorited = !!fav;
    }
  }

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group relative overflow-hidden rounded-xl border border-gray-100 bg-white transition-all hover:shadow-md"
    >
      {/* 收藏按钮 */}
      {showFavorite && (
        <div className="absolute top-2 right-2 z-10">
          <ProductFavoriteButton productId={product.id} initialFavorited={favorited} userId={userId} size="sm" />
        </div>
      )}

      {/* 商品图片 */}
      <div className="aspect-square overflow-hidden bg-gray-100">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl text-gray-300">
            {product.name.charAt(0)}
          </div>
        )}
      </div>

      {/* 信息 */}
      <div className="p-3">
        <h3 className="truncate text-sm font-medium text-gray-800 group-hover:text-emerald-700">
          {product.name}
        </h3>
        <div className="mt-1 flex items-center justify-between">
          <span className="text-base font-bold text-emerald-600">
            ¥{product.price}
          </span>
          <div className="flex items-center gap-2">
            {product.avg_rating && product.avg_rating > 0 && (
              <span className="text-xs text-amber-500">⭐ {product.avg_rating}</span>
            )}
            {product.stock === 0 && (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-400">
                已售罄
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
