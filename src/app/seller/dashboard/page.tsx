'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

// ---- 导航链接 ----
const NAV = [
  { href: '/seller/dashboard', label: '首页', icon: '📊' },
  { href: '/seller/dashboard/products', label: '商品管理', icon: '📦' },
  { href: '/seller/dashboard/orders', label: '订单管理', icon: '📋' },
  { href: '/seller/dashboard/finance', label: '账目概览', icon: '💰' },
  { href: '/seller/dashboard/settings', label: '店铺设置', icon: '⚙️' },
];

export default function SellerDashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [score, setScore] = useState<any>(null);
  const [balance, setBalance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u) { router.push('/auth'); return; }
      setUser(u);
      const { data: p } = await supabase.from('profiles').select('*').eq('id', u.id).single();
      if (!p || (p.role !== 'seller' && p.role !== 'admin' && p.role !== 'super_admin')) {
        router.push('/seller/apply'); return;
      }
      setProfile(p);
      const [prodRes, orderRes, scoreRes, balanceRes] = await Promise.all([
        supabase.from('products').select('*').eq('seller_id', u.id).order('created_at', { ascending: false }).limit(20),
        supabase.from('orders').select('*').eq('seller_id', u.id).order('created_at', { ascending: false }).limit(20),
        supabase.from('seller_scores').select('*').eq('seller_id', u.id).maybeSingle(),
        supabase.from('seller_balances').select('*').eq('seller_id', u.id).maybeSingle(),
      ]);
      setProducts(prodRes.data || []);
      setOrders(orderRes.data || []);
      setScore(scoreRes.data);
      setBalance(balanceRes.data || { available_balance: 0, pending_balance: 0, total_earned: 0 });
      setLoading(false);
    }
    load();
  }, [supabase, router]);

  if (loading) return <div className="text-center py-20 text-[#9ca3af]">加载中...</div>;

  const activeProducts = products.filter(p => p.status === 'active').length;
  const pendingOrders = orders.filter(o => o.status === 'paid').length;
  const todayOrders = orders.filter(o => new Date(o.created_at).toDateString() === new Date().toDateString()).length;
  const shippedOrders = orders.filter(o => o.status === 'shipped').length;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:py-10">
      {/* ---- 导航栏 ---- */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#1f2937]">商家后台</h1>
          <p className="text-[13px] text-[#6b7280]">{profile?.display_name || '商家'}，欢迎回来</p>
        </div>
        {/* 移动端菜单按钮 */}
        <button onClick={() => setNavOpen(!navOpen)} className="md:hidden p-2 text-[#6b7280] min-w-[44px] min-h-[44px] flex items-center justify-center">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
      </div>

      {/* 导航链接 */}
      <div className={'md:flex flex-wrap gap-2 mb-6 ' + (navOpen ? 'flex' : 'hidden')}>
        {NAV.map(n => (
          <Link key={n.href} href={n.href}
            className={'rounded-full px-4 py-2 text-[13px] font-medium transition ' + (n.href === '/seller/dashboard' ? 'bg-[#1a7f5a] text-white' : 'border border-[#d1d5db] text-[#6b7280] hover:border-[#1a7f5a]')}>
            {n.icon} {n.label}
          </Link>
        ))}
      </div>

      {/* 数据概览 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
        {[
          { label: '今日新增订单', value: todayOrders, icon: '📝' },
          { label: '待发货订单', value: pendingOrders, icon: '📦' },
          { label: '在售商品', value: activeProducts, icon: '✅' },
          { label: '本月收入', value: '¥' + Number(balance?.total_earned || 0).toFixed(0), icon: '💰' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-4 md:p-5 shadow-sm border">
            <p className="text-[12px] text-[#9ca3af]">{s.label}</p>
            <p className="text-2xl md:text-3xl font-bold text-[#1f2937] mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* 最近订单 — 待处理优先 */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden mb-6">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-[#1f2937]">最近订单</h2>
          <Link href="/seller/dashboard/orders" className="text-[12px] text-[#1a7f5a] hover:underline">查看全部</Link>
        </div>
        {orders.length === 0 ? (
          <div className="text-center py-10 text-[13px] text-[#9ca3af]">暂无订单</div>
        ) : (
          <div className="divide-y">
            {[...orders].sort((a: any, b: any) => {
              const priority: Record<string, number> = { paid: 0, pending: 1, shipped: 2, refunding: 3, completed: 4, refunded: 5, cancelled: 6 };
              return (priority[a.status] ?? 9) - (priority[b.status] ?? 9);
            }).slice(0, 10).map((o: any) => (
              <div key={o.id} className="px-5 py-3 flex items-center justify-between text-[13px]">
                <div>
                  <span className="text-[#1f2937] font-medium">订单 #{o.id.slice(0, 8)}</span>
                  <span className="text-[#9ca3af] ml-2">{new Date(o.created_at).toLocaleDateString('zh-CN')}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[#1f2937] font-medium">¥{Number(o.total_amount || 0).toFixed(2)}</span>
                  <span className={'rounded-full px-2 py-0.5 text-[11px] font-medium ' +
                    (o.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : o.status === 'shipped' ? 'bg-blue-50 text-blue-700' :
                     o.status === 'paid' ? 'bg-amber-50 text-amber-700' : o.status === 'refunding' ? 'bg-orange-50 text-orange-700' :
                     'bg-gray-100 text-gray-600')}>
                    {o.status === 'completed' ? '已完成' : o.status === 'shipped' ? '已发货' : o.status === 'paid' ? '待发货' :
                     o.status === 'refunding' ? '退款中' : o.status === 'pending' ? '待付款' : o.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {(score?.score ?? 100) < 60 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-[13px] text-red-700 mb-4">
          ⚠️ 您的商家评分低于60分，商品已被降权，部分功能受限。请联系平台了解详情。
        </div>
      )}
    </div>
  );
}
