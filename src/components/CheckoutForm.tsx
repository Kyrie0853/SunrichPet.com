"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CheckoutForm({ items }: { items: any[] }) {
  const router = useRouter();
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const total = items.reduce((s: any, i: any) => s + i.price * i.quantity, 0);

  async function handleSubmit() {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, shippingAddress: address }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); setLoading(false); return; }
      // 提交成功 → 跳转订单详情
      if (data.orderId) {
        router.push("/orders/" + data.orderId);
      } else {
        router.push("/orders");
      }
    } catch {
      setError("网络错误，请重试");
      setLoading(false);
    }
  }

  return (
    <div className="mt-6 space-y-4">
      <div>
        <label className="mb-1 block text-sm font-semibold text-gray-700">收货信息</label>
        <textarea value={address} onChange={e => setAddress(e.target.value)}
          placeholder="姓名、电话、详细地址（选填）" rows={2}
          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-500" />
      </div>

      {/* 平台担保说明 */}
      <div className="rounded-lg bg-[#e8f5ef] p-3 text-[13px] text-[#1a7f5a]">
        🛡️ <strong>平台担保交易</strong>：提交订单后，请联系平台管理员确认收款。收款确认后，商家将为您发货。收到商品验货无误后，再确认收货。
      </div>

      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

      <button onClick={handleSubmit} disabled={loading}
        className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50">
        {loading ? "提交中..." : "提交订单 · ¥" + total.toFixed(2)}
      </button>
    </div>
  );
}
