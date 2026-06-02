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

  // 分离父分类和子分类
  const parentCategories = (categories || []).filter((c: any) => !c.parent_id);
  const childCategories = (categories || []).filter((c: any) => c.parent_id);

  // 构建父分类 -> 子分类映射
  const childrenMap = new Map<string, any[]>();
  childCategories.forEach((c: any) => {
    if (!childrenMap.has(c.parent_id)) childrenMap.set(c.parent_id, []);
    childrenMap.get(c.parent_id)!.push(c);
  });

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

        {/* 平台担保标识 */}
        <div className="mx-auto mb-6 max-w-lg">
          <div className="rounded-xl border border-[#1a7f5a]/20 bg-[#e8f5ef] px-4 py-2.5 text-[13px] text-[#1a7f5a] font-medium inline-flex items-center gap-2">
            🛡️ 平台担保交易：下单后由平台协调收款和发货，保障双方权益
          </div>
        </div>

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

        {parentCategories.length > 0 ? (
          <div className="space-y-10">
            {parentCategories.map((parent: any, pi: number) => {
              const subs = childrenMap.get(parent.id) || [];
              return (
                <div key={parent.id}>
                  {/* 父分类标题 + 链接 */}
                  <Link
                    href={`/products?category=${parent.slug}`}
                    className="group mb-3 inline-flex items-center gap-2 text-lg font-bold text-gray-800 hover:text-emerald-700 transition-colors"
                  >
                    <span className="text-2xl">{parent.name.charAt(0)}</span>
                    {parent.name}
                    <svg className="h-4 w-4 text-gray-400 group-hover:text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>

                  {/* 子分类 */}
                  {subs.length > 0 && (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                      {subs.map((sub: any, si: number) => (
                        <Link
                          key={sub.id}
                          href={`/products?category=${sub.slug}`}
                          className={`group rounded-xl border bg-gradient-to-br p-4 text-center transition-all hover:shadow-md ${CATEGORY_COLORS[(pi * 4 + si) % CATEGORY_COLORS.length]}`}
                        >
                          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-white/60 text-lg">
                            {sub.name.charAt(0)}
                          </div>
                          <span className="block text-sm font-semibold text-gray-700 group-hover:text-emerald-700">
                            {sub.name}
                          </span>
                          {sub.description && (
                            <span className="mt-0.5 block text-xs text-gray-400 line-clamp-1">
                              {sub.description}
                            </span>
                          )}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
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
