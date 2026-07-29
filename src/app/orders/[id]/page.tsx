'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

const STATUS_MAP: Record<string, { label: string; color: string; desc: string }> = {
  pending: { label: '待付款', color: 'bg-yellow-50 text-yellow-700', desc: '订单已提交，等待付款' },
  paid: { label: '已付款', color: 'bg-blue-50 text-blue-700', desc: '付款成功，等待商家发货' },
  shipped: { label: '已发货', color: 'bg-purple-50 text-purple-700', desc: '商家已发货，请验货后确认收货' },
  completed: { label: '已完成', color: 'bg-emerald-50 text-emerald-700', desc: '交易完成' },
  refunding: { label: '退款中', color: 'bg-orange-50 text-orange-700', desc: '退款申请处理中' },
  refunded: { label: '已退款', color: 'bg-red-50 text-red-700', desc: '已退款' },
  cancelled: { label: '已取消', color: 'bg-gray-100 text-gray-500', desc: '订单已取消' },
};

// ---- 时间线节点 ----
function TimelineStep({ title, time, active, desc, pending, isLast }: {
  title: string; time?: string; active: boolean; desc?: string; pending?: boolean; isLast?: boolean;
}) {
  const dotColor = active ? 'bg-[#1a7f5a]' : pending ? 'bg-[#f0a04b]' : 'bg-[#d1d5db]';
  const lineColor = active && !isLast ? 'bg-[#1a7f5a]' : 'bg-[#e5e7eb]';
  const textColor = active ? 'text-[#1f2937]' : 'text-[#9ca3af]';
  const timeStr = time ? new Date(time).toLocaleString('zh-CN') : (pending ? '等待中...' : '—');

  return (
    <div className="relative pb-5 last:pb-0">
      {!isLast && <div className={'absolute left-[-17px] top-3 w-0.5 h-full ' + lineColor}></div>}
      <div className={'absolute left-[-22px] top-1 w-3 h-3 rounded-full border-2 border-white ' + dotColor}></div>
      <div className="ml-0">
        <div className="flex items-center gap-2">
          <span className={'text-[14px] font-semibold ' + textColor}>{title}</span>
          {pending && <span className="text-[11px] text-[#f0a04b] animate-pulse">●</span>}
        </div>
        <p className="text-[12px] text-[#9ca3af] mt-0.5">{timeStr}</p>
        {desc && <p className="text-[12px] text-[#6b7280] mt-0.5">{desc}</p>}
      </div>
    </div>
  );
}

