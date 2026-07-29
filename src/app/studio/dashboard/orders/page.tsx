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
  const [deleteModal, setDeleteModal] = useState<{ orderId: string; shortId: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBatchConfirm, setShowBatchConfirm] = useState(false);
  const [batchDeleting, setBatchDeleting] = useState(false);
  const supabase = createClient();

  const load = useCallback(async () => {
    setLoading(true);
    let query = supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(50);
    if (filter !== "all") query = query.eq("status", filter);
    const { data } = await query;
    setOrders(data || []);
    setLoading(false);
    setSelectedIds(new Set());
  }, [filter, supabase]);

  useEffect(() => { load(); }, [load]);

  // 只允许选中 pending/cancelled 的订单
  const deletableIds = orders.filter(o => o.status === "pending" || o.status === "cancelled").map(o => o.id);
  const allDeletableSelected = deletableIds.length > 0 && deletableIds.every(id => selectedIds.has(id));

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (allDeletableSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(deletableIds));
    }
  }

  async function handleBatchDelete() {
    setBatchDeleting(true);
    try {
      const res = await fetch("/api/admin/orders/batch-delete", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [...selectedIds] }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || "删除失败"); }
      else if (data.rejected > 0) { alert(`已删除 ${data.deleted} 条，${data.rejected} 条因状态不符被跳过`); }
    } catch { alert("网络错误"); }
    setBatchDeleting(false);
    setShowBatchConfirm(false);
    load();
  }

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

  async function handleDelete() {
    if (!deleteModal) return;
    setDeleteLoading(true);
    try {
      const res = await fetch("/api/admin/orders/" + deleteModal.orderId, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "删除失败");
      }
    } catch {
      alert("网络错误");
    }
    setDeleteLoading(false);
    setDeleteModal(null);
    load();
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
      {/* 批量操作栏 */}
      {orders.length > 0 && (
        <div className="flex items-center gap-3 mb-4 px-2">
          <label className="flex items-center gap-2 cursor-pointer min-h-[44px]">
            <input type="checkbox" checked={allDeletableSelected} onChange={toggleSelectAll}
              className="w-5 h-5 accent-[#1a7f5a]" />
            <span className="text-[12px] text-[#6b7280]">全选可删除</span>
          </label>
          {selectedIds.size > 0 && (
            <>
              <span className="text-[12px] text-[#6b7280]">已选 {selectedIds.size} 项</span>
              <button onClick={() => setShowBatchConfirm(true)}
                className="rounded-full bg-red-500 px-3 py-1.5 text-[12px] font-medium text-white hover:bg-red-600 min-h-[44px] flex items-center">
                🗑 批量删除
              </button>
            </>
          )}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-[#f3f4f6] overflow-hidden">
        {loading ? <p className="py-12 text-center text-[#9ca3af]">加载中...</p> :
        orders.length === 0 ? <p className="py-12 text-center text-[#9ca3af]">暂无订单</p> : (
          <div className="table-responsive">
            <table className="w-full text-[13px]">
              <thead><tr className="border-b bg-[#f9fafb]"><th className="text-left px-2 py-3 w-10"><input type="checkbox" checked={allDeletableSelected} onChange={toggleSelectAll} className="w-5 h-5 accent-[#1a7f5a]" /></th><th className="text-left px-3 py-3">订单号</th><th className="text-left px-3 py-3 hidden sm:table-cell">商品</th><th className="text-left px-3 py-3">金额</th><th className="text-left px-3 py-3 hidden lg:table-cell">收货信息</th><th className="text-left px-3 py-3">状态</th><th className="text-left px-3 py-3 hidden md:table-cell">时间</th><th className="text-right px-3 py-3">操作</th></tr></thead>
              <tbody>{orders.map(o => {
                const isDeletable = o.status === "pending" || o.status === "cancelled";
                return (
                <tr key={o.id} className="border-b hover:bg-[#f9fafb]">
                  <td className="px-2 py-3">
                    {isDeletable ? (
                      <input type="checkbox" checked={selectedIds.has(o.id)} onChange={() => toggleSelect(o.id)} className="w-5 h-5 accent-[#1a7f5a]" />
                    ) : (
                      <span className="w-5 h-5 inline-block"></span>
                    )}
                  </td>
                  <td className="px-3 py-3 font-mono text-[11px]">{o.id.slice(0, 10)}...</td>
                  <td className="px-3 py-3 hidden sm:table-cell">{o.product_name || "-"}</td>
                  <td className="px-3 py-3 font-medium">¥{Number(o.total_amount).toFixed(2)}</td>
                  <td className="px-3 py-3 text-[11px] text-[#6b7280] hidden lg:table-cell max-w-[160px] truncate" title={o.shipping_address}>{o.shipping_address || "-"}</td>
                  <td className="px-3 py-3">
                    <span className={"rounded-full px-2 py-0.5 text-[11px] font-medium " + (SC[o.status] || "")}>{SL[o.status] || o.status}</span>
                    {o.tracking_number && <p className="text-[10px] text-[#9ca3af] mt-0.5">📦 {o.tracking_number}</p>}
                  </td>
                  <td className="px-3 py-3 text-[#6b7280] hidden md:table-cell">{new Date(o.created_at).toLocaleDateString("zh-CN")}</td>
                  <td className="px-3 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {o.status === "pending" && (
                        <>
                          <button onClick={() => { if (confirm("确认收到微信转账 ¥" + Number(o.total_amount).toFixed(2) + "？")) confirmPayment(o.id); }}
                            className="rounded-full bg-[#f0a04b] px-2.5 py-1.5 text-[11px] text-white hover:bg-[#d98a3b] min-w-[44px] min-h-[44px] flex items-center">确认收款</button>
                          <button
                            onClick={() => setDeleteModal({ orderId: o.id, shortId: o.id.slice(0, 10) + "..." })}
                            className="rounded-full border border-red-200 px-2 py-1 text-[11px] text-red-400 hover:bg-red-50 min-w-[44px] min-h-[44px] flex items-center"
                            title="删除订单"
                          >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </>
                      )}
                      {o.status === "paid" && (
                        <button onClick={() => setShipModal({ orderId: o.id, tracking: "", company: "" })}
                          className="rounded-full bg-[#1a7f5a] px-2.5 py-1.5 text-[11px] text-white hover:bg-[#166b4b] min-w-[44px] min-h-[44px] flex items-center">发货</button>
                      )}
                      {o.status === "cancelled" && (
                        <button
                          onClick={() => setDeleteModal({ orderId: o.id, shortId: o.id.slice(0, 10) + "..." })}
                          className="rounded-full border border-red-200 px-2 py-1 text-[11px] text-red-400 hover:bg-red-50 min-w-[44px] min-h-[44px] flex items-center"
                          title="删除订单"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
                );
              })}</tbody>
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

      {/* 删除确认弹窗 */}
      {deleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4" onClick={() => !deleteLoading && setDeleteModal(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-4">
              <span className="text-4xl">🗑️</span>
            </div>
            <h3 className="text-lg font-bold text-[#1f2937] mb-2 text-center">确认删除订单</h3>
            <p className="text-[14px] text-[#6b7280] text-center mb-6">
              确定要删除订单 <code className="bg-[#f3f4f6] px-1.5 py-0.5 rounded font-mono text-[13px]">{deleteModal.shortId}</code> 吗？<br />
              <span className="text-red-500 text-[12px]">此操作不可恢复。</span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal(null)}
                disabled={deleteLoading}
                className="flex-1 rounded-full border py-2.5 text-[13px] text-[#6b7280] hover:bg-[#f9fafb] min-h-[44px]"
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="flex-1 rounded-full bg-red-500 py-2.5 text-[13px] font-medium text-white hover:bg-red-600 disabled:opacity-50 min-h-[44px]"
              >
                {deleteLoading ? "删除中..." : "确认删除"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 批量删除确认弹窗 */}
      {showBatchConfirm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4" onClick={() => !batchDeleting && setShowBatchConfirm(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-4"><span className="text-4xl">🗑️</span></div>
            <h3 className="text-lg font-bold text-[#1f2937] mb-2 text-center">确认批量删除订单</h3>
            <p className="text-[14px] text-[#6b7280] text-center mb-6">
              确定要删除选中的 <strong className="text-red-500">{selectedIds.size}</strong> 个订单吗？<br />
              <span className="text-red-500 text-[12px]">此操作不可恢复。仅待付款/已取消的订单会被删除。</span>
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowBatchConfirm(false)} disabled={batchDeleting}
                className="flex-1 rounded-full border py-2.5 text-[13px] text-[#6b7280] hover:bg-[#f9fafb] min-h-[44px]">取消</button>
              <button onClick={handleBatchDelete} disabled={batchDeleting}
                className="flex-1 rounded-full bg-red-500 py-2.5 text-[13px] font-medium text-white hover:bg-red-600 disabled:opacity-50 min-h-[44px]">
                {batchDeleting ? "删除中..." : "确认删除"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
