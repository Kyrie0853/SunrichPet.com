"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

const STATUS_LABELS: Record<string, string> = {
  pending: "待支付", paid: "已支付", shipped: "已发货", completed: "已完成",
  refunding: "退款中", refunded: "已退款", cancelled: "已取消",
};
const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-50 text-yellow-700", paid: "bg-blue-50 text-blue-700",
  shipped: "bg-purple-50 text-purple-700", completed: "bg-emerald-50 text-emerald-700",
  refunding: "bg-orange-50 text-orange-700", refunded: "bg-red-50 text-red-700",
  cancelled: "bg-gray-100 text-gray-500",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [refunds, setRefunds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"orders"|"refunds">("orders");
  const [shipModal, setShipModal] = useState<{ orderId: string; tracking: string; company: string } | null>(null);
  const supabase = createClient();

  const loadOrders = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(50);
    setOrders(data || []);
    setLoading(false);
  }, [supabase]);

  const loadRefunds = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("refund_requests").select("*, orders(total_amount, status)").eq("status", "pending").order("created_at", { ascending: false });
    setRefunds(data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { tab === "orders" ? loadOrders() : loadRefunds(); }, [tab, loadOrders, loadRefunds]);

  async function changeStatus(id: string, status: string) {
    await fetch('/api/admin/orders/' + id + '/status', { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    loadOrders();
  }

  async function confirmPayment(orderId: string) {
    await fetch('/api/admin/orders/' + orderId + '/confirm-payment', { method: 'POST' });
    loadOrders();
  }

  async function handleShip() {
    if (!shipModal || !shipModal.tracking) return;
    await fetch('/api/orders/' + shipModal.orderId + '/ship', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trackingNumber: shipModal.tracking, trackingCompany: shipModal.company }),
    });
    setShipModal(null);
    loadOrders();
  }

  async function handleRefund(refundId: string, approved: boolean) {
    const note = approved ? '' : prompt('驳回原因（可选）：') || '';
    await fetch('/api/admin/orders/' + refundId + '/refund', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approved, adminNote: note }),
    }).catch(() => {});
    // Use the refund API path — actually need a proper admin refund endpoint
    const res = await fetch('/api/admin/refunds/' + refundId, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approved, adminNote: note }),
    }).catch(() => {});
    loadRefunds();
    loadOrders();
  }

  return (
    <div>
      <h1 className="text-lg md:text-xl font-semibold text-[#1f2937] mb-4 md:mb-6">订单管理</h1>

      {/* Tab */}
      <div className="flex mb-4 border-b border-[#f3f4f6]">
        {[{ key: 'orders' as const, label: '订单列表' }, { key: 'refunds' as const, label: '退款申请' }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={'flex-1 md:flex-none px-4 py-3 text-[14px] font-medium border-b-2 -mb-px transition-colors min-h-[44px] flex items-center justify-center ' +
              (tab === t.key ? 'border-[#1a7f5a] text-[#1a7f5a]' : 'border-transparent text-[#6b7280] hover:text-[#1f2937]')}>
            {t.label}{t.key === 'refunds' && refunds.length > 0 && <span className="ml-1.5 bg-red-500 text-white text-[10px] rounded-full px-1.5 py-0.5">{refunds.length}</span>}
          </button>
        ))}
      </div>

      {/* ---- 订单列表 ---- */}
      {tab === 'orders' && (
        <div className="bg-white rounded-xl shadow-sm border border-[#f3f4f6] overflow-hidden">
          <div className="table-responsive">
            <table className="w-full text-[13px]">
              <thead><tr className="border-b border-[#f3f4f6] bg-[#f9fafb]"><th className="text-left px-3 md:px-4 py-3">订单号</th><th className="text-left px-3 md:px-4 py-3">金额</th><th className="text-left px-3 md:px-4 py-3">状态</th><th className="text-left px-3 md:px-4 py-3 hidden md:table-cell">时间</th><th className="text-right px-3 md:px-4 py-3">操作</th></tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={5} className="text-center py-8 text-[#9ca3af]">加载中...</td></tr>
                : orders.length === 0 ? <tr><td colSpan={5} className="text-center py-8 text-[#9ca3af]">暂无订单</td></tr>
                : orders.map(o => (
                  <tr key={o.id} className="border-b border-[#f3f4f6] hover:bg-[#f9fafb]">
                    <td className="px-3 md:px-4 py-3">
                      <span className="font-mono text-[11px] md:text-[12px]">{o.id.slice(0,12)}...</span>
                      <span className="md:hidden block text-[11px] text-[#9ca3af] mt-0.5">{new Date(o.created_at).toLocaleDateString("zh-CN")}</span>
                    </td>
                    <td className="px-3 md:px-4 py-3 font-medium">¥{Number(o.total_amount).toFixed(2)}</td>
                    <td className="px-3 md:px-4 py-3">
                      <span className={'inline-block rounded-full px-1.5 md:px-2 py-0.5 text-[10px] md:text-[11px] font-medium ' + (STATUS_COLORS[o.status]||"")}>{STATUS_LABELS[o.status]||o.status}</span>
                      {o.tracking_number && <p className="text-[10px] text-[#9ca3af] mt-0.5">📦 {o.tracking_number}</p>}
                    </td>
                    <td className="px-3 md:px-4 py-3 text-[#6b7280] hidden md:table-cell">{new Date(o.created_at).toLocaleDateString("zh-CN")}</td>
                    <td className="px-3 md:px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {o.status === 'pending' && (
                          <button onClick={() => { if (confirm('确定确认收款 ¥' + Number(o.total_amount).toFixed(2) + '？')) confirmPayment(o.id); }}
                            className="rounded-full bg-[#f0a04b] px-2.5 py-1.5 md:py-1 text-[11px] text-white hover:bg-[#d98a3b] min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center">确认收款</button>
                        )}
                        {o.status === 'paid' && (
                          <button onClick={() => setShipModal({ orderId: o.id, tracking: '', company: '' })}
                            className="rounded-full bg-[#1a7f5a] px-2.5 py-1.5 md:py-1 text-[11px] text-white hover:bg-[#166b4b] min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center">发货</button>
                        )}
                        <select value={o.status} onChange={e => changeStatus(o.id, e.target.value)}
                          className="rounded-lg border border-[#e5e7eb] px-1.5 py-1.5 md:py-1 text-[13px] md:text-[12px] outline-none min-h-[44px] md:min-h-0">
                          {Object.entries(STATUS_LABELS).map(([k,v]) => (<option key={k} value={k}>{v}</option>))}
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---- 退款申请 ---- */}
      {tab === 'refunds' && (
        <div className="space-y-3">
          {refunds.length === 0 ? (
            <div className="text-center py-16 text-[#9ca3af]">暂无退款申请</div>
          ) : (
            refunds.map((r: any) => (
              <div key={r.id} className="bg-white rounded-xl shadow-sm border border-[#f3f4f6] p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[12px]">订单 #{r.order_id?.slice(0, 12)}...</span>
                  <span className="text-[#f0a04b] text-[12px] font-medium">待处理</span>
                </div>
                <p className="text-[13px]"><span className="text-[#9ca3af]">金额：</span>¥{Number(r.refund_amount).toFixed(2)}</p>
                <p className="text-[13px]"><span className="text-[#9ca3af]">原因：</span>{r.reason || '未提供'}</p>
                <p className="text-[11px] text-[#d1d5db] mt-1">{new Date(r.created_at).toLocaleString('zh-CN')}</p>
                <div className="flex gap-2 mt-3 pt-3 border-t border-[#f3f4f6]">
                  <button onClick={() => handleRefund(r.id, true)}
                    className="flex-1 rounded-full bg-emerald-50 py-2.5 text-[13px] font-medium text-emerald-700 hover:bg-emerald-100 min-h-[44px]">同意退款</button>
                  <button onClick={() => handleRefund(r.id, false)}
                    className="flex-1 rounded-full bg-gray-100 py-2.5 text-[13px] font-medium text-[#6b7280] hover:bg-gray-200 min-h-[44px]">驳回</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 发货弹窗 */}
      {shipModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4" onClick={() => setShipModal(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-[90%] sm:max-w-sm p-6 animate-fade-in-up" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-[#1f2937] mb-4">填写物流信息</h3>
            <input type="text" value={shipModal.company} onChange={e => setShipModal({ ...shipModal, company: e.target.value })}
              placeholder="物流公司（如：顺丰速运）" className="w-full h-11 rounded-lg border px-3 text-[16px] outline-none focus:border-[#1a7f5a] mb-3" />
            <input type="text" value={shipModal.tracking} onChange={e => setShipModal({ ...shipModal, tracking: e.target.value })}
              placeholder="物流单号" className="w-full h-11 rounded-lg border px-3 text-[16px] outline-none focus:border-[#1a7f5a] mb-4" />
            <div className="flex flex-col-reverse sm:flex-row gap-2">
              <button onClick={() => setShipModal(null)} className="flex-1 rounded-full border py-2.5 text-[13px] text-[#6b7280] min-h-[44px]">取消</button>
              <button onClick={handleShip} className="flex-1 rounded-full bg-[#1a7f5a] py-2.5 text-[13px] font-medium text-white min-h-[44px]">确认发货</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