function Countdown({ deadline }: { deadline: string }) {
  const [remain, setRemain] = useState('');
  useEffect(() => {
    function tick() {
      const diff = new Date(deadline).getTime() - Date.now();
      if (diff <= 0) { setRemain('已到期'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setRemain(h + '小时' + m + '分钟');
    }
    tick();
    const t = setInterval(tick, 60000);
    return () => clearInterval(t);
  }, [deadline]);
  return <span className="text-[#f0a04b] font-medium">{remain}</span>;
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const supabase = createClient();
  const [order, setOrder] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      // 免登录查看订单 — 直接通过订单 ID 查询
      const { data: o } = await supabase.from('orders').select('*').eq('id', id).single();
      if (!o) { setLoading(false); return; }
      setOrder(o);
      const { data: l } = await supabase.from('order_logs').select('*').eq('order_id', id).order('created_at', { ascending: false });
      setLogs(l || []);
      setLoading(false);
    }
    load();
  }, [id, supabase]);

  if (loading) return <div className="text-center py-20 text-[#9ca3af]">加载中...</div>;
  if (!order) return (
    <div className="text-center py-20">
      <p className="text-4xl mb-3">🔍</p>
      <p className="text-[#9ca3af] text-[15px] mb-4">订单不存在</p>
      <Link href="/orders" className="text-[13px] text-[#1a7f5a] hover:underline">返回订单查询</Link>
    </div>
  );

  const statusInfo = STATUS_MAP[order.status] || { label: order.status, color: 'bg-gray-100', desc: '' };
  const isPending = order.status === 'pending';

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 md:py-10">
      <Link href="/shop" className="text-[13px] text-[#6b7280] hover:text-[#1a7f5a] mb-4 inline-block">&larr; 返回商城</Link>

      <h1 className="text-xl md:text-2xl font-bold text-[#1f2937] mb-6">订单详情</h1>

      {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-[13px] text-red-600">{error}</div>}

      {/* 状态卡片 */}
      <div className="bg-white rounded-xl shadow-sm border border-[#f3f4f6] p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <span className={'rounded-full px-3 py-1 text-[13px] font-medium ' + statusInfo.color}>{statusInfo.label}</span>
          <span className="text-[11px] text-[#9ca3af] font-mono">#{order.id.slice(0, 8)}</span>
        </div>

        {/* 订单状态时间线 */}
        <div className="relative pl-6 space-y-0">
          <TimelineStep
            title="订单已提交"
            time={order.created_at}
            active={true}
            desc={'订单金额 ¥' + Number(order.total_amount).toFixed(2)}
          />
          <TimelineStep
            title="收款已确认"
            time={order.paid_at || (logs.find((l: any) => l.action === 'paid')?.created_at)}
            active={['paid', 'shipped', 'completed', 'refunding', 'refunded'].includes(order.status)}
            desc={isPending ? '等待管理员确认收款' : undefined}
            pending={isPending}
          />
          <TimelineStep
            title="商家已发货"
            time={order.shipped_at}
            active={['shipped', 'completed', 'refunding', 'refunded'].includes(order.status)}
            desc={order.tracking_number ? '物流单号：' + order.tracking_number : undefined}
            pending={order.status === 'paid'}
          />
          <TimelineStep
            title="交易已完成"
            time={order.confirmed_at || order.completed_at}
            active={order.status === 'completed'}
            desc={order.status === 'refunded' ? '已退款' : order.status === 'refunding' ? '退款处理中' : undefined}
            isLast={true}
          />
        </div>

        {order.status === 'shipped' && order.inspection_deadline && (
          <div className="mt-4 bg-[#fef3c7] rounded-lg p-3 text-[13px] text-[#92400e]">
            ⏰ 验货剩余时间：<Countdown deadline={order.inspection_deadline} />
          </div>
        )}
      </div>

      {/* 收货信息 */}
      {order.shipping_address && (
        <div className="bg-white rounded-xl shadow-sm border border-[#f3f4f6] p-5 mb-4">
          <h3 className="font-semibold text-[#1f2937] text-[15px] mb-2">收货信息</h3>
          <p className="text-[13px] text-[#6b7280]">{order.shipping_address}</p>
        </div>
      )}

      {/* 状态提示 */}
      <div className="bg-white rounded-xl shadow-sm border border-[#f3f4f6] p-5 mb-4">
        <h3 className="font-semibold text-[#1f2937] text-[15px] mb-3">当前状态</h3>
        {isPending && (
          <div className="bg-[#fef3c7] rounded-lg p-4 text-center space-y-1.5">
            <p className="text-[14px] text-[#92400e] font-semibold">⏳ 等待付款</p>
            <p className="text-[13px] text-[#92400e]">请通过微信扫码支付 <strong>¥{Number(order.total_amount).toFixed(2)}</strong></p>
            <p className="text-[12px] text-[#a16207]">支付完成后联系客服确认，我们将尽快为您发货</p>
          </div>
        )}
        {order.status === 'paid' && <p className="text-[13px] text-[#9ca3af] text-center">✅ 收款已确认，等待商家发货</p>}
        {order.status === 'shipped' && <p className="text-[13px] text-[#6b7280] text-center">📦 包裹运输中，请留意物流更新</p>}
        {order.status === 'completed' && <p className="text-[13px] text-[#1a7f5a] text-center font-medium">🎉 交易已完成</p>}
        {order.status === 'refunding' && <p className="text-[13px] text-[#f0a04b] text-center font-medium">退款申请处理中</p>}
        {order.status === 'refunded' && <p className="text-[13px] text-[#6b7280] text-center">已退款</p>}
      </div>
    </div>
  );
}
