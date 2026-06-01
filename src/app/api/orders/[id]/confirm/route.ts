import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

  const { id } = await params;
  const { data: order } = await supabase.from('orders').select('*').eq('id', id).single();
  if (!order) return NextResponse.json({ error: '订单不存在' }, { status: 404 });
  if (order.user_id !== user.id) return NextResponse.json({ error: '无权操作' }, { status: 403 });
  if (order.status !== 'shipped') return NextResponse.json({ error: '仅已发货订单可确认收货' }, { status: 400 });

  const now = new Date().toISOString();
  const { error } = await supabase.from('orders').update({ status: 'completed', confirmed_at: now }).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 结算
  if (order.seller_id && order.total_amount > 0) {
    await supabase.rpc('settle_order_balance', { p_order_id: id, p_amount: order.total_amount });
  }

  await supabase.from('order_logs').insert({ order_id: id, action: 'completed', operator_id: user.id });
  return NextResponse.json({ success: true });
}
