import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/admin';
import { logAdminAction } from '@/lib/auth/admin-logs';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await requireAdmin();
  const { id } = await params;
  const { approved, adminNote } = await req.json();
  const supabase = await createClient();

  const { data: refund } = await supabase.from('refund_requests').select('*').eq('id', id).single();
  if (!refund) return NextResponse.json({ error: '退款申请不存在' }, { status: 404 });
  if (refund.status !== 'pending') return NextResponse.json({ error: '该申请已处理' }, { status: 400 });

  const orderId = refund.order_id;
  const { data: order } = await supabase.from('orders').select('*').eq('id', orderId).single();
  const now = new Date().toISOString();

  if (approved) {
    await supabase.from('refund_requests').update({ status: 'approved', admin_note: adminNote, updated_at: now }).eq('id', id);
    await supabase.from('orders').update({ status: 'refunded', refunded_at: now }).eq('id', orderId);
    // 退回 pending balance
    if (order?.seller_id && order?.total_amount > 0) {
      await supabase.rpc('reverse_order_balance', { p_order_id: orderId, p_amount: order.total_amount });
    }
    await supabase.from('order_logs').insert({ order_id: orderId, action: 'refund_approved', operator_id: userId, details: { refundId: id, adminNote } });
    await logAdminAction({ adminId: userId, action: 'approve_refund', targetType: 'refund', targetId: id, details: { orderId, adminNote } });
  } else {
    await supabase.from('refund_requests').update({ status: 'rejected', admin_note: adminNote, updated_at: now }).eq('id', id);
    await supabase.from('orders').update({ status: 'shipped' }).eq('id', orderId);
    await supabase.from('order_logs').insert({ order_id: orderId, action: 'refund_rejected', operator_id: userId, details: { refundId: id, adminNote } });
    await logAdminAction({ adminId: userId, action: 'reject_refund', targetType: 'refund', targetId: id, details: { orderId, adminNote } });
  }

  return NextResponse.json({ success: true });
}
