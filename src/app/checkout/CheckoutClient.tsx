"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useGuestCart, type CartItem } from "@/hooks/useGuestCart";
import PurchaseForm from "@/components/studio/PurchaseForm";

interface ProductInfo {
  product_id: string;
  name: string;
  price: number;
  image?: string;
  quantity: number;
}

interface SingleProductInfo {
  product_id: string;
  name: string;
  price: number;
  image?: string;
  quantity: number;
}

export default function CheckoutClient({
  productId,
  fromCart,
  singleProduct,
}: {
  productId: string | null;
  fromCart: boolean;
  singleProduct: SingleProductInfo | null;
}) {
  const { items: cartItems, clearCart, ready } = useGuestCart();
  const [products, setProducts] = useState<ProductInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready) return;

    if (fromCart && cartItems.length > 0) {
      // 从购物车结算
      setProducts(cartItems.map(item => ({
        product_id: item.product_id,
        name: item.name,
        price: item.price,
        image: item.image,
        quantity: item.quantity,
      })));
      setLoading(false);
    } else if (singleProduct) {
      // 服务端已获取单品信息
      setProducts([singleProduct]);
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [productId, fromCart, cartItems, ready, singleProduct]);

  if (!ready || loading) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <p className="text-[#9ca3af]">加载中...</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <p className="text-4xl mb-4">🛒</p>
        <p className="text-[#9ca3af] text-[15px] mb-4">请先选择商品</p>
        <Link href="/shop" className="inline-block rounded-full bg-[#1a7f5a] px-6 py-2.5 text-[14px] font-medium text-white hover:bg-[#166b4b]">去逛逛</Link>
      </div>
    );
  }

  const totalPrice = products.reduce((sum, p) => sum + p.price * p.quantity, 0);
  const isMultiProduct = products.length > 1;
  const mainProduct = products[0];

  return (
    <div className="mx-auto max-w-lg px-4 py-6 md:py-10">
      <h1 className="text-xl md:text-2xl font-bold text-[#1f2937] mb-2">确认订单</h1>

      <div className="mb-5 rounded-xl border border-[#1a7f5a]/20 bg-[#e8f5ef] px-4 py-3 text-[13px] text-[#1a7f5a] font-medium">
        💚 微信扫码支付 · 提交订单后联系客服完成支付
      </div>

      {/* 商品列表 */}
      <div className="space-y-3 mb-4">
        {products.map((p) => (
          <div key={p.product_id} className="bg-white rounded-xl border border-[#f3f4f6] p-3 flex gap-3">
            <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden shrink-0">
              {p.image ? (
                <img src={p.image} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xl text-gray-300">🦎</div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-[#1f2937] line-clamp-1">{p.name}</p>
              <div className="flex items-center justify-between mt-1">
                <p className="text-[17px] font-bold text-[#1a7f5a]">¥{p.price.toFixed(2)}</p>
                {isMultiProduct && <span className="text-[12px] text-[#9ca3af]">×{p.quantity}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 总计 */}
      {isMultiProduct && (
        <div className="bg-white rounded-xl border border-[#f3f4f6] p-3 mb-4 flex justify-between items-center">
          <span className="text-[14px] text-[#6b7280]">合计</span>
          <span className="text-[22px] font-bold text-[#1a7f5a]">¥{totalPrice.toFixed(2)}</span>
        </div>
      )}

      {/* 购买表单 */}
      <PurchaseForm
        productId={mainProduct.product_id}
        productName={isMultiProduct ? `${products.length} 件商品` : mainProduct.name}
        price={totalPrice}
        cartItems={fromCart ? products : undefined}
        onOrderCreated={() => {
          if (fromCart) {
            // 清空已下单的商品
            const orderedIds = products.map(p => p.product_id);
            clearCart();
          }
        }}
      />
    </div>
  );
}
