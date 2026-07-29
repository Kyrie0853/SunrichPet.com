"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useGuestCart } from "@/hooks/useGuestCart";

export default function CartPage() {
  const { items, updateQuantity, removeItem, clearCart, totalCount, totalPrice, ready } = useGuestCart();
  const router = useRouter();
  const [removingId, setRemovingId] = useState<string | null>(null);

  if (!ready) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-[#9ca3af]">加载中...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-5xl mb-4">🛒</p>
        <p className="text-[16px] text-[#1f2937] font-medium mb-2">购物车是空的</p>
        <p className="text-[14px] text-[#9ca3af] mb-6">快去挑选您喜欢的爬宠吧</p>
        <Link href="/shop" prefetch={true} className="inline-block rounded-full bg-[#1a7f5a] px-6 py-2.5 text-[14px] font-medium text-white hover:bg-[#166b4b] transition-colors">
          去逛逛
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:py-10">
      <h1 className="mb-6 text-xl md:text-2xl font-bold text-[#1f2937]">
        购物车
        <span className="ml-2 text-[14px] font-normal text-[#9ca3af]">{totalCount} 件商品</span>
      </h1>

      {/* 商品列表 */}
      <div className="space-y-3 mb-6">
        {items.map((item) => (
          <div key={item.product_id} className="bg-white rounded-xl border border-[#f3f4f6] p-4 flex gap-3 items-center">
            {/* 图片 */}
            <Link href={`/shop/product/${item.product_id}`} className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden shrink-0">
              {item.image ? (
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl text-gray-300">🦎</div>
              )}
            </Link>

            {/* 信息 */}
            <div className="flex-1 min-w-0">
              <Link href={`/shop/product/${item.product_id}`} className="text-[14px] font-semibold text-[#1f2937] hover:text-[#1a7f5a] line-clamp-1 transition-colors">
                {item.name}
              </Link>
              <p className="text-[16px] font-bold text-[#1a7f5a] mt-0.5">¥{item.price.toFixed(2)}</p>
            </div>

            {/* 数量 + 删除 */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center border border-[#e5e7eb] rounded-lg overflow-hidden">
                <button
                  onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                  className="w-8 h-8 flex items-center justify-center text-[#6b7280] hover:bg-[#f3f4f6] transition-colors text-[16px]"
                  aria-label="减少数量"
                >
                  −
                </button>
                <span className="w-10 text-center text-[14px] font-medium text-[#1f2937]">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                  className="w-8 h-8 flex items-center justify-center text-[#6b7280] hover:bg-[#f3f4f6] transition-colors text-[16px]"
                  aria-label="增加数量"
                >
                  +
                </button>
              </div>

              <button
                onClick={() => {
                  setRemovingId(item.product_id);
                  removeItem(item.product_id);
                  setTimeout(() => setRemovingId(null), 300);
                }}
                className="p-2 text-[#9ca3af] hover:text-red-500 transition-colors"
                aria-label="删除"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 底部固定栏 */}
      <div className="sticky bottom-16 md:bottom-0 bg-white border-t border-[#f3f4f6] rounded-t-2xl shadow-lg -mx-4 px-4 py-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[14px] text-[#6b7280]">
            共 <strong className="text-[#1f2937]">{totalCount}</strong> 件
          </span>
          <div className="text-right">
            <span className="text-[12px] text-[#9ca3af]">合计</span>
            <p className="text-[24px] font-bold text-[#1a7f5a] leading-tight">¥{totalPrice.toFixed(2)}</p>
          </div>
        </div>

        <button
          onClick={() => router.push("/checkout?from=cart")}
          className="w-full rounded-xl bg-[#1a7f5a] py-4 text-[15px] font-bold text-white hover:bg-[#166b4b] transition-colors active:scale-[0.98] min-h-[48px]"
        >
          去结算 · ¥{totalPrice.toFixed(2)}
        </button>

        <button
          onClick={() => { if (confirm("确定清空购物车？")) clearCart(); }}
          className="w-full text-center text-[12px] text-[#9ca3af] hover:text-red-500 transition-colors"
        >
          清空购物车
        </button>
      </div>
    </div>
  );
}
