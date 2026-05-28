import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AddToCartButton } from "@/components/AddToCartButton";

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

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="grid gap-8 md:grid-cols-2">
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
          <h1 className="text-2xl font-bold text-gray-800">{product.name}</h1>
          <p className="mt-4 text-3xl font-bold text-emerald-600">
            ¥{product.price}
          </p>

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

          {/* 加入购物车 */}
          <div className="mt-auto pt-8">
            <AddToCartButton productId={product.id} stock={product.stock} />
          </div>
        </div>
      </div>
    </div>
  );
}
