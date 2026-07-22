import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getProductsByStatus, getSubcategories, getCategoryName, type StudioProduct, type Subcategory } from "@/lib/studio/products";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "商城 — 给我爬",
  description: "浏览所有在售爬宠个体。支付宝担保交易，安心购买。",
};

type Props = {
  searchParams: Promise<{ status?: string; species?: string; morph?: string; category?: string; subcategory?: string; min_price?: string; max_price?: string }>;
};

const STATUSES = [
  { key: "available", label: "可发货" },
  { key: "presale", label: "预售中" },
  { key: "sold", label: "已售出" },
];

const STATUS_STYLES: Record<string, string> = {
  presale: "bg-orange-50 text-orange-600 border-orange-200",
  available: "bg-emerald-50 text-emerald-600 border-emerald-200",
  sold: "bg-gray-100 text-gray-400 border-gray-200",
};
const STATUS_LABELS: Record<string, string> = {
  presale: "预售中",
  available: "可发货",
  sold: "已售出",
};

export default async function ShopPage({ searchParams }: Props) {
  const supabase = await createClient();

  let isAdmin = false;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: p } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      isAdmin = p?.role === "admin" || p?.role === "super_admin";
    }
  } catch { /* ignore */ }

  const sp = await searchParams;
  const status = sp?.status || "";
  const species = sp?.species || "";
  const morph = sp?.morph || "";
  const category = sp?.category || "";
  const subcategory = sp?.subcategory || "";
  const min_price = sp?.min_price || "";
  const max_price = sp?.max_price || "";

  let products: StudioProduct[] = [];
  let subcategories: Subcategory[] = [];
  let categoryName = "";
  let shopError: { code: string; message: string } | null = null;

  try {
    if (category) {
      products = await getProductsByStatus(status || undefined, species || undefined, morph || undefined, min_price || undefined, max_price || undefined, category, subcategory || undefined);
      subcategories = await getSubcategories(category);
      categoryName = await getCategoryName(category);
    } else {
      products = await getProductsByStatus(status || undefined, species || undefined, morph || undefined, min_price || undefined, max_price || undefined);
    }
  } catch (err: any) {
    shopError = {
      code: err?.code || "UNKNOWN",
      message: err?.message || String(err),
    };
  }

  const activeStatus = status;

  function buildHref(overrides: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    const cat = overrides.category !== undefined ? overrides.category : category;
    const sub = overrides.subcategory !== undefined ? overrides.subcategory : subcategory;
    const s = overrides.status !== undefined ? overrides.status : activeStatus;
    const mi = overrides.min_price !== undefined ? overrides.min_price : min_price;
    const ma = overrides.max_price !== undefined ? overrides.max_price : max_price;
    if (cat) params.set("category", cat);
    if (sub) params.set("subcategory", sub);
    if (s && s !== "all") params.set("status", s);
    if (mi) params.set("min_price", mi);
    if (ma) params.set("max_price", ma);
    const qs = params.toString();
    return "/shop" + (qs ? "?" + qs : "");
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:py-10">
      <div className="flex items-center justify-between mb-4">
        <div>
          <Link href="/" className="text-[13px] text-[#6b7280] hover:text-[#1a7f5a] mb-1 inline-block">&larr; 返回首页</Link>
          <h1 className="text-2xl md:text-3xl font-bold text-[#1f2937]">
            {categoryName || "全部个体"}
          </h1>
          <p className="text-[14px] text-[#6b7280] mt-0.5">每一只个体都经过精心养护，支付宝担保交易保障您的权益</p>
        </div>
        {isAdmin && (
          <Link
            href="/studio/dashboard"
            className="inline-flex items-center gap-1.5 rounded-full bg-[#1a7f5a] px-4 py-2 text-[13px] font-medium text-white hover:bg-[#166b4b] transition-colors shrink-0"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            添加新个体
          </Link>
        )}
      </div>

      <div className="mb-6 rounded-xl border border-[#1a7f5a]/20 bg-[#e8f5ef] px-4 py-2.5 text-[13px] text-[#1a7f5a] font-medium">
        🛡️ 支付宝担保交易 · 收货验货后付款
      </div>

      {/* 状态筛选 */}
      <div className="mb-3 flex flex-wrap gap-2">
        <Link href={buildHref({ status: "all" })}
          className={"rounded-full px-4 py-2 text-[13px] font-medium transition-all " +
            (!activeStatus || activeStatus === "all" ? "bg-[#1a7f5a] text-white" : "border border-[#d1d5db] text-[#6b7280] hover:border-[#1a7f5a] hover:text-[#1a7f5a]")}>
          全部
        </Link>
        {STATUSES.map((s) => {
          const isActive = s.key === activeStatus;
          return (
            <Link key={s.key} href={buildHref({ status: s.key })}
              className={"rounded-full px-4 py-2 text-[13px] font-medium transition-all " +
                (isActive ? "bg-[#1a7f5a] text-white" : "border border-[#d1d5db] text-[#6b7280] hover:border-[#1a7f5a] hover:text-[#1a7f5a]")}>
              {s.label}
            </Link>
          );
        })}
      </div>

      {/* 子分类筛选 */}
      {subcategories.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          <Link href={buildHref({ subcategory: "" })}
            className={"rounded-full px-3 py-1.5 text-[12px] font-medium transition-all " +
              (!subcategory ? "bg-[#e8f5ef] text-[#1a7f5a]" : "border border-[#e5e7eb] text-[#6b7280] hover:border-[#1a7f5a]")}>
            全部{categoryName}
          </Link>
          {subcategories.map((sc) => {
            const isActive = sc.slug === subcategory;
            return (
              <Link key={sc.id} href={buildHref({ subcategory: sc.slug })}
                className={"rounded-full px-3 py-1.5 text-[12px] font-medium transition-all whitespace-nowrap " +
                  (isActive ? "bg-[#e8f5ef] text-[#1a7f5a]" : "border border-[#e5e7eb] text-[#6b7280] hover:border-[#1a7f5a]")}>
                {sc.name}
              </Link>
            );
          })}
        </div>
      )}

      {/* 价格筛选 */}
      <div className="mb-6 flex items-center gap-2 flex-wrap">
        <span className="text-[12px] text-[#9ca3af] shrink-0">价格：</span>
        {[
          { label: "全部", href: buildHref({ min_price: undefined, max_price: undefined }), active: !min_price && !max_price },
          { label: "¥500以下", href: buildHref({ max_price: "500" }), active: max_price === "500" && !min_price },
          { label: "¥500-1000", href: buildHref({ min_price: "500", max_price: "1000" }), active: min_price === "500" && max_price === "1000" },
          { label: "¥1000-3000", href: buildHref({ min_price: "1000", max_price: "3000" }), active: min_price === "1000" && max_price === "3000" },
          { label: "¥3000以上", href: buildHref({ min_price: "3000" }), active: min_price === "3000" && !max_price },
        ].map((range) => (
          <Link key={range.label} href={range.href}
            className={"rounded-full px-3 py-1.5 text-[12px] font-medium transition-all " +
              (range.active ? "bg-[#e8f5ef] text-[#1a7f5a]" : "border border-[#e5e7eb] text-[#6b7280] hover:border-[#1a7f5a]")}>
            {range.label}
          </Link>
        ))}
      </div>

      {/* 错误展示 */}
      {shopError && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-5 text-[13px]">
          <p className="font-bold text-red-600 mb-2">数据加载失败</p>
          <div className="font-mono text-red-500">错误码: {shopError.code}</div>
          <div className="font-mono text-red-500 mt-1">{shopError.message}</div>
        </div>
      )}

      {/* 产品网格 */}
      {products.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-5xl mb-4">🦎</p>
          <p className="text-[#9ca3af] text-[15px] mb-2">
            {category ? `"${categoryName}"分类下暂无商品` : "暂无在售个体"}
          </p>
          {category && (
            <Link href="/shop" className="text-[13px] text-[#1a7f5a] hover:underline">查看全部分类 &rarr;</Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {products.map((product) => {
            const isSold = product.status === "sold";
            return (
              <div key={product.id} className="relative group/card">
                <Link href={`/shop/product/${product.id}`}
                  className={"block bg-white rounded-xl border overflow-hidden transition-all " +
                    (isSold
                      ? "border-[#f3f4f6] opacity-60 hover:opacity-80"
                      : "border-[#f3f4f6] hover:shadow-md hover:border-[#1a7f5a]/20")}>
                  <div className="aspect-square bg-gray-100 overflow-hidden relative">
                    {product.images && product.images.length > 0 ? (
                      <img src={product.images[0]} alt={product.name}
                        className={"w-full h-full object-cover transition-transform duration-300 " +
                          (isSold ? "grayscale" : "group-hover/card:scale-105")}
                        loading="lazy" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-5xl text-gray-300">🦎</div>
                    )}
                    <span className={"absolute top-2 left-2 rounded-full px-2 py-0.5 text-[10px] md:text-[11px] font-medium border " +
                      (STATUS_STYLES[product.status] || STATUS_STYLES.available)}>
                      {STATUS_LABELS[product.status] || ""}
                    </span>
                  </div>
                  <div className="p-3">
                    <p className="text-[11px] text-[#9ca3af] font-mono mb-0.5">#{product.product_id}</p>
                    <h3 className={"text-[14px] font-semibold line-clamp-1 transition-colors " +
                      (isSold ? "text-[#9ca3af]" : "text-[#1f2937] group-hover/card:text-[#1a7f5a]")}>
                      {product.name}
                    </h3>
                    {product.morph && (
                      <p className="text-[12px] text-[#6b7280] mt-0.5 line-clamp-1">{product.morph}</p>
                    )}
                    <p className={"mt-2 text-[17px] font-bold " + (isSold ? "text-[#9ca3af]" : "text-[#1a7f5a]")}>
                      ¥{product.price}
                    </p>
                  </div>
                </Link>
                {/* 管理员控制按钮 */}
                {isAdmin && (
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity z-10">
                    <Link
                      href={`/studio/dashboard?id=${product.id}`}
                      className="rounded-lg bg-white/90 backdrop-blur-sm border border-[#e5e7eb] p-1.5 text-[#6b7280] hover:text-[#1a7f5a] hover:border-[#1a7f5a] shadow-sm transition-colors"
                      title="编辑"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </Link>
                    <form>
                      <button
                        type="submit"
                        formAction={async () => {
                          "use server";
                          const supabase = await createClient();
                          const { data: { user } } = await supabase.auth.getUser();
                          if (!user) return;
                          const { data: p } = await supabase.from("profiles").select("role").eq("id", user.id).single();
                          if (p?.role !== "admin" && p?.role !== "super_admin") return;
                          await supabase.from("studio_products").delete().eq("id", product.id);
                        }}
                        className="rounded-lg bg-white/90 backdrop-blur-sm border border-[#e5e7eb] p-1.5 text-[#6b7280] hover:text-[#dc3545] hover:border-[#dc3545] shadow-sm transition-colors"
                        title="删除"
                        onClick={(e) => { if (!confirm("确定要删除这个个体吗？此操作不可撤销。")) e.preventDefault(); }}
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </form>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
