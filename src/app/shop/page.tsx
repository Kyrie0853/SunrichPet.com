import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SearchBar } from "@/components/SearchBar";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "宠物商城 — 顺瑞益宠",
  description: "精选好物，为你的宠物提供最好的照顾",
};

const CATEGORY_COLORS = [
  "from-amber-100 to-orange-50 border-amber-200",
  "from-green-100 to-emerald-50 border-green-200",
  "from-lime-100 to-yellow-50 border-lime-200",
  "from-cyan-100 to-blue-50 border-cyan-200",
  "from-purple-100 to-pink-50 border-purple-200",
  "from-rose-100 to-red-50 border-rose-200",
  "from-teal-100 to-cyan-50 border-teal-200",
  "from-sky-100 to-indigo-50 border-sky-200",
];

export default async function ShopPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });

  return (
    <div className="flex flex-1 flex-col">
      {/* Hero + 搜索 */}
      <section className="bg-gradient-to-b from-emerald-50 via-white to-white py-16 text-center">
        <h1 className="mb-3 text-4xl font-bold tracking-tight text-gray-800">
          精选好物
        </h1>
        <p className="mx-auto mb-8 max-w-lg text-gray-500">
          为你的宠物伙伴找到最好的食物、用品和装备
        </p>

        {/* 搜索框 */}
        <div className="mx-auto max-w-xl px-4">
          <SearchBar />
        </div>
      </section>

      {/* 分类导航 */}
      <section className="mx-auto w-full max-w-5xl px-4 pb-20">
        <div className="mb-8 flex items-center gap-3">
          <span className="h-px flex-1 bg-gray-200" />
          <h2 className="text-lg font-semibold text-gray-600">分类浏览</h2>
          <span className="h-px flex-1 bg-gray-200" />
        </div>

        {categories && categories.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {categories.map((cat, i) => (
              <Link
                key={cat.id}
                href={`/products?category=${cat.slug}`}
                className={`group rounded-2xl border bg-gradient-to-br p-6 text-center transition-all hover:shadow-md ${CATEGORY_COLORS[i % CATEGORY_COLORS.length]}`}
              >
                {cat.image_url ? (
                  <img
                    src={cat.image_url}
                    alt={cat.name}
                    className="mx-auto mb-3 h-16 w-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white/60 text-2xl">
                    {cat.name.charAt(0)}
                  </div>
                )}
                <span className="block font-semibold text-gray-800 group-hover:text-emerald-700">
                  {cat.name}
                </span>
                {cat.description && (
                  <span className="mt-1 block text-xs text-gray-500 line-clamp-2">
                    {cat.description}
                  </span>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <p className="py-12 text-center text-gray-400">
            暂无分类，请管理员在后台添加
          </p>
        )}
      </section>
    </div>
  );
}
