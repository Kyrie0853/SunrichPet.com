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

export default function SellerFinancePage() {
  const router = useRouter();
  const supabase = createClient();
  const [balance, setBalance] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/auth'); return; }
    const [balRes, orderRes] = await Promise.all([
      supabase.from('seller_balances').select('*').eq('seller_id', user.id).maybeSingle(),
      supabase.from('orders').select('*').eq('seller_id', user.id).in('status', ['paid', 'shipped', 'completed', 'refunded']).order('created_at', { ascending: false }).limit(50),
    ]);
    setBalance(balRes.data || { available_balance: 0, pending_balance: 0, total_earned: 0 });
    setTransactions(orderRes.data || []);
    setLoading(false);
  }, [supabase, router]);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) return <div className="text-center py-20 text-[#9ca3af]">加载中...</div>;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:py-10">
      <div className="flex flex-wrap gap-2 mb-6">
        {NAV.map(n => (<Link key={n.href} href={n.href} className={'rounded-full px-3 md:px-4 py-2 text-[13px] font-medium transition ' + (n.href.includes('/finance') ? 'bg-[#1a7f5a] text-white' : 'border border-[#d1d5db] text-[#6b7280] hover:border-[#1a7f5a]')}>{n.icon} {n.label}</Link>))}
      </div>
      <h2 className="text-lg font-bold text-[#1f2937] mb-4">账目概览</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-8">
        {[
          { label: '累计收入', value: '¥' + Number(balance?.total_earned || 0).toFixed(2), color: 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white' },
          { label: '已结算', value: '¥' + Number(balance?.available_balance || 0).toFixed(2), color: 'bg-white border' },
          { label: '待结算', value: '¥' + Number(balance?.pending_balance || 0).toFixed(2), color: 'bg-white border' },
        ].map(s => (
          <div key={s.label} className={'rounded-xl p-5 shadow-sm ' + s.color}>
            <p className="text-[12px] opacity-80">{s.label}</p>
            <p className="text-2xl md:text-3xl font-bold mt-2">{s.value}</p>
          </div>
        ))}
      </div>
      <div className="bg-[#f9fafb] rounded-xl p-4 text-center mb-8">
        <p className="text-[13px] text-[#6b7280]">💼 提现功能即将上线，请联系平台管理员处理提现</p>
      </div>
      <h3 className="text-[15px] font-semibold text-[#1f2937] mb-3">交易明细</h3>
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {transactions.length === 0 ? <div className="text-center py-12 text-[13px] text-[#9ca3af]">暂无交易记录</div> : (
          <div className="divide-y">{transactions.map((o: any) => (
            <div key={o.id} className="px-4 py-3 flex items-center justify-between text-[13px]">
              <div><span className="font-mono text-[12px]">#{o.id.slice(0, 10)}</span><span className="text-[#9ca3af] ml-2">{new Date(o.created_at).toLocaleDateString('zh-CN')}</span></div>
              <div className="flex items-center gap-3">
                <span className={'text-[11px] ' + (o.status === 'refunded' ? 'text-red-500' : 'text-[#1a7f5a]')}>{o.status === 'refunded' ? '-' : '+'}¥{Number(o.total_amount).toFixed(2)}</span>
                <span className="text-[11px] text-[#9ca3af]">{o.status === 'completed' ? '已结算' : o.status === 'refunded' ? '已退款' : o.status === 'shipped' ? '待结算' : '待处理'}</span>
              </div>
            </div>
          ))}</div>
        )}
      </div>
    </div>
  );
}
