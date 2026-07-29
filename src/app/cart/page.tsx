import Link from "next/link";

/**
 * 轻量化改造：买家无需登录，购物车仅供浏览参考
 * 实际下单请通过商品详情页"立即购买"按钮
 */
export default function CartPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 text-center">
      <p className="text-5xl mb-4">🛒</p>
      <p className="text-[16px] text-[#1f2937] font-medium mb-2">购物车功能已简化</p>
      <p className="text-[14px] text-[#9ca3af] mb-6">请直接在商品详情页点击"立即购买"提交订单</p>
      <Link href="/shop" prefetch={true} className="inline-block rounded-full bg-[#1a7f5a] px-6 py-2.5 text-[14px] font-medium text-white hover:bg-[#166b4b] transition-colors">
        去逛逛
      </Link>
    </div>
  );
}
