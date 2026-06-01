import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

  const { id } = await params;
  const { reason, refundAmount, evidenceUrls } = await req.json();

  const { data: order } = await supabase.from('orders').select('*').eq('id', id).single();
  if (!order) return NextResponse.json({ error: '订单不存在' }, { status: 404 });
  if (order.user_id !== user.id) return NextResponse.json({ error: '无权操作' }, { status: 403 });
  if (order.status !== 'shipped') return NextResponse.json({ error: '仅已发货订单可申请退款' }, { status: 400 });

  if (order.inspection_deadline && new Date(order.inspection_deadline) < new Date()) {
    return NextResponse.json({ error: '验货期已过，无法申请退款' }, { status: 400 });
  }

  const { data: refund, error } = await supabase.from('refund_requests').insert({
    order_id: id, user_id: user.id, reason: reason || '',
    refund_amount: refundAmount || order.total_amount,
    evidence_urls: evidenceUrls || [], status: 'pending',
  }).select('id').single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from('orders').update({ status: 'refunding' }).eq('id', id);
  await supabase.from('order_logs').insert({ order_id: id, action: 'refund_requested', operator_id: user.id, details: { reason, refundAmount, refundId: refund.id } });
  return NextResponse.json({ success: true, refundId: refund.id });
}
