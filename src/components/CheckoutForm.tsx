"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";

const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

export default function CheckoutForm({ items }: { items: any[] }) {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCheckout() {
    if (!stripePromise) { setError("支付系统暂未配置"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, shippingAddress: address }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); setLoading(false); return; }
      const stripe = await stripePromise;
      if (stripe && data.url) {
        window.location.href = data.url;
      }
    } catch { setError("支付初始化失败"); }
    setLoading(false);
  }

  return (
    <div className="mt-6 space-y-4">
      <div>
        <label className="mb-1 block text-sm font-semibold text-gray-700">收货地址</label>
        <textarea value={address} onChange={e => setAddress(e.target.value)}
          placeholder="姓名、电话、详细地址" rows={2}
          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-500" />
      </div>
      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}
      <button onClick={handleCheckout} disabled={loading}
        className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50">
        {loading ? "跳转到支付..." : `支付 ¥${items.reduce((s:any,i:any)=>s+i.price*i.quantity,0).toFixed(2)}`}
      </button>
    </div>
  );
}
