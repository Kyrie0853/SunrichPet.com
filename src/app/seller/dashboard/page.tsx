'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

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
  const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'paid').length;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-bold text-[#1f2937] mb-2">商家后台</h1>
      <p className="text-[#6b7280] text-[14px] mb-8">欢迎回来，{profile?.display_name || '商家'}</p>

      {/* 数据概览 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
        {[
          { label: '可提现余额', value: '¥' + Number(balance?.available_balance || 0).toFixed(2), icon: '💰' },
          { label: '待结算金额', value: '¥' + Number(balance?.pending_balance || 0).toFixed(2), icon: '⏳' },
          { label: '累计收入', value: '¥' + Number(balance?.total_earned || 0).toFixed(2), icon: '📊' },
          { label: '商家评分', value: score?.score ?? 100, icon: '⭐' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-5 shadow-sm border">
            <div className="flex items-center justify-between">
              <span className="text-2xl">{s.icon}</span>
              <span className="text-2xl font-bold text-[#1f2937]">{s.value}</span>
            </div>
            <p className="mt-2 text-[13px] text-[#6b7280]">{s.label}</p>
          </div>
        ))}
      </div>

      {/* 快捷操作 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {[
          { href: '/admin/products', label: '商品管理', desc: '添加/编辑/下架' },
          { href: '/admin/orders', label: '订单管理', desc: '发货/查看退款' },
          { href: '/seller/orders', label: '售后处理', desc: '退款/退货' },
          { href: '/profile/edit', label: '店铺设置', desc: '编辑信息' },
        ].map(op => (
          <Link key={op.label} href={op.href}
            className="bg-white rounded-xl p-4 shadow-sm border hover:border-[#1a7f5a] transition-colors group">
            <h3 className="text-[14px] font-semibold text-[#1f2937] group-hover:text-[#1a7f5a]">{op.label}</h3>
            <p className="text-[12px] text-[#9ca3af] mt-1">{op.desc}</p>
          </Link>
        ))}
      </div>

      {/* 最近订单 */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden mb-6">
        <div className="px-5 py-4 border-b">
          <h2 className="text-[15px] font-semibold text-[#1f2937]">最近订单</h2>
        </div>
        {orders.length === 0 ? (
          <div className="text-center py-8 text-[13px] text-[#9ca3af]">暂无订单</div>
        ) : (
          <div className="divide-y">
            {orders.slice(0, 10).map((o: any) => (
              <div key={o.id} className="px-5 py-3 flex items-center justify-between text-[13px]">
                <div>
                  <span className="text-[#1f2937] font-medium">订单 #{o.id.slice(0, 8)}</span>
                  <span className="text-[#9ca3af] ml-3">{new Date(o.created_at).toLocaleDateString('zh-CN')}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[#1f2937] font-medium">¥{o.total_amount || 0}</span>
                  <span className={'rounded-full px-2 py-0.5 text-[11px] font-medium ' +
                    (o.status === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                     o.status === 'shipped' ? 'bg-blue-50 text-blue-700' :
                     o.status === 'paid' ? 'bg-amber-50 text-amber-700' :
                     'bg-gray-100 text-gray-600')}>
                    {o.status === 'completed' ? '已完成' : o.status === 'shipped' ? '已发货' :
                     o.status === 'paid' ? '已付款' : o.status === 'pending' ? '待付款' : o.status}
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
