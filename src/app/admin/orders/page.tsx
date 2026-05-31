"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

const STATUS_LABELS: Record<string, string> = { pending: "待处理", paid: "已支付", shipped: "已发货", completed: "已完成", cancelled: "已取消" };
const STATUS_COLORS: Record<string, string> = { pending: "bg-yellow-50 text-yellow-700", paid: "bg-blue-50 text-blue-700", shipped: "bg-purple-50 text-purple-700", completed: "bg-emerald-50 text-emerald-700", cancelled: "bg-gray-100 text-gray-500" };

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const loadOrders = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(50);
    setOrders(data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  async function changeStatus(id: string, status: string) {
    await fetch(`/api/admin/orders/${id}/status`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    loadOrders();
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-[#1f2937] mb-6">订单管理</h1>
      <div className="bg-white rounded-xl shadow-sm border border-[#f3f4f6] overflow-hidden">
        <table className="w-full text-[13px]">
          <thead><tr className="border-b border-[#f3f4f6] bg-[#f9fafb]"><th className="text-left px-4 py-3">订单号</th><th className="text-left px-4 py-3">金额</th><th className="text-left px-4 py-3">状态</th><th className="text-left px-4 py-3">时间</th><th className="text-right px-4 py-3">操作</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={5} className="text-center py-8 text-[#9ca3af]">加载中...</td></tr>
            : orders.map(o => (
              <tr key={o.id} className="border-b border-[#f3f4f6] hover:bg-[#f9fafb]">
                <td className="px-4 py-3 font-mono text-[12px]">{o.id.slice(0,12)}...</td>
                <td className="px-4 py-3 font-medium">¥{o.total_amount}</td>
                <td className="px-4 py-3"><span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_COLORS[o.status]||""}`}>{STATUS_LABELS[o.status]||o.status}</span></td>
                <td className="px-4 py-3 text-[#6b7280]">{new Date(o.created_at).toLocaleDateString("zh-CN")}</td>
                <td className="px-4 py-3 text-right">
                  <select value={o.status} onChange={e=>changeStatus(o.id,e.target.value)} className="rounded-lg border border-[#e5e7eb] px-2 py-1 text-[12px] outline-none">
                    {Object.entries(STATUS_LABELS).map(([k,v])=>(<option key={k} value={k}>{v}</option>))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
