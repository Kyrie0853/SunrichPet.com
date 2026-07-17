"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PurchaseForm({ productId, productName, price }: {
  productId: string;
  productName: string;
  price: number;
}) {
  const router = useRouter();
  const [shippingAddress, setShippingAddress] = useState("");
  const [buyerMessage, setBuyerMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!shippingAddress.trim()) {
      setError("请填写收货信息");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: productId,
          shipping_address: shippingAddress,
          buyer_message: buyerMessage,
        }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        setLoading(false);
        return;
      }
      if (data.payUrl) {
        window.location.href = data.payUrl;
      } else {
        router.push("/orders/" + data.orderId);
      }
    } catch {
      setError("网络错误，请重试");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-[14px] font-semibold text-[#1f2937]">收货信息 *</label>
        <textarea
          value={shippingAddress}
          onChange={(e) => setShippingAddress(e.target.value)}
          placeholder="姓名、电话、详细地址"
          rows={3}
          className="w-full rounded-xl border border-[#e5e7eb] px-4 py-3 text-[16px] outline-none focus:border-[#1a7f5a] resize-none"
        />
      </div>

      <div>
        <label className="mb-1 block text-[14px] font-semibold text-[#1f2937]">买家留言（选填）</label>
        <textarea
          value={buyerMessage}
          onChange={(e) => setBuyerMessage(e.target.value)}
          placeholder="如有特殊要求请在此留言..."
          rows={2}
          className="w-full rounded-xl border border-[#e5e7eb] px-4 py-3 text-[16px] outline-none focus:border-[#1a7f5a] resize-none"
        />
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-[13px] text-red-600">{error}</div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full rounded-xl bg-[#1a7f5a] py-4 text-[15px] font-bold text-white hover:bg-[#166b4b] transition-colors disabled:opacity-50 active:scale-[0.98] min-h-[48px]"
      >
        {loading ? "提交中..." : `提交订单 · ¥${price.toFixed(2)}`}
      </button>

      <p className="text-center text-[12px] text-[#9ca3af]">
        点击提交后将跳转支付宝完成支付，付款到担保账户
      </p>
    </div>
  );
}
