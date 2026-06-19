import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getProductByProductId } from "@/lib/studio/products";
import PurchaseForm from "@/components/studio/PurchaseForm";

type Props = { searchParams: Promise<{ product_id?: string }> };

export default async function CheckoutPage({ searchParams }: Props) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { product_id } = await searchParams;

  if (!product_id) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <p className="text-4xl mb-4">🛒</p>
        <p className="text-[#9ca3af] text-[15px] mb-4">请从在售个体页面选择商品</p>
        <a href="/shop" className="inline-block rounded-full bg-[#1a7f5a] px-6 py-2.5 text-[14px] font-medium text-white hover:bg-[#166b4b]">去逛逛</a>
      </div>
    );
  }

  const product = await getProductByProductId(product_id);
  if (!product || product.status === "sold") {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <p className="text-4xl mb-4">😔</p>
        <p className="text-[#9ca3af] text-[15px] mb-4">商品不存在或已售出</p>
        <a href="/shop" className="inline-block rounded-full bg-[#1a7f5a] px-6 py-2.5 text-[14px] font-medium text-white hover:bg-[#166b4b]">去逛逛</a>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6 md:py-10">
      <h1 className="text-xl md:text-2xl font-bold text-[#1f2937] mb-2">确认订单</h1>

      <div className="mb-5 rounded-xl border border-[#1a7f5a]/20 bg-[#e8f5ef] px-4 py-3 text-[13px] text-[#1a7f5a] font-medium">
        🛡️ 支付宝担保交易 · 付款到担保账户 → 验货后确认收货
      </div>

      {/* 商品信息 */}
      <div className="bg-white rounded-xl border border-[#f3f4f6] p-4 mb-4">
        <div className="flex gap-3">
          <div className="w-20 h-20 rounded-lg bg-gray-100 overflow-hidden shrink-0">
            {product.images && product.images.length > 0 ? (
              <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl text-gray-300">🦎</div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] text-[#9ca3af] font-mono">#{product.product_id}</p>
            <p className="text-[15px] font-semibold text-[#1f2937] line-clamp-1">{product.name}</p>
            {product.morph && <p className="text-[12px] text-[#6b7280]">{product.morph}</p>}
            <p className="mt-1 text-[20px] font-bold text-[#1a7f5a]">¥{product.price}</p>
          </div>
        </div>
      </div>

      {/* 购买表单 */}
      <PurchaseForm productId={product.product_id} productName={product.name} price={product.price} />
    </div>
  );
}
