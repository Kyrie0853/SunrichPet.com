"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

const SL: Record<string, string> = { pending: "待付款", paid: "已付款", shipped: "已发货", completed: "已完成", refunding: "退款中", refunded: "已退款", cancelled: "已取消" };
const SC: Record<string, string> = { pending: "bg-yellow-50 text-yellow-700", paid: "bg-blue-50 text-blue-700", shipped: "bg-purple-50 text-purple-700", completed: "bg-emerald-50 text-emerald-700", refunding: "bg-orange-50 text-orange-700", refunded: "bg-red-50 text-red-700", cancelled: "bg-gray-100 text-gray-500" };

export default function StudioOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [shipModal, setShipModal] = useState<{ orderId: string; tracking: string; company: string } | null>(null);
  const supabase = createClient();

  const load = useCallback(async () => {
    setLoading(true);
    let query = supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(50);
    if (filter !== "all") query = query.eq("status", filter);
    const { data } = await query;
    setOrders(data || []);
    setLoading(false);
  }, [filter, supabase]);

  useEffect(() => { load(); }, [load]);

  async function confirmPayment(orderId: string) {
    await fetch("/api/admin/orders/" + orderId + "/confirm-payment", { method: "POST" });
    load();
  }

  async function handleShip() {
    if (!shipModal || !shipModal.tracking) return;
    await fetch("/api/orders/" + shipModal.orderId + "/ship", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trackingNumber: shipModal.tracking, trackingCompany: shipModal.company }),
    });
    setShipModal(null); load();
  }

  const FILTERS = [{ key: "all", label: "全部" }, { key: "pending", label: "待付款" }, { key: "paid", label: "已付款" }, { key: "shipped", label: "已发货" }, { key: "completed", label: "已完成" }];

  return (
    <div>
      <h1 className="text-lg md:text-xl font-semibold text-[#1f2937] mb-4">订单管理</h1>
      <div className="flex flex-wrap gap-2 mb-4">
        {FILTERS.map(t => (
          <button key={t.key} onClick={() => setFilter(t.key)}
            className={"rounded-full px-4 py-2 text-[13px] font-medium transition-all min-h-[44px] " + (filter === t.key ? "bg-[#1a7f5a] text-white" : "border border-[#d1d5db] text-[#6b7280] hover:border-[#1a7f5a]")}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-[#f3f4f6] overflow-hidden">
        {loading ? <p className="py-12 text-center text-[#9ca3af]">加载中...</p> :
        orders.length === 0 ? <p className="py-12 text-center text-[#9ca3af]">暂无订单</p> : (
          <div className="table-responsive">
            <table className="w-full text-[13px]">
              <thead><tr className="border-b bg-[#f9fafb]"><th className="text-left px-3 py-3">订单号</th><th className="text-left px-3 py-3 hidden sm:table-cell">商品</th><th className="text-left px-3 py-3">金额</th><th className="text-left px-3 py-3">状态</th><th className="text-left px-3 py-3 hidden md:table-cell">时间</th><th className="text-right px-3 py-3">操作</th></tr></thead>
              <tbody>{orders.map(o => (
                <tr key={o.id} className="border-b hover:bg-[#f9fafb]">
                  <td className="px-3 py-3 font-mono text-[11px]">{o.id.slice(0, 10)}...</td>
                  <td className="px-3 py-3 hidden sm:table-cell">{o.product_name || "-"}</td>
                  <td className="px-3 py-3 font-medium">¥{Number(o.total_amount).toFixed(2)}</td>
                  <td className="px-3 py-3">
                    <span className={"rounded-full px-2 py-0.5 text-[11px] font-medium " + (SC[o.status] || "")}>{SL[o.status] || o.status}</span>
                    {o.tracking_number && <p className="text-[10px] text-[#9ca3af] mt-0.5">📦 {o.tracking_number}</p>}
                  </td>
                  <td className="px-3 py-3 text-[#6b7280] hidden md:table-cell">{new Date(o.created_at).toLocaleDateString("zh-CN")}</td>
                  <td className="px-3 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {o.status === "pending" && (
                        <button onClick={() => { if (confirm("确认收款？")) confirmPayment(o.id); }}
                          className="rounded-full bg-[#f0a04b] px-2.5 py-1.5 text-[11px] text-white hover:bg-[#d98a3b] min-w-[44px] min-h-[44px] flex items-center">确认收款</button>
                      )}
                      {o.status === "paid" && (
                        <button onClick={() => setShipModal({ orderId: o.id, tracking: "", company: "" })}
                          className="rounded-full bg-[#1a7f5a] px-2.5 py-1.5 text-[11px] text-white hover:bg-[#166b4b] min-w-[44px] min-h-[44px] flex items-center">发货</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>
      {shipModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4" onClick={() => setShipModal(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-[#1f2937] mb-4">填写物流信息</h3>
            <input type="text" value={shipModal.company} onChange={e => setShipModal({ ...shipModal, company: e.target.value })}
              placeholder="物流公司（如：顺丰速运）" className="w-full h-11 rounded-lg border px-3 text-[16px] outline-none focus:border-[#1a7f5a] mb-3" />
            <input type="text" value={shipModal.tracking} onChange={e => setShipModal({ ...shipModal, tracking: e.target.value })}
              placeholder="物流单号" className="w-full h-11 rounded-lg border px-3 text-[16px] outline-none focus:border-[#1a7f5a] mb-4" />
            <div className="flex gap-2">
              <button onClick={() => setShipModal(null)} className="flex-1 rounded-full border py-2.5 text-[13px] text-[#6b7280] min-h-[44px]">取消</button>
              <button onClick={handleShip} className="flex-1 rounded-full bg-[#1a7f5a] py-2.5 text-[13px] font-medium text-white min-h-[44px]">确认发货</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
