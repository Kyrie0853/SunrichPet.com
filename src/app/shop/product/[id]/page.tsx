import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getProductById, STATUS_LABELS } from "@/lib/studio/products";
import ProductReviewSection from "@/components/ProductReviewSection";
import ProductGallery from "@/components/studio/ProductGallery";
import { getProductReviews, getProductRating } from "@/app/actions/reviews";
import type { Metadata } from "next";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) return { title: "个体不存在" };
  return {
    title: product.name + " — 给我爬",
    description: product.species + " | " + (product.morph || "") + " | ¥" + product.price,
    openGraph: { title: product.name, description: product.description?.slice(0, 160), images: product.images?.length > 0 ? [product.images[0]] : [] },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) notFound();

  const supabase = await createClient();
  let currentUserId: string | null = null;
  const { data: { user } } = await supabase.auth.getUser();
  if (user) currentUserId = user.id;

  const { reviews: prodReviews } = await getProductReviews(id, { filter: "all" });
  const { avg, count: reviewCount } = await getProductRating(id);
  const statusInfo = STATUS_LABELS[product.status] || { label: product.status, color: "" };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images?.length > 0 ? product.images : undefined,
    productID: product.product_id,
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "CNY",
      availability: product.status === "available" ? "https://schema.org/InStock"
        : product.status === "presale" ? "https://schema.org/PreOrder"
        : "https://schema.org/SoldOut",
      seller: { "@type": "Person", name: "给我爬" },
    },
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Link href="/" className="text-[13px] text-[#6b7280] hover:text-[#1a7f5a] mb-4 inline-block">&larr; 返回商城首页</Link>
      <div className="grid gap-6 md:gap-10 md:grid-cols-2">
        {/* 图片区域 */}
        <ProductGallery
          images={product.images || []}
          name={product.name}
          videoUrl={product.video_url}
        />

        {/* 信息区域 */}
        <div>
          <p className="text-[13px] text-[#9ca3af] font-mono mb-1">#{product.product_id}</p>
          <h1 className="text-2xl md:text-3xl font-bold text-[#1f2937]">{product.name}</h1>
          <div className="mt-4 flex items-center gap-4">
            <p className="text-3xl font-bold text-[#1a7f5a]">¥{product.price}</p>
            <span className={"rounded-full px-3 py-1 text-[12px] font-medium border " + statusInfo.color}>
              {statusInfo.label}
            </span>
          </div>
          <div className="mt-5 rounded-xl border border-[#1a7f5a]/20 bg-[#e8f5ef] px-4 py-3 text-[13px] text-[#1a7f5a] font-medium">
            🛡️ 支付宝担保交易 · 收货验货后付款
          </div>
          <div className="mt-6 bg-white rounded-xl border border-[#f3f4f6] overflow-hidden">
            <table className="w-full text-[13px]">
              <tbody>
                {product.morph && (<tr className="border-b border-[#f3f4f6]"><td className="px-4 py-3 text-[#6b7280] font-medium w-28">基因品系</td><td className="px-4 py-3 text-[#1f2937]">{product.morph}</td></tr>)}
                {product.birth_date && (<tr className="border-b border-[#f3f4f6]"><td className="px-4 py-3 text-[#6b7280] font-medium">出生日期</td><td className="px-4 py-3 text-[#1f2937]">{new Date(product.birth_date).toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" })}</td></tr>)}
                {product.current_weight && (<tr className="border-b border-[#f3f4f6]"><td className="px-4 py-3 text-[#6b7280] font-medium">当前体重</td><td className="px-4 py-3 text-[#1f2937]">{product.current_weight}</td></tr>)}
                {product.personality_tags && product.personality_tags.length > 0 && (
                  <tr className="border-b border-[#f3f4f6]"><td className="px-4 py-3 text-[#6b7280] font-medium">性格特点</td><td className="px-4 py-3"><div className="flex flex-wrap gap-1.5">{product.personality_tags.map((tag: string) => (<span key={tag} className="rounded-full bg-[#e8f5ef] px-2.5 py-0.5 text-[12px] text-[#1a7f5a]">{tag}</span>))}</div></td></tr>
                )}
                {product.estimated_ship_date && (<tr><td className="px-4 py-3 text-[#6b7280] font-medium">预计发货</td><td className="px-4 py-3 text-[#1f2937]">{new Date(product.estimated_ship_date).toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" })} 左右</td></tr>)}
              </tbody>
            </table>
          </div>
          {product.description && (
            <div className="mt-6">
              <h2 className="text-[14px] font-semibold text-[#1f2937] mb-3">个体描述</h2>
              <div className="text-[13px] text-[#4b5563] leading-relaxed whitespace-pre-wrap bg-white rounded-xl border border-[#f3f4f6] p-4">{product.description}</div>
            </div>
          )}
          <div className="mt-6 rounded-xl border-2 border-[#1a7f5a]/20 bg-[#e8f5ef]/50 p-4">
            <h3 className="text-[14px] font-bold text-[#1a7f5a] mb-2">📦 包损条款</h3>
            <ul className="space-y-1.5 text-[12px] text-[#4b5563] leading-relaxed">
              <li>请在签收后 <strong>6 小时内</strong>，凭<strong>完整无剪辑开箱视频</strong>联系</li>
              <li>开箱死亡，<strong>无条件退款或重发</strong></li>
              <li>有异议依据视频友好协商</li>
              <li>超出时限或无视频，无法处理，请谅解</li>
            </ul>
          </div>
          {product.status !== "sold" ? (
            <div className="mt-6">
              <Link href={`/checkout?product_id=${product.product_id}`}
                className="block w-full rounded-xl bg-[#1a7f5a] py-4 text-center text-[15px] font-bold text-white hover:bg-[#166b4b] transition-colors active:scale-[0.98] min-h-[48px] flex items-center justify-center">
                立即购买 · ¥{product.price}
              </Link>
            </div>
          ) : (
            <div className="mt-6 rounded-xl bg-gray-50 border border-gray-200 py-4 text-center text-[14px] text-[#9ca3af]">该个体已售出，看看其他在售个体吧</div>
          )}
        </div>
      </div>
      <ProductReviewSection productId={product.id} initialReviews={prodReviews} initialAvg={avg} initialCount={reviewCount} />
    </div>
  );
}
