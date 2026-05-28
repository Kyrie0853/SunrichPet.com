import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SearchBar } from "@/components/SearchBar";
import { ProductCard } from "@/components/ProductCard";

type Props = {
  searchParams: Promise<{ category?: string; search?: string }>;
};

export default async function ProductsPage({ searchParams }: Props) {
  const { category, search } = await searchParams;
  const supabase = await createClient();

  // 获取分类名称（用于页面标题）
  let categoryName = "";
  if (category) {
    const { data: cat } = await supabase
      .from("categories")
      .select("name")
      .eq("slug", category)
      .single();
    categoryName = cat?.name || category;
  }

  // 构建商品查询
  let query = supabase
    .from("products")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (category) {
    const { data: catData } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", category)
      .single();
    if (catData) {
      query = query.eq("category_id", catData.id);
    }
  }

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  const { data: products, error } = await query;

  const title = search
    ? `搜索"${search}"的结果`
    : categoryName
      ? `${categoryName}`
      : "全部商品";

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      {/* 页面标题 */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
          {products && (
            <p className="mt-1 text-sm text-gray-500">共 {products.length} 件商品</p>
          )}
        </div>
        <div className="w-full sm:w-72">
          <SearchBar />
        </div>
      </div>

      {/* 错误状态 */}
      {error && (
        <div className="rounded-lg bg-red-50 p-8 text-center text-red-500">
          加载商品失败，请稍后重试
        </div>
      )}

      {/* 空状态 */}
      {!error && products && products.length === 0 && (
        <div className="rounded-lg bg-gray-50 py-20 text-center">
          <p className="text-lg text-gray-400">暂无商品</p>
          <p className="mt-2 text-sm text-gray-400">
            {search
              ? "试试其他关键词"
              : "该分类下暂时没有上架商品"}
          </p>
          <Link
            href="/products"
            className="mt-6 inline-block rounded-lg bg-emerald-600 px-6 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            查看全部商品
          </Link>
        </div>
      )}

      {/* 商品网格 */}
      {products && products.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
