import { searchProducts } from "@/lib/supabase/search";
import Link from "next/link";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;

  if (!q.trim()) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-4xl">🔍</p><p className="mt-4 text-gray-400">请输入搜索关键词</p>
      </div>
    );
  }

  const { products } = await searchProducts(q.trim());

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="mb-2 text-2xl font-bold text-gray-900">搜索 "{q}"</h1>
      <p className="mb-6 text-sm text-gray-400">共找到 {products.length} 个相关个体</p>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        {products.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-400">未找到相关内容，换个关键词试试吧</div>
        )}
        {products.map((product: any) => (
          <Link key={product.id} href={`/shop/product/${product.id}`} className="block bg-white rounded-xl border border-[#f3f4f6] overflow-hidden hover:shadow-md transition-all hover:border-[#1a7f5a]/20 group">
            <div className="aspect-square bg-gray-100 overflow-hidden relative">
              {product.images && product.images.length > 0 ? (
                <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-5xl text-gray-300">🦎</div>
              )}
            </div>
            <div className="p-3">
              <p className="text-[11px] text-[#9ca3af] font-mono mb-0.5">#{product.product_id}</p>
              <h3 className="text-[14px] font-semibold text-[#1f2937] line-clamp-1 group-hover:text-[#1a7f5a] transition-colors">{product.name}</h3>
              {product.morph && <p className="text-[12px] text-[#6b7280] mt-0.5 line-clamp-1">{product.morph}</p>}
              <p className="mt-2 text-[17px] font-bold text-[#1a7f5a]">¥{product.price}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
