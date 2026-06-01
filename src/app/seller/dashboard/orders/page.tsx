'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

const NAV = [
  { href: '/seller/dashboard', label: '首页', icon: '📊' },
  { href: '/seller/dashboard/products', label: '商品管理', icon: '📦' },
  { href: '/seller/dashboard/orders', label: '订单管理', icon: '📋' },
  { href: '/seller/dashboard/finance', label: '账目概览', icon: '💰' },
  { href: '/seller/dashboard/settings', label: '店铺设置', icon: '⚙️' },
];

const STATUS_TABS = [
  { key: '', label: '全部' },
  { key: 'pending', label: '待确认' },
  { key: 'paid', label: '待发货' },
  { key: 'shipped', label: '已发货' },
  { key: 'completed', label: '已完成' },
  { key: 'refunding', label: '退款中' },
];

const STATUS_MAP: Record<string, string> = {
  pending: '待付款', paid: '待发货', shipped: '已发货', completed: '已完成', refunding: '退款中', refunded: '已退款', cancelled: '已取消',
};
const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700', paid: 'bg-amber-50 text-amber-700', shipped: 'bg-blue-50 text-blue-700', completed: 'bg-emerald-50 text-emerald-700', refunding: 'bg-orange-50 text-orange-700', refunded: 'bg-red-50 text-red-700',
};

export default function SellerOrdersPage() {
  const router = useRouter();
  const supabase = createClient();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [shipModal, setShipModal] = useState<{ orderId: string; tracking: string; company: string } | null>(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/auth'); return; }
    let q = supabase.from('orders').select('*, buyer:profiles!orders_user_id_fkey(display_name)').eq('seller_id', user.id).order('created_at', { ascending: false }).limit(50);
    if (statusFilter) q = q.eq('status', statusFilter);
    const { data } = await q;
    setOrders(data || []);
    setLoading(false);
  }, [supabase, router, statusFilter]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  async function handleShip() {
    if (!shipModal || !shipModal.tracking) return;
    await fetch('/api/orders/' + shipModal.orderId + '/ship', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trackingNumber: shipModal.tracking, trackingCompany: shipModal.company }),
    });
    setShipModal(null); loadOrders();
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:py-10">
      <div className="flex flex-wrap gap-2 mb-6">
        {NAV.map(n => (<Link key={n.href} href={n.href} className={'rounded-full px-3 md:px-4 py-2 text-[13px] font-medium transition ' + (n.href.includes('/orders') ? 'bg-[#1a7f5a] text-white' : 'border border-[#d1d5db] text-[#6b7280] hover:border-[#1a7f5a]')}>{n.icon} {n.label}</Link>))}
      </div>

      <h2 className="text-lg font-bold text-[#1f2937] mb-4">订单管理</h2>

      {/* 状态筛选 */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
        {STATUS_TABS.map(t => (
          <button key={t.key} onClick={() => setStatusFilter(t.key)}
            className={'shrink-0 rounded-full px-3 py-1.5 text-[12px] font-medium transition min-h-[40px] ' + (statusFilter === t.key ? 'bg-[#1a7f5a] text-white' : 'border text-[#6b7280] hover:border-[#1a7f5a]')}>{t.label}</button>
        ))}
      </div>

      {loading ? <div className="text-center py-12 text-[#9ca3af]">加载中...</div> :
        orders.length === 0 ? <div className="text-center py-12 text-[#9ca3af]">暂无订单</div> :
        <div className="space-y-2.5">
          {orders.map((o: any) => (
            <div key={o.id} className="bg-white rounded-xl border p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[12px] text-[#9ca3af]">#{o.id.slice(0, 12)}</span>
                <span className={'rounded-full px-2 py-0.5 text-[11px] font-medium ' + (STATUS_COLOR[o.status] || '')}>{STATUS_MAP[o.status] || o.status}</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[15px] font-bold text-[#1f2937]">¥{Number(o.total_amount).toFixed(2)}</p>
                  <p className="text-[12px] text-[#9ca3af]">{o.buyer?.display_name || '匿名买家'} · {new Date(o.created_at).toLocaleDateString('zh-CN')}</p>
                  {o.tracking_number && <p className="text-[12px] text-[#6b7280] mt-0.5">📦 {o.tracking_company} {o.tracking_number}</p>}
                </div>
                <div>
                  {o.status === 'paid' && (
                    <button onClick={() => setShipModal({ orderId: o.id, tracking: '', company: '' })}
                      className="rounded-full bg-[#1a7f5a] px-4 py-2 text-[13px] font-medium text-white hover:bg-[#166b4b] min-h-[44px]">发货</button>
                  )}
                  {o.status === 'refunding' && <span className="text-[13px] text-[#f0a04b]">⏳ 等待平台处理</span>}
                  {o.status === 'completed' && <span className="text-[13px] text-[#1a7f5a]">✅ 已完成</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      }

      {/* 发货弹窗 */}
      {shipModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4" onClick={() => setShipModal(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-[90%] sm:max-w-sm p-6 animate-fade-in-up" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-[#1f2937] mb-4">填写物流信息</h3>
            <input type="text" value={shipModal.company} onChange={e => setShipModal({ ...shipModal, company: e.target.value })}
              placeholder="物流公司" className="w-full h-11 rounded-lg border px-3 text-[16px] outline-none focus:border-[#1a7f5a] mb-3" />
            <input type="text" value={shipModal.tracking} onChange={e => setShipModal({ ...shipModal, tracking: e.target.value })}
              placeholder="快递单号" className="w-full h-11 rounded-lg border px-3 text-[16px] outline-none focus:border-[#1a7f5a] mb-4" />
            <div className="flex flex-col-reverse sm:flex-row gap-2">
              <button onClick={() => setShipModal(null)} className="flex-1 rounded-full border py-2.5 text-[13px] min-h-[44px]">取消</button>
              <button onClick={handleShip} className="flex-1 rounded-full bg-[#1a7f5a] py-2.5 text-[13px] font-medium text-white min-h-[44px]">确认发货</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
