"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function OrdersPage() {
  const router = useRouter();
  const [orderId, setOrderId] = useState("");

  function handleSearch() {
    if (orderId.trim()) {
      router.push("/orders/" + orderId.trim());
    }
  }
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-xl md:text-2xl font-bold text-[#1f2937]">订单查询</h1>

      <div className="bg-white rounded-xl border border-[#f3f4f6] p-6 mb-6">
        <p className="text-[14px] text-[#6b7280] mb-1">请输入您的订单编号查询订单状态</p>
        <p className="text-[12px] text-[#9ca3af] mb-4">下单成功后，您可以在订单详情页面查看完整的订单编号</p>

        <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="flex gap-2">
          <input
            type="text"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="输入订单编号..."
            className="flex-1 rounded-xl border border-[#e5e7eb] px-4 py-3 text-[16px] outline-none focus:border-[#1a7f5a]"
          />
          <button
            type="submit"
            className="rounded-xl bg-[#1a7f5a] px-6 py-3 text-[14px] font-medium text-white hover:bg-[#166b4b] transition-colors"
          >
            查询
          </button>
        </form>
      </div>

      <div className="py-16 text-center">
        <p className="text-4xl mb-3">📦</p>
        <p className="text-[#9ca3af] mb-4">提交订单后将获得订单编号</p>
        <Link href="/shop" prefetch={true} className="inline-block rounded-full bg-[#1a7f5a] px-6 py-2.5 text-[14px] font-medium text-white hover:bg-[#166b4b]">去逛逛</Link>
      </div>
    </div>
  );
}
