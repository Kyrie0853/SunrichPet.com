import Link from "next/link";
import { getProductsByStatus, getAllSpecies } from "@/lib/studio/products";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "在售个体 — Sunrich Pet 爬宠工作室",
  description: "浏览所有在售爬宠个体。支付宝担保交易，安心购买。",
};

type Props = { searchParams: Promise<{ status?: string; species?: string }> };

const STATUSES = [
  { key: "all", label: "全部" },
  { key: "presale", label: "预售中" },
  { key: "available", label: "可发货" },
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
  const { status, species } = await searchParams;
  const products = await getProductsByStatus(status, species);
  const allSpecies = await getAllSpecies();

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:py-10">
      <h1 className="text-2xl md:text-3xl font-bold text-[#1f2937] mb-2">在售个体</h1>
      <p className="text-[14px] text-[#6b7280] mb-6">每一只个体都经过精心养护，支付宝担保交易保障您的权益</p>

      <div className="mb-6 rounded-xl border border-[#1a7f5a]/20 bg-[#e8f5ef] px-4 py-2.5 text-[13px] text-[#1a7f5a] font-medium">
        🛡️ 支付宝担保交易 · 收货验货后付款
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {STATUSES.map((s) => {
          const isActive = (s.key === "all" && !status) || s.key === status;
          const href = s.key === "all"
            ? "/shop" + (species ? "?species=" + species : "")
            : "/shop?status=" + s.key + (species ? "&species=" + species : "");
          return (
            <Link key={s.key} href={href}
              className={"rounded-full px-4 py-2 text-[13px] font-medium transition-all " +
                (isActive ? "bg-[#1a7f5a] text-white" : "border border-[#d1d5db] text-[#6b7280] hover:border-[#1a7f5a] hover:text-[#1a7f5a]")}>
              {s.label}
            </Link>
          );
        })}
      </div>

      {allSpecies.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <Link href={"/shop" + (status ? "?status=" + status : "")}
            className={"rounded-full px-3 py-1.5 text-[12px] font-medium transition-all " +
              (!species ? "bg-[#e8f5ef] text-[#1a7f5a]" : "border border-[#e5e7eb] text-[#6b7280] hover:border-[#1a7f5a]")}>
            全部物种
          </Link>
          {allSpecies.map((sp) => {
            const isActive = sp === species;
            const href = "/shop?" + (status ? "status=" + status + "&" : "") + "species=" + sp;
            return (
              <Link key={sp} href={href}
                className={"rounded-full px-3 py-1.5 text-[12px] font-medium transition-all " +
                  (isActive ? "bg-[#e8f5ef] text-[#1a7f5a]" : "border border-[#e5e7eb] text-[#6b7280] hover:border-[#1a7f5a]")}>
                {sp}
              </Link>
            );
          })}
        </div>
      )}

      {products.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-5xl mb-4">🦎</p>
          <p className="text-[#9ca3af] text-[15px]">暂无符合条件的个体</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {products.map((product) => (
            <Link key={product.id} href={`/shop/product/${product.id}`}
              className="group bg-white rounded-xl border border-[#f3f4f6] overflow-hidden hover:shadow-md transition-all hover:border-[#1a7f5a]/20">
              <div className="aspect-square bg-gray-100 overflow-hidden relative">
                {product.images && product.images.length > 0 ? (
                  <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
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
                <h3 className="text-[14px] font-semibold text-[#1f2937] line-clamp-1 group-hover:text-[#1a7f5a] transition-colors">{product.name}</h3>
                {product.morph && <p className="text-[12px] text-[#6b7280] mt-0.5 line-clamp-1">{product.morph}</p>}
                <p className="mt-2 text-[17px] font-bold text-[#1a7f5a]">¥{product.price}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
